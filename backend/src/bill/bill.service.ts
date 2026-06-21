import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { TaxService } from '../tax/tax.service';
import { AuditService } from '../audit/audit.service';
import { CreateBillDto, UpdateBillDto, BillFilterDto } from './bill.dto';
import Decimal from 'decimal.js';

@Injectable()
export class BillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postingService: PostingService,
    private readonly accountService: AccountService,
    private readonly taxService: TaxService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new bill in DRAFT status.
   * Generates a sequential bill number, creates line items,
   * and calculates subtotal, tax, and total amounts.
   */
  async createBill(companyId: string, userId: string, dto: CreateBillDto) {
    return this.prisma.$transaction(async (tx) => {
      // Verify vendor belongs to company
      const vendor = await tx.vendor.findFirst({
        where: { id: dto.vendorId, companyId, isActive: true },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      // Generate sequential number
      const company = await tx.company.findUniqueOrThrow({ where: { id: companyId } });
      const billNumber = `${company.billPrefix}-${String(company.nextBillNum).padStart(4, '0')}`;

      await tx.company.update({
        where: { id: companyId },
        data: { nextBillNum: { increment: 1 } },
      });

      // Calculate line totals and tax
      let subtotal = new Decimal(0);
      let taxTotal = new Decimal(0);

      const lineData: Array<{
        accountId: string;
        description: string | null;
        quantity: Decimal;
        unitPrice: Decimal;
        taxCodeId: string | null;
        taxAmount: Decimal;
        lineTotal: Decimal;
        sortOrder: number;
      }> = [];

      for (let i = 0; i < dto.lines.length; i++) {
        const line = dto.lines[i];

        const account = await tx.account.findFirst({
          where: { id: line.accountId, companyId, isActive: true },
        });
        if (!account) {
          throw new NotFoundException(`Account not found for line ${i + 1}`);
        }

        const quantity = new Decimal(line.quantity);
        const unitPrice = new Decimal(line.unitPrice);
        const lineTotal = quantity.mul(unitPrice);

        let taxAmount = new Decimal(0);
        if (line.taxCodeId) {
          const taxCode = await tx.taxCode.findFirst({
            where: { id: line.taxCodeId, companyId, isActive: true },
          });
          if (!taxCode) {
            throw new NotFoundException(`Tax code not found for line ${i + 1}`);
          }
          const rate = new Decimal(taxCode.rate.toString());
          const taxResult = this.taxService.calculateTax(lineTotal, rate, false);
          taxAmount = taxResult.taxAmount;
        }

        subtotal = subtotal.add(lineTotal);
        taxTotal = taxTotal.add(taxAmount);

        lineData.push({
          accountId: line.accountId,
          description: line.description || null,
          quantity,
          unitPrice,
          taxCodeId: line.taxCodeId || null,
          taxAmount,
          lineTotal,
          sortOrder: i,
        });
      }

      const total = subtotal.add(taxTotal);

      const bill = await tx.bill.create({
        data: {
          companyId,
          vendorId: dto.vendorId,
          number: billNumber,
          vendorInvoiceNo: dto.vendorInvoiceNo,
          date: new Date(dto.date),
          dueDate: new Date(dto.dueDate),
          status: 'DRAFT',
          subtotal,
          taxTotal,
          total,
          amountPaid: new Decimal(0),
          amountDue: total,
          terms: dto.terms ?? vendor.defaultTerms,
          notes: dto.notes,
          lines: {
            create: lineData.map((l) => ({
              accountId: l.accountId,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              taxCodeId: l.taxCodeId,
              taxAmount: l.taxAmount,
              lineTotal: l.lineTotal,
              sortOrder: l.sortOrder,
            })),
          },
        },
        include: { lines: true, vendor: true },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'BILL',
        entityId: bill.id,
        action: 'CREATE',
        after: bill,
      }, tx);

      return bill;
    });
  }

  /**
   * Post a draft bill, creating the double-entry journal.
   * DR Expense/Asset (net per line), DR Tax Receivable (tax), CR Accounts Payable (gross).
   */
  async postBill(companyId: string, billId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: billId, companyId },
        include: { lines: true },
      });
      if (!bill) {
        throw new NotFoundException('Bill not found');
      }
      if (bill.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT bills can be posted');
      }

      // Get system accounts
      const apAccount = await this.accountService.getSystemAccount(companyId, 'AP');
      const taxReceivableAccount = await this.accountService.getSystemAccount(companyId, 'TAX_RECEIVABLE');

      const total = new Decimal(bill.total.toString());
      const taxTotal = new Decimal(bill.taxTotal.toString());

      // Build journal lines
      const journalLines: Array<{
        accountId: string;
        debit: Decimal;
        credit: Decimal;
        description?: string;
        customerId?: string;
        vendorId?: string;
      }> = [];

      // DR Expense/Asset account for each line's net amount
      for (const line of bill.lines) {
        const lineTotal = new Decimal(line.lineTotal.toString());
        if (lineTotal.gt(0)) {
          journalLines.push({
            accountId: line.accountId,
            debit: lineTotal,
            credit: new Decimal(0),
            description: line.description || `Bill ${bill.number} line`,
          });
        }
      }

      // DR Tax Receivable for total tax
      if (taxTotal.gt(0)) {
        journalLines.push({
          accountId: taxReceivableAccount.id,
          debit: taxTotal,
          credit: new Decimal(0),
          description: `Tax on Bill ${bill.number}`,
        });
      }

      // CR Accounts Payable for gross total
      journalLines.push({
        accountId: apAccount.id,
        debit: new Decimal(0),
        credit: total,
        description: `Bill ${bill.number}`,
        vendorId: bill.vendorId,
      });

      // Post journal via PostingService
      const journal = await this.postingService.postJournal({
        companyId,
        date: bill.date,
        memo: `Bill ${bill.number}`,
        sourceType: 'BILL',
        sourceId: bill.id,
        purpose: 'PRIMARY',
        createdBy: userId,
        lines: journalLines,
      }, tx);

      // Link journal and update status
      const updated = await tx.bill.update({
        where: { id: billId },
        data: {
          status: 'PENDING',
          journalEntryId: journal.id,
        },
        include: { lines: true, vendor: true },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'BILL',
        entityId: bill.id,
        action: 'POST',
        before: { status: 'DRAFT' },
        after: { status: 'PENDING', journalEntryId: journal.id },
      }, tx);

      return updated;
    });
  }

  /**
   * Void a posted bill. Cannot void if vendor payments are allocated.
   * Reverses the journal entry and marks the bill as void.
   */
  async voidBill(companyId: string, billId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: billId, companyId },
        include: { paymentAllocations: true },
      });
      if (!bill) {
        throw new NotFoundException('Bill not found');
      }
      if (!['PENDING', 'OVERDUE'].includes(bill.status)) {
        throw new BadRequestException('Only PENDING or OVERDUE bills can be voided');
      }
      if (bill.paymentAllocations.length > 0) {
        throw new ConflictException('Cannot void bill with allocated payments');
      }
      if (!bill.journalEntryId) {
        throw new BadRequestException('Bill has no journal entry to void');
      }

      // Void the journal entry
      await this.postingService.voidJournal(bill.journalEntryId, userId);

      // Update bill
      const updated = await tx.bill.update({
        where: { id: billId },
        data: {
          status: 'VOID',
          isVoided: true,
          amountDue: new Decimal(0),
        },
        include: { lines: true, vendor: true },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'BILL',
        entityId: bill.id,
        action: 'VOID',
        before: { status: bill.status },
        after: { status: 'VOID' },
      }, tx);

      return updated;
    });
  }

  /**
   * Update a draft bill. Only DRAFT bills can be edited.
   * If lines are provided, replaces all existing lines.
   */
  async updateBill(companyId: string, billId: string, userId: string, dto: UpdateBillDto) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: billId, companyId },
        include: { lines: true },
      });
      if (!bill) {
        throw new NotFoundException('Bill not found');
      }
      if (bill.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT bills can be updated');
      }

      if (dto.vendorId) {
        const vendor = await tx.vendor.findFirst({
          where: { id: dto.vendorId, companyId, isActive: true },
        });
        if (!vendor) {
          throw new NotFoundException('Vendor not found');
        }
      }

      const updateData: any = {};
      if (dto.date) updateData.date = new Date(dto.date);
      if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
      if (dto.vendorId) updateData.vendorId = dto.vendorId;
      if (dto.vendorInvoiceNo !== undefined) updateData.vendorInvoiceNo = dto.vendorInvoiceNo;
      if (dto.terms !== undefined) updateData.terms = dto.terms;
      if (dto.notes !== undefined) updateData.notes = dto.notes;

      if (dto.lines) {
        await tx.billLine.deleteMany({ where: { billId } });

        let subtotal = new Decimal(0);
        let taxTotal = new Decimal(0);

        const lineData: Array<{
          billId: string;
          accountId: string;
          description: string | null;
          quantity: Decimal;
          unitPrice: Decimal;
          taxCodeId: string | null;
          taxAmount: Decimal;
          lineTotal: Decimal;
          sortOrder: number;
        }> = [];

        for (let i = 0; i < dto.lines.length; i++) {
          const line = dto.lines[i];

          const account = await tx.account.findFirst({
            where: { id: line.accountId, companyId, isActive: true },
          });
          if (!account) {
            throw new NotFoundException(`Account not found for line ${i + 1}`);
          }

          const quantity = new Decimal(line.quantity);
          const unitPrice = new Decimal(line.unitPrice);
          const lineTotal = quantity.mul(unitPrice);

          let taxAmount = new Decimal(0);
          if (line.taxCodeId) {
            const taxCode = await tx.taxCode.findFirst({
              where: { id: line.taxCodeId, companyId, isActive: true },
            });
            if (!taxCode) {
              throw new NotFoundException(`Tax code not found for line ${i + 1}`);
            }
            const rate = new Decimal(taxCode.rate.toString());
            const taxResult = this.taxService.calculateTax(lineTotal, rate, false);
            taxAmount = taxResult.taxAmount;
          }

          subtotal = subtotal.add(lineTotal);
          taxTotal = taxTotal.add(taxAmount);

          lineData.push({
            billId,
            accountId: line.accountId,
            description: line.description || null,
            quantity,
            unitPrice,
            taxCodeId: line.taxCodeId || null,
            taxAmount,
            lineTotal,
            sortOrder: i,
          });
        }

        const total = subtotal.add(taxTotal);

        await tx.billLine.createMany({ data: lineData });

        updateData.subtotal = subtotal;
        updateData.taxTotal = taxTotal;
        updateData.total = total;
        updateData.amountDue = total;
      }

      const updated = await tx.bill.update({
        where: { id: billId },
        data: updateData,
        include: { lines: true, vendor: true },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'BILL',
        entityId: bill.id,
        action: 'UPDATE',
        before: bill,
        after: updated,
      }, tx);

      return updated;
    });
  }

  /**
   * Retrieve a paginated list of bills with optional filters.
   * Supports status, vendor, date range, and search by number.
   */
  async getBills(companyId: string, filters?: BillFilterDto) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }
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

    const [bills, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bill.count({ where }),
    ]);

    return {
      data: bills,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve a single bill with all details: lines, vendor,
   * payment allocations, and linked journal entry.
   */
  async getBill(companyId: string, billId: string) {
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, companyId },
      include: {
        vendor: true,
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true } },
            taxCode: { select: { id: true, code: true, name: true, rate: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        paymentAllocations: {
          include: {
            vendorPayment: { select: { id: true, number: true, date: true, amount: true } },
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
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }
    return bill;
  }
}
