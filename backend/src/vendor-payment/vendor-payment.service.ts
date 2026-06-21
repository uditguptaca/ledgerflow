import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { AuditService } from '../audit/audit.service';
import { CreateVendorPaymentDto, VendorPaymentFilterDto } from './vendor-payment.dto';
import Decimal from 'decimal.js';

@Injectable()
export class VendorPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postingService: PostingService,
    private readonly accountService: AccountService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a vendor payment, allocate it against bills, post the journal entry,
   * and update bank account balance.
   *
   * Journal: DR Accounts Payable, CR Bank Account
   */
  async createVendorPayment(companyId: string, userId: string, dto: CreateVendorPaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      // Validate vendor
      const vendor = await tx.vendor.findFirst({
        where: { id: dto.vendorId, companyId, isActive: true },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      // Validate bank account
      const bankAccount = await tx.bankAccount.findFirst({
        where: { id: dto.bankAccountId, companyId, isActive: true },
        include: { account: true },
      });
      if (!bankAccount) {
        throw new NotFoundException('Bank account not found');
      }

      // Validate allocation totals match payment amount
      const paymentAmount = new Decimal(dto.amount);
      const allocationTotal = dto.allocations.reduce(
        (sum, a) => sum.add(new Decimal(a.amount)),
        new Decimal(0),
      );

      if (!allocationTotal.eq(paymentAmount)) {
        throw new BadRequestException(
          `Allocation total (${allocationTotal.toString()}) must equal payment amount (${paymentAmount.toString()})`,
        );
      }

      // Generate sequential number
      const company = await tx.company.findUniqueOrThrow({ where: { id: companyId } });
      // Vendor payments share the payment counter but use VPAY prefix
      const vpayNumber = `VPAY-${String(company.nextPaymentNum).padStart(4, '0')}`;

      await tx.company.update({
        where: { id: companyId },
        data: { nextPaymentNum: { increment: 1 } },
      });

      // Create vendor payment record
      const vendorPayment = await tx.vendorPayment.create({
        data: {
          companyId,
          vendorId: dto.vendorId,
          bankAccountId: dto.bankAccountId,
          number: vpayNumber,
          date: new Date(dto.date),
          amount: paymentAmount,
          reference: dto.reference,
          notes: dto.notes,
        },
      });

      // Create allocations and update bills
      for (const alloc of dto.allocations) {
        const bill = await tx.bill.findFirst({
          where: { id: alloc.billId, companyId, vendorId: dto.vendorId },
        });
        if (!bill) {
          throw new NotFoundException(`Bill ${alloc.billId} not found`);
        }
        if (['DRAFT', 'VOID', 'PAID'].includes(bill.status)) {
          throw new BadRequestException(
            `Bill ${bill.number} cannot receive payments (status: ${bill.status})`,
          );
        }

        const allocAmount = new Decimal(alloc.amount);
        const currentDue = new Decimal(bill.amountDue.toString());

        if (allocAmount.gt(currentDue)) {
          throw new BadRequestException(
            `Allocation ${allocAmount.toString()} exceeds amount due ${currentDue.toString()} on bill ${bill.number}`,
          );
        }

        await tx.vendorPaymentAllocation.create({
          data: {
            vendorPaymentId: vendorPayment.id,
            billId: alloc.billId,
            amount: allocAmount,
          },
        });

        const newAmountPaid = new Decimal(bill.amountPaid.toString()).add(allocAmount);
        const newAmountDue = new Decimal(bill.total.toString()).sub(newAmountPaid);
        const newStatus = newAmountDue.lte(0) ? 'PAID' : 'PARTIALLY_PAID';

        await tx.bill.update({
          where: { id: alloc.billId },
          data: {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue.lt(0) ? new Decimal(0) : newAmountDue,
            status: newStatus,
          },
        });
      }

      // Get system accounts
      const apAccount = await this.accountService.getSystemAccount(companyId, 'AP');

      // Post journal: DR AP, CR Bank
      const journal = await this.postingService.postJournal({
        companyId,
        date: new Date(dto.date),
        memo: `Vendor Payment ${vpayNumber} to ${vendor.name}`,
        sourceType: 'VENDOR_PAYMENT',
        sourceId: vendorPayment.id,
        purpose: 'PRIMARY',
        createdBy: userId,
        lines: [
          {
            accountId: apAccount.id,
            debit: paymentAmount,
            credit: new Decimal(0),
            description: `Vendor Payment ${vpayNumber}`,
            vendorId: dto.vendorId,
          },
          {
            accountId: bankAccount.accountId,
            debit: new Decimal(0),
            credit: paymentAmount,
            description: `Vendor Payment ${vpayNumber}`,
          },
        ],
      }, tx);

      // Link journal to vendor payment
      await tx.vendorPayment.update({
        where: { id: vendorPayment.id },
        data: { journalEntryId: journal.id },
      });

      // Update bank balance (subtract — money going out)
      await tx.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: {
          currentBalance: {
            decrement: paymentAmount.toNumber(),
          },
        },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'VENDOR_PAYMENT',
        entityId: vendorPayment.id,
        action: 'CREATE',
        after: { ...vendorPayment, allocations: dto.allocations },
      }, tx);

      return tx.vendorPayment.findUniqueOrThrow({
        where: { id: vendorPayment.id },
        include: {
          vendor: true,
          bankAccount: true,
          allocations: {
            include: {
              bill: { select: { id: true, number: true, total: true, amountDue: true } },
            },
          },
        },
      });
    });
  }

  /**
   * Retrieve a paginated list of vendor payments with optional filters.
   */
  async getVendorPayments(companyId: string, filters?: VendorPaymentFilterDto) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (filters?.vendorId) {
      where.vendorId = filters.vendorId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    if (filters?.search) {
      where.number = { contains: filters.search, mode: 'insensitive' };
    }

    const [payments, total] = await Promise.all([
      this.prisma.vendorPayment.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          bankAccount: { select: { id: true, name: true } },
          _count: { select: { allocations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vendorPayment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve a single vendor payment with full details including bill allocations
   * and linked journal entry.
   */
  async getVendorPayment(companyId: string, vendorPaymentId: string) {
    const payment = await this.prisma.vendorPayment.findFirst({
      where: { id: vendorPaymentId, companyId },
      include: {
        vendor: true,
        bankAccount: true,
        allocations: {
          include: {
            bill: {
              select: { id: true, number: true, date: true, total: true, amountDue: true, status: true },
            },
          },
        },
        journalEntry: {
          include: {
            lines: {
              include: {
                account: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Vendor payment not found');
    }
    return payment;
  }

  /**
   * Void a vendor payment, reversing the journal entry, reversing allocations on bills,
   * and updating the bank account balance.
   */
  async voidVendorPayment(companyId: string, vendorPaymentId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.vendorPayment.findFirst({
        where: { id: vendorPaymentId, companyId },
        include: { allocations: true },
      });

      if (!payment) {
        throw new NotFoundException('Vendor payment not found');
      }

      if (payment.isVoided) {
        throw new BadRequestException('Vendor payment is already voided');
      }

      // Reverse bill payment allocations
      for (const alloc of payment.allocations) {
        const bill = await tx.bill.findUniqueOrThrow({
          where: { id: alloc.billId },
        });

        const allocAmount = new Decimal(alloc.amount.toString());
        const newAmountPaid = new Decimal(bill.amountPaid.toString()).sub(allocAmount);
        const newAmountDue = new Decimal(bill.total.toString()).sub(newAmountPaid);
        const newStatus = newAmountDue.eq(bill.total) ? 'PENDING' : 'PARTIALLY_PAID'; // Wait! For bills, DRAFT is initial, posted goes to PENDING. So when unpaid, goes back to PENDING.

        await tx.bill.update({
          where: { id: alloc.billId },
          data: {
            amountPaid: newAmountPaid.lt(0) ? new Decimal(0) : newAmountPaid,
            amountDue: newAmountDue.gt(bill.total) ? bill.total : newAmountDue,
            status: newStatus,
          },
        });
      }

      // Reverse GL entry
      if (payment.journalEntryId) {
        await this.postingService.voidJournal(payment.journalEntryId, userId);
      }

      // Revert bank account balance (increment since outgoing payment is voided)
      if (payment.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: payment.bankAccountId },
          data: {
            currentBalance: {
              increment: new Decimal(payment.amount.toString()).toNumber(),
            },
          },
        });
      }

      // Mark payment as voided
      const updated = await tx.vendorPayment.update({
        where: { id: payment.id },
        data: {
          isVoided: true,
        },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'VENDOR_PAYMENT',
        entityId: payment.id,
        action: 'VOID',
        before: { isVoided: false },
        after: { isVoided: true },
      }, tx);

      return updated;
    });
  }
}
