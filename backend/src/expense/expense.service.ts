import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { TaxService } from '../tax/tax.service';
import { AuditService } from '../audit/audit.service';
import { CreateExpenseDto, ExpenseFilterDto } from './expense.dto';
import Decimal from 'decimal.js';
import { generateUniqueNumber } from '../common/number-generator';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postingService: PostingService,
    private readonly accountService: AccountService,
    private readonly taxService: TaxService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a quick expense, post the journal entry, and update bank balance.
   *
   * Journal:
   *   DR Expense account (net amount)
   *   DR Tax Receivable (tax amount, if applicable)
   *   CR Bank Account or Credit Card Payable (gross amount)
   */
  async createExpense(companyId: string, userId: string, dto: CreateExpenseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Validate expense account
      const expenseAccount = await tx.account.findFirst({
        where: { id: dto.accountId, companyId, isActive: true },
      });
      if (!expenseAccount) {
        throw new NotFoundException('Expense account not found');
      }

      // Validate vendor if provided
      if (dto.vendorId) {
        const vendor = await tx.vendor.findFirst({
          where: { id: dto.vendorId, companyId, isActive: true },
        });
        if (!vendor) {
          throw new NotFoundException('Vendor not found');
        }
      }

      // Validate bank account if provided
      let bankAccount: any = null;
      if (dto.bankAccountId) {
        bankAccount = await tx.bankAccount.findFirst({
          where: { id: dto.bankAccountId, companyId, isActive: true },
          include: { account: true },
        });
        if (!bankAccount) {
          throw new NotFoundException('Bank account not found');
        }
      }

      // Generate sequential number
      const expenseNumber = await generateUniqueNumber(tx, companyId, 'EXPENSE');

      // Calculate tax
      const grossAmount = new Decimal(dto.amount);
      let taxAmount = new Decimal(0);
      let netAmount = grossAmount;

      if (dto.taxCodeId) {
        const taxCode = await tx.taxCode.findFirst({
          where: { id: dto.taxCodeId, companyId, isActive: true },
        });
        if (!taxCode) {
          throw new NotFoundException('Tax code not found');
        }
        const rate = new Decimal(taxCode.rate.toString());
        const taxResult = this.taxService.calculateTax(grossAmount, rate, false);
        taxAmount = taxResult.taxAmount;
        // For expense: gross is what we pay, net is amount minus tax
        // But since the user enters gross amount:
        // netAmount = grossAmount - taxAmount if tax is inclusive
        // Or taxAmount is on top if not inclusive
        // Per spec: amount is the base, tax is added
        netAmount = grossAmount;
        // Total paid = grossAmount + taxAmount
      }

      const totalAmount = netAmount.add(taxAmount);

      // Create expense record
      const expense = await tx.expense.create({
        data: {
          companyId,
          vendorId: dto.vendorId || null,
          accountId: dto.accountId,
          bankAccountId: dto.bankAccountId || null,
          number: expenseNumber,
          date: new Date(dto.date),
          amount: grossAmount,
          taxCodeId: dto.taxCodeId || null,
          taxAmount,
          description: dto.description,
          reference: dto.reference,
          notes: dto.notes,
        },
      });

      // Build journal lines
      const journalLines: Array<{
        accountId: string;
        debit: Decimal;
        credit: Decimal;
        description?: string;
        customerId?: string;
        vendorId?: string;
      }> = [];

      // DR Expense account for net amount
      journalLines.push({
        accountId: dto.accountId,
        debit: netAmount,
        credit: new Decimal(0),
        description: dto.description || `Expense ${expenseNumber}`,
        vendorId: dto.vendorId || undefined,
      });

      // DR Tax Receivable for tax amount
      if (taxAmount.gt(0)) {
        const taxReceivableAccount = await this.accountService.getSystemAccount(companyId, 'TAX_RECEIVABLE');
        journalLines.push({
          accountId: taxReceivableAccount.id,
          debit: taxAmount,
          credit: new Decimal(0),
          description: `Tax on Expense ${expenseNumber}`,
          vendorId: dto.vendorId || undefined,
        });
      }

      // CR Bank Account or Credit Card Payable for gross total
      if (bankAccount) {
        journalLines.push({
          accountId: bankAccount.accountId,
          debit: new Decimal(0),
          credit: totalAmount,
          description: `Expense ${expenseNumber}`,
          vendorId: dto.vendorId || undefined,
        });
      } else {
        // No bank account — credit to Credit Card Payable (AP system account as fallback)
        const creditPayableAccount = await this.accountService.getSystemAccount(companyId, 'AP');
        journalLines.push({
          accountId: creditPayableAccount.id,
          debit: new Decimal(0),
          credit: totalAmount,
          description: `Expense ${expenseNumber}`,
          vendorId: dto.vendorId || undefined,
        });
      }

      // Post journal
      const journal = await this.postingService.postJournal({
        companyId,
        date: new Date(dto.date),
        memo: dto.description || `Expense ${expenseNumber}`,
        sourceType: 'EXPENSE',
        sourceId: expense.id,
        purpose: 'PRIMARY',
        createdBy: userId,
        lines: journalLines,
      }, tx);

      // Link journal to expense
      await tx.expense.update({
        where: { id: expense.id },
        data: { journalEntryId: journal.id },
      });

      // Update bank balance if bank account used
      if (dto.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: dto.bankAccountId },
          data: {
            currentBalance: {
              decrement: totalAmount.toNumber(),
            },
          },
        });
      }

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'EXPENSE',
        entityId: expense.id,
        action: 'CREATE',
        after: expense,
      }, tx);

      return tx.expense.findUniqueOrThrow({
        where: { id: expense.id },
        include: {
          vendor: true,
          account: { select: { id: true, code: true, name: true } },
          bankAccount: { select: { id: true, name: true } },
          taxCode: { select: { id: true, code: true, name: true, rate: true } },
        },
      });
    });
  }

  /**
   * Void an expense. Reverses the journal entry and marks as voided.
   */
  async voidExpense(companyId: string, expenseId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({
        where: { id: expenseId, companyId },
      });
      if (!expense) {
        throw new NotFoundException('Expense not found');
      }
      if (expense.isVoided) {
        throw new BadRequestException('Expense is already voided');
      }
      if (!expense.journalEntryId) {
        throw new BadRequestException('Expense has no journal entry to void');
      }

      // Void the journal entry
      await this.postingService.voidJournal(expense.journalEntryId, userId);

      // Reverse bank balance if bank account was used
      if (expense.bankAccountId) {
        const amount = new Decimal(expense.amount.toString());
        const taxAmount = new Decimal(expense.taxAmount.toString());
        const totalAmount = amount.add(taxAmount);

        await tx.bankAccount.update({
          where: { id: expense.bankAccountId },
          data: {
            currentBalance: {
              increment: totalAmount.toNumber(),
            },
          },
        });
      }

      // Update expense
      const updated = await tx.expense.update({
        where: { id: expenseId },
        data: { isVoided: true },
        include: {
          vendor: true,
          account: { select: { id: true, code: true, name: true } },
          bankAccount: { select: { id: true, name: true } },
          taxCode: { select: { id: true, code: true, name: true, rate: true } },
        },
      });

      await this.auditService.log({
        companyId,
        userId,
        entityType: 'EXPENSE',
        entityId: expense.id,
        action: 'VOID',
        before: { isVoided: false },
        after: { isVoided: true },
      }, tx);

      return updated;
    });
  }

  /**
   * Retrieve a paginated list of expenses with optional filters.
   */
  async getExpenses(companyId: string, filters?: ExpenseFilterDto) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (filters?.vendorId) {
      where.vendorId = filters.vendorId;
    }
    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    if (filters?.search) {
      where.OR = [
        { number: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          account: { select: { id: true, code: true, name: true } },
          bankAccount: { select: { id: true, name: true } },
          taxCode: { select: { id: true, code: true, name: true, rate: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve a single expense with full details including linked journal entry.
   */
  async getExpense(companyId: string, expenseId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, companyId },
      include: {
        vendor: true,
        account: { select: { id: true, code: true, name: true } },
        bankAccount: { select: { id: true, name: true } },
        taxCode: { select: { id: true, code: true, name: true, rate: true } },
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
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }
}
