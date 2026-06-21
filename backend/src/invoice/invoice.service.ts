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
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceFilterDto } from './invoice.dto';
import Decimal from 'decimal.js';
import { generateUniqueNumber } from '../common/number-generator';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postingService: PostingService,
    private readonly accountService: AccountService,
    private readonly taxService: TaxService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new invoice in DRAFT status.
   * Generates a sequential invoice number, creates line items,
   * and calculates subtotal, tax, and total amounts.
   */
  async createInvoice(companyId: string, userId: string, dto: CreateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      // Verify customer belongs to company
      const customer = await tx.customer.findFirst({
        where: { id: dto.customerId, companyId, isActive: true },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Generate sequential number
      const invoiceNumber = await generateUniqueNumber(tx, companyId, 'INVOICE');

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

        // Verify account belongs to company
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

      // Create invoice with lines
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          customerId: dto.customerId,
          number: invoiceNumber,
          date: new Date(dto.date),
          dueDate: new Date(dto.dueDate),
          status: 'DRAFT',
          subtotal,
          taxTotal,
          total,
          amountPaid: new Decimal(0),
          amountDue: total,
          terms: dto.terms ?? customer.defaultTerms,
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
        include: { lines: true, customer: true },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'INVOICE',
        entityId: invoice.id,
        action: 'CREATE',
        after: invoice,
      }, tx);

      return invoice;
    });
  }

  /**
   * Post a draft invoice, creating the double-entry journal.
   * DR Accounts Receivable (gross), CR Revenue (net per line), CR Tax Payable (tax).
   */
  async postInvoice(companyId: string, invoiceId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, companyId },
        include: { lines: true },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      if (invoice.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT invoices can be posted');
      }

      // Get system accounts
      const arAccount = await this.accountService.getSystemAccount(companyId, 'AR');
      const taxPayableAccount = await this.accountService.getSystemAccount(companyId, 'TAX_PAYABLE');

      const total = new Decimal(invoice.total.toString());
      const taxTotal = new Decimal(invoice.taxTotal.toString());

      // Build journal lines
      const journalLines: Array<{
        accountId: string;
        debit: Decimal;
        credit: Decimal;
        description?: string;
        customerId?: string;
        vendorId?: string;
      }> = [];

      // DR Accounts Receivable for gross total
      journalLines.push({
        accountId: arAccount.id,
        debit: total,
        credit: new Decimal(0),
        description: `Invoice ${invoice.number}`,
        customerId: invoice.customerId,
      });

      // CR Revenue for each line's net amount
      for (const line of invoice.lines) {
        const lineTotal = new Decimal(line.lineTotal.toString());
        if (lineTotal.gt(0)) {
          journalLines.push({
            accountId: line.accountId,
            debit: new Decimal(0),
            credit: lineTotal,
            description: line.description || `Invoice ${invoice.number} line`,
          });
        }
      }

      // CR Tax Payable for total tax
      if (taxTotal.gt(0)) {
        journalLines.push({
          accountId: taxPayableAccount.id,
          debit: new Decimal(0),
          credit: taxTotal,
          description: `Tax on Invoice ${invoice.number}`,
        });
      }

      // Post journal via PostingService
      const journal = await this.postingService.postJournal({
        companyId,
        date: invoice.date,
        memo: `Invoice ${invoice.number}`,
        sourceType: 'INVOICE',
        sourceId: invoice.id,
        purpose: 'PRIMARY',
        createdBy: userId,
        lines: journalLines,
      }, tx);

      // Link journal and update status
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'SENT',
          journalEntryId: journal.id,
          sentAt: new Date(),
        },
        include: { lines: true, customer: true },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'INVOICE',
        entityId: invoice.id,
        action: 'POST',
        before: { status: 'DRAFT' },
        after: { status: 'SENT', journalEntryId: journal.id },
      }, tx);

      return updated;
    });
  }

  /**
   * Void a posted invoice. Cannot void if payments are allocated.
   * Reverses the journal entry and marks the invoice as void.
   */
  async voidInvoice(companyId: string, invoiceId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, companyId },
        include: { paymentAllocations: true },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      if (!['SENT', 'OVERDUE'].includes(invoice.status)) {
        throw new BadRequestException('Only SENT or OVERDUE invoices can be voided');
      }
      if (invoice.paymentAllocations.length > 0) {
        throw new ConflictException('Cannot void invoice with allocated payments');
      }
      if (!invoice.journalEntryId) {
        throw new BadRequestException('Invoice has no journal entry to void');
      }

      // Void the journal entry
      await this.postingService.voidJournal(invoice.journalEntryId, userId);

      // Update invoice
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'VOID',
          isVoided: true,
          voidedAt: new Date(),
          amountDue: new Decimal(0),
        },
        include: { lines: true, customer: true },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'INVOICE',
        entityId: invoice.id,
        action: 'VOID',
        before: { status: invoice.status },
        after: { status: 'VOID' },
      }, tx);

      return updated;
    });
  }

  /**
   * Update a draft invoice. Only DRAFT invoices can be edited.
   * If lines are provided, replaces all existing lines.
   */
  async updateInvoice(companyId: string, invoiceId: string, userId: string, dto: UpdateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, companyId },
        include: { lines: true },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      if (invoice.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT invoices can be updated');
      }

      if (dto.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: dto.customerId, companyId, isActive: true },
        });
        if (!customer) {
          throw new NotFoundException('Customer not found');
        }
      }

      // If lines provided, recalculate
      let updateData: any = {};
      if (dto.date) updateData.date = new Date(dto.date);
      if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
      if (dto.customerId) updateData.customerId = dto.customerId;
      if (dto.terms !== undefined) updateData.terms = dto.terms;
      if (dto.notes !== undefined) updateData.notes = dto.notes;

      if (dto.lines) {
        // Delete existing lines and recalculate
        await tx.invoiceLine.deleteMany({ where: { invoiceId } });

        let subtotal = new Decimal(0);
        let taxTotal = new Decimal(0);

        const lineData: Array<{
          invoiceId: string;
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
            invoiceId,
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

        await tx.invoiceLine.createMany({ data: lineData });

        updateData.subtotal = subtotal;
        updateData.taxTotal = taxTotal;
        updateData.total = total;
        updateData.amountDue = total;
      }

      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: updateData,
        include: { lines: true, customer: true },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'INVOICE',
        entityId: invoice.id,
        action: 'UPDATE',
        before: invoice,
        after: updated,
      }, tx);

      return updated;
    });
  }

  /**
   * Retrieve a paginated list of invoices with optional filters.
   * Supports status, customer, date range, and search by number.
   */
  async getInvoices(companyId: string, filters?: InvoiceFilterDto) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }
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

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve a single invoice with all details: lines, customer,
   * payment allocations, and linked journal entry.
   */
  async getInvoice(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        customer: true,
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true } },
            taxCode: { select: { id: true, code: true, name: true, rate: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        paymentAllocations: {
          include: {
            payment: { select: { id: true, number: true, date: true, amount: true } },
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
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }
}
