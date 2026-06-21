import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto, PaymentFilterDto } from './payment.dto';
import Decimal from 'decimal.js';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postingService: PostingService,
    private readonly accountService: AccountService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a customer payment, allocate it against invoices, post the journal entry,
   * and update bank account balance.
   *
   * Journal: DR Bank Account, CR Accounts Receivable
   */
  async createPayment(companyId: string, userId: string, dto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      // Validate customer
      const customer = await tx.customer.findFirst({
        where: { id: dto.customerId, companyId, isActive: true },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
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
      const paymentNumber = `${company.paymentPrefix}-${String(company.nextPaymentNum).padStart(4, '0')}`;

      await tx.company.update({
        where: { id: companyId },
        data: { nextPaymentNum: { increment: 1 } },
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          companyId,
          customerId: dto.customerId,
          bankAccountId: dto.bankAccountId,
          number: paymentNumber,
          date: new Date(dto.date),
          amount: paymentAmount,
          reference: dto.reference,
          notes: dto.notes,
        },
      });

      // Create allocations and update invoices
      for (const alloc of dto.allocations) {
        const invoice = await tx.invoice.findFirst({
          where: { id: alloc.invoiceId, companyId, customerId: dto.customerId },
        });
        if (!invoice) {
          throw new NotFoundException(`Invoice ${alloc.invoiceId} not found`);
        }
        if (['DRAFT', 'VOID', 'PAID'].includes(invoice.status)) {
          throw new BadRequestException(
            `Invoice ${invoice.number} cannot receive payments (status: ${invoice.status})`,
          );
        }

        const allocAmount = new Decimal(alloc.amount);
        const currentDue = new Decimal(invoice.amountDue.toString());

        if (allocAmount.gt(currentDue)) {
          throw new BadRequestException(
            `Allocation ${allocAmount.toString()} exceeds amount due ${currentDue.toString()} on invoice ${invoice.number}`,
          );
        }

        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceId: alloc.invoiceId,
            amount: allocAmount,
          },
        });

        const newAmountPaid = new Decimal(invoice.amountPaid.toString()).add(allocAmount);
        const newAmountDue = new Decimal(invoice.total.toString()).sub(newAmountPaid);
        const newStatus = newAmountDue.lte(0) ? 'PAID' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: alloc.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue.lt(0) ? new Decimal(0) : newAmountDue,
            status: newStatus,
            paidAt: newStatus === 'PAID' ? new Date() : undefined,
          },
        });
      }

      // Get system accounts
      const arAccount = await this.accountService.getSystemAccount(companyId, 'AR');

      // Post journal: DR Bank, CR AR
      const journal = await this.postingService.postJournal({
        companyId,
        date: new Date(dto.date),
        memo: `Payment ${paymentNumber} from ${customer.name}`,
        sourceType: 'PAYMENT',
        sourceId: payment.id,
        purpose: 'PRIMARY',
        createdBy: userId,
        lines: [
          {
            accountId: bankAccount.accountId,
            debit: paymentAmount,
            credit: new Decimal(0),
            description: `Payment ${paymentNumber}`,
          },
          {
            accountId: arAccount.id,
            debit: new Decimal(0),
            credit: paymentAmount,
            description: `Payment ${paymentNumber}`,
            customerId: dto.customerId,
          },
        ],
      }, tx);

      // Link journal to payment
      await tx.payment.update({
        where: { id: payment.id },
        data: { journalEntryId: journal.id },
      });

      // Update bank balance
      await tx.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: {
          currentBalance: {
            increment: paymentAmount.toNumber(),
          },
        },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'PAYMENT',
        entityId: payment.id,
        action: 'CREATE',
        after: { ...payment, allocations: dto.allocations },
      }, tx);

      return tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: {
          customer: true,
          bankAccount: true,
          allocations: {
            include: {
              invoice: { select: { id: true, number: true, total: true, amountDue: true } },
            },
          },
        },
      });
    });
  }

  /**
   * Retrieve a paginated list of payments with optional filters.
   */
  async getPayments(companyId: string, filters?: PaymentFilterDto) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (filters?.customerId) {
      where.customerId = filters.customerId;
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
      this.prisma.payment.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          bankAccount: { select: { id: true, name: true } },
          _count: { select: { allocations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
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
   * Retrieve a single payment with full details including allocations
   * and linked journal entry.
   */
  async getPayment(companyId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId },
      include: {
        customer: true,
        bankAccount: true,
        allocations: {
          include: {
            invoice: {
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
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  /**
   * Void a customer payment, reversing the journal entry, reversing allocations on invoices,
   * and updating the bank account balance.
   */
  async voidPayment(companyId: string, paymentId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, companyId },
        include: { allocations: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.isVoided) {
        throw new BadRequestException('Payment is already voided');
      }

      // Reverse invoice payment allocations
      for (const alloc of payment.allocations) {
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: alloc.invoiceId },
        });

        const allocAmount = new Decimal(alloc.amount.toString());
        const newAmountPaid = new Decimal(invoice.amountPaid.toString()).sub(allocAmount);
        const newAmountDue = new Decimal(invoice.total.toString()).sub(newAmountPaid);
        const newStatus = newAmountDue.eq(invoice.total) ? 'SENT' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: alloc.invoiceId },
          data: {
            amountPaid: newAmountPaid.lt(0) ? new Decimal(0) : newAmountPaid,
            amountDue: newAmountDue.gt(invoice.total) ? invoice.total : newAmountDue,
            status: newStatus,
            paidAt: null,
          },
        });
      }

      // Reverse GL entry
      if (payment.journalEntryId) {
        await this.postingService.voidJournal(payment.journalEntryId, userId);
      }

      // Revert bank account balance
      if (payment.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: payment.bankAccountId },
          data: {
            currentBalance: {
              decrement: new Decimal(payment.amount.toString()).toNumber(),
            },
          },
        });
      }

      // Mark payment as voided
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          isVoided: true,
        },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'PAYMENT',
        entityId: payment.id,
        action: 'VOID',
        before: { isVoided: false },
        after: { isVoided: true },
      }, tx);

      return updated;
    });
  }
}
