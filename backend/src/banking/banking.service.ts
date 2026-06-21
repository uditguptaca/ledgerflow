import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateBankAccountDto,
  CategorizeTransactionDto,
  MatchTransactionDto,
  BankTransactionFilterDto,
  CreateBankRuleDto,
  UpdateBankRuleDto,
} from './dto';

@Injectable()
export class BankingService {
  private readonly logger = new Logger(BankingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Bank Account CRUD ──────────────────────────────────

  /**
   * Create a new bank account linked to a GL account of type CASH_AND_BANK.
   */
  async createBankAccount(companyId: string, dto: CreateBankAccountDto) {
    // Validate the GL account exists and is CASH_AND_BANK
    const glAccount = await this.prisma.account.findFirst({
      where: { id: dto.glAccountId, companyId },
    });

    if (!glAccount) {
      throw new NotFoundException(`GL account ${dto.glAccountId} not found`);
    }

    if (glAccount.subType !== 'CASH_AND_BANK') {
      throw new BadRequestException(
        `GL account must be of subType CASH_AND_BANK, got ${glAccount.subType}`,
      );
    }

    return this.prisma.bankAccount.create({
      data: {
        companyId,
        accountId: dto.glAccountId,
        name: dto.name,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        routingNumber: dto.routingNumber,
        currency: dto.currency ?? 'USD',
      },
      include: { account: true },
    });
  }

  /**
   * List all bank accounts for a company.
   */
  async getBankAccounts(companyId: string) {
    return this.prisma.bankAccount.findMany({
      where: { companyId },
      include: { account: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single bank account by ID.
   */
  async getBankAccount(companyId: string, id: string) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id, companyId },
      include: { account: true },
    });

    if (!bankAccount) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }

    return bankAccount;
  }

  // ─── CSV Import ─────────────────────────────────────────

  /**
   * Import bank transactions from CSV data.
   * Expected CSV columns: date, description, amount (configurable).
   * Creates BankTransaction records for each row.
   */
  async importBankTransactions(
    companyId: string,
    bankAccountId: string,
    csvData: string,
  ): Promise<{ imported: number; batchId: string }> {
    // Verify bank account belongs to this company
    const bankAccount = await this.getBankAccount(companyId, bankAccountId);

    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    if (records.length === 0) {
      throw new BadRequestException('CSV file contains no data rows');
    }

    const batchId = uuidv4();
    const transactions: Array<{
      id: string;
      bankAccountId: string;
      date: Date;
      description: string;
      payee: string | null;
      amount: string;
      type: string;
      reference: string | null;
      status: string;
      importBatch: string;
    }> = [];

    for (const row of records) {
      // Support common CSV column name variations
      const dateStr = row['date'] || row['Date'] || row['DATE'] || row['Transaction Date'];
      const description =
        row['description'] || row['Description'] || row['DESC'] || row['Memo'] || '';
      const amountStr = row['amount'] || row['Amount'] || row['AMOUNT'] || '0';
      const payee = row['payee'] || row['Payee'] || row['PAYEE'] || null;
      const reference = row['reference'] || row['Reference'] || row['REF'] || null;

      if (!dateStr) {
        continue; // Skip rows without a date
      }

      const amount = new Decimal(amountStr.replace(/[,$]/g, ''));
      const type = amount.greaterThan(0) ? 'CREDIT' : 'DEBIT';

      transactions.push({
        id: uuidv4(),
        bankAccountId: bankAccount.id,
        date: new Date(dateStr),
        description: description,
        payee: payee,
        amount: amount.toFixed(4),
        type,
        reference,
        status: 'IMPORTED',
        importBatch: batchId,
      });
    }

    if (transactions.length === 0) {
      throw new BadRequestException('No valid transactions found in CSV');
    }

    await this.prisma.bankTransaction.createMany({
      data: transactions.map((t) => ({
        id: t.id,
        bankAccountId: t.bankAccountId,
        date: t.date,
        description: t.description,
        payee: t.payee,
        amount: t.amount,
        type: t.type,
        reference: t.reference,
        status: t.status,
        importBatch: t.importBatch,
      })),
    });

    this.logger.log(`Imported ${transactions.length} transactions for bank account ${bankAccountId}`);

    return { imported: transactions.length, batchId };
  }

  // ─── Bank Transactions ─────────────────────────────────

  /**
   * Paginated list of bank transactions with optional filters.
   */
  async getBankTransactions(
    companyId: string,
    bankAccountId: string,
    filters: BankTransactionFilterDto,
  ) {
    // Verify bank account belongs to this company
    await this.getBankAccount(companyId, bankAccountId);

    const where: any = { bankAccountId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.bankTransaction.findMany({
        where,
        include: {
          categorizedAccount: true,
          taxCode: true,
          matchedInvoice: { select: { id: true, number: true, total: true } },
          matchedPayment: { select: { id: true, number: true, amount: true } },
          matchedBill: { select: { id: true, number: true, total: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bankTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Categorize ─────────────────────────────────────────

  /**
   * Categorize a bank transaction: assign a GL account, optionally apply tax,
   * and post a balanced journal entry.
   */
  async categorizeTransaction(
    companyId: string,
    transactionId: string,
    dto: CategorizeTransactionDto,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.bankTransaction.findUnique({
        where: { id: transactionId },
        include: { bankAccount: { include: { account: true } } },
      });

      if (!transaction) {
        throw new NotFoundException(`Bank transaction ${transactionId} not found`);
      }

      if (transaction.bankAccount.companyId !== companyId) {
        throw new NotFoundException(`Bank transaction ${transactionId} not found`);
      }

      if (transaction.status !== 'IMPORTED') {
        throw new BadRequestException(
          `Transaction is already ${transaction.status} and cannot be categorized`,
        );
      }

      // Validate the categorized account
      const categorizedAccount = await tx.account.findFirst({
        where: { id: dto.accountId, companyId },
      });

      if (!categorizedAccount) {
        throw new NotFoundException(`Account ${dto.accountId} not found`);
      }

      const bankGlAccountId = transaction.bankAccount.accountId;
      const absAmount = new Decimal(transaction.amount.toString()).abs();

      // Build journal lines
      const lines: Array<{
        accountId: string;
        debit: string;
        credit: string;
        description: string;
      }> = [];

      let taxAmount = new Decimal(0);
      let netAmount = absAmount;

      // Handle tax if provided
      if (dto.taxCodeId) {
        const taxCode = await tx.taxCode.findFirst({
          where: { id: dto.taxCodeId, companyId },
        });

        if (!taxCode) {
          throw new NotFoundException(`Tax code ${dto.taxCodeId} not found`);
        }

        taxAmount = absAmount.mul(new Decimal(taxCode.rate.toString())).div(
          new Decimal(1).plus(new Decimal(taxCode.rate.toString())),
        );
        taxAmount = new Decimal(taxAmount.toFixed(4));
        netAmount = absAmount.minus(taxAmount);

        // Determine tax account based on type
        const taxSystemTag = taxCode.type === 'OUTPUT' ? 'TAX_PAYABLE' : 'TAX_RECEIVABLE';
        const taxAccount = await tx.account.findFirst({
          where: { companyId, systemTag: taxSystemTag },
        });

        if (taxAccount && taxAmount.greaterThan(0)) {
          if (transaction.type === 'CREDIT') {
            // Money in: DR Bank, CR Categorized, CR Tax
            lines.push({
              accountId: bankGlAccountId,
              debit: absAmount.toFixed(4),
              credit: '0',
              description: dto.description || transaction.description,
            });
            lines.push({
              accountId: dto.accountId,
              debit: '0',
              credit: netAmount.toFixed(4),
              description: dto.description || transaction.description,
            });
            lines.push({
              accountId: taxAccount.id,
              debit: '0',
              credit: taxAmount.toFixed(4),
              description: `Tax on: ${dto.description || transaction.description}`,
            });
          } else {
            // Money out: DR Categorized, DR Tax, CR Bank
            lines.push({
              accountId: dto.accountId,
              debit: netAmount.toFixed(4),
              credit: '0',
              description: dto.description || transaction.description,
            });
            lines.push({
              accountId: taxAccount.id,
              debit: taxAmount.toFixed(4),
              credit: '0',
              description: `Tax on: ${dto.description || transaction.description}`,
            });
            lines.push({
              accountId: bankGlAccountId,
              debit: '0',
              credit: absAmount.toFixed(4),
              description: dto.description || transaction.description,
            });
          }
        }
      }

      // No tax or no tax account found – simple two-line entry
      if (lines.length === 0) {
        if (transaction.type === 'CREDIT') {
          // Money in: DR Bank, CR Categorized
          lines.push({
            accountId: bankGlAccountId,
            debit: absAmount.toFixed(4),
            credit: '0',
            description: dto.description || transaction.description,
          });
          lines.push({
            accountId: dto.accountId,
            debit: '0',
            credit: absAmount.toFixed(4),
            description: dto.description || transaction.description,
          });
        } else {
          // Money out: DR Categorized, CR Bank
          lines.push({
            accountId: dto.accountId,
            debit: absAmount.toFixed(4),
            credit: '0',
            description: dto.description || transaction.description,
          });
          lines.push({
            accountId: bankGlAccountId,
            debit: '0',
            credit: absAmount.toFixed(4),
            description: dto.description || transaction.description,
          });
        }
      }

      // Assert balanced
      const totalDebits = lines.reduce((sum, l) => sum.plus(l.debit), new Decimal(0));
      const totalCredits = lines.reduce((sum, l) => sum.plus(l.credit), new Decimal(0));
      if (!totalDebits.equals(totalCredits)) {
        throw new BadRequestException('Journal entry is not balanced – internal error');
      }

      // Get next journal number
      const company = await tx.company.update({
        where: { id: companyId },
        data: { nextJournalNum: { increment: 1 } },
      });

      const journalNumber = `${company.journalPrefix}-${String(company.nextJournalNum - 1).padStart(6, '0')}`;

      // Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId,
          number: journalNumber,
          date: transaction.date,
          memo: dto.description || `Bank transaction: ${transaction.description}`,
          sourceType: 'BANK_TRANSACTION',
          sourceId: transactionId,
          isPosted: true,
          postedAt: new Date(),
          createdBy: userId,
          lines: {
            create: lines,
          },
        },
        include: { lines: true },
      });

      // Update transaction
      const updated = await tx.bankTransaction.update({
        where: { id: transactionId },
        data: {
          categorizedAccountId: dto.accountId,
          taxCodeId: dto.taxCodeId,
          journalEntryId: journalEntry.id,
          status: 'CATEGORIZED',
        },
        include: {
          categorizedAccount: true,
          bankAccount: { include: { account: true } },
        },
      });

      return { transaction: updated, journalEntry };
    });
  }

  // ─── Match ──────────────────────────────────────────────

  /**
   * Match a bank transaction to an existing document (invoice, payment, bill, vendor payment).
   * No new journal entry is needed since the document already posted one.
   */
  async matchTransaction(
    companyId: string,
    transactionId: string,
    dto: MatchTransactionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.bankTransaction.findUnique({
        where: { id: transactionId },
        include: { bankAccount: true },
      });

      if (!transaction) {
        throw new NotFoundException(`Bank transaction ${transactionId} not found`);
      }

      if (transaction.bankAccount.companyId !== companyId) {
        throw new NotFoundException(`Bank transaction ${transactionId} not found`);
      }

      if (!['IMPORTED', 'CATEGORIZED'].includes(transaction.status)) {
        throw new BadRequestException(
          `Transaction is ${transaction.status} and cannot be matched`,
        );
      }

      const updateData: any = { status: 'MATCHED' };

      // Validate and link the matching document
      if (dto.invoiceId) {
        const invoice = await tx.invoice.findFirst({
          where: { id: dto.invoiceId, companyId },
        });
        if (!invoice) throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);
        updateData.matchedInvoiceId = dto.invoiceId;
      }

      if (dto.paymentId) {
        const payment = await tx.payment.findFirst({
          where: { id: dto.paymentId, companyId },
        });
        if (!payment) throw new NotFoundException(`Payment ${dto.paymentId} not found`);
        updateData.matchedPaymentId = dto.paymentId;
      }

      if (dto.billId) {
        const bill = await tx.bill.findFirst({
          where: { id: dto.billId, companyId },
        });
        if (!bill) throw new NotFoundException(`Bill ${dto.billId} not found`);
        updateData.matchedBillId = dto.billId;
      }

      if (dto.vendorPaymentId) {
        const vendorPayment = await tx.vendorPayment.findFirst({
          where: { id: dto.vendorPaymentId, companyId },
        });
        if (!vendorPayment)
          throw new NotFoundException(`Vendor payment ${dto.vendorPaymentId} not found`);
        updateData.matchedVendorPaymentId = dto.vendorPaymentId;
      }

      return tx.bankTransaction.update({
        where: { id: transactionId },
        data: updateData,
        include: {
          matchedInvoice: true,
          matchedPayment: true,
          matchedBill: true,
          bankAccount: true,
        },
      });
    });
  }

  // ─── Auto Match ─────────────────────────────────────────

  /**
   * Attempt to auto-match IMPORTED transactions against existing documents.
   * Returns suggested matches without auto-confirming.
   */
  async autoMatchTransactions(companyId: string, bankAccountId: string) {
    await this.getBankAccount(companyId, bankAccountId);

    const importedTransactions = await this.prisma.bankTransaction.findMany({
      where: { bankAccountId, status: 'IMPORTED' },
      orderBy: { date: 'desc' },
    });

    const suggestions: Array<{
      transactionId: string;
      transactionDescription: string;
      transactionAmount: string;
      matchType: string;
      matchId: string;
      matchNumber: string;
      matchAmount: string;
      confidence: string;
    }> = [];

    for (const txn of importedTransactions) {
      const amount = new Decimal(txn.amount.toString());
      const absAmount = amount.abs();
      const txnDate = txn.date;

      // Date tolerance: ±5 days
      const dateStart = new Date(txnDate);
      dateStart.setDate(dateStart.getDate() - 5);
      const dateEnd = new Date(txnDate);
      dateEnd.setDate(dateEnd.getDate() + 5);

      if (txn.type === 'CREDIT') {
        // Money in → look for payments (customer payments received)
        const payments = await this.prisma.payment.findMany({
          where: {
            companyId,
            isVoided: false,
            amount: absAmount.toFixed(4) as any,
            date: { gte: dateStart, lte: dateEnd },
          },
          take: 3,
        });

        for (const p of payments) {
          const amountMatch = new Decimal(p.amount.toString()).equals(absAmount);
          suggestions.push({
            transactionId: txn.id,
            transactionDescription: txn.description,
            transactionAmount: txn.amount.toString(),
            matchType: 'PAYMENT',
            matchId: p.id,
            matchNumber: p.number,
            matchAmount: p.amount.toString(),
            confidence: amountMatch ? 'HIGH' : 'MEDIUM',
          });
        }

        // Also look for invoices whose total matches
        const invoices = await this.prisma.invoice.findMany({
          where: {
            companyId,
            isVoided: false,
            total: absAmount.toFixed(4) as any,
            date: { gte: dateStart, lte: dateEnd },
          },
          take: 3,
        });

        for (const inv of invoices) {
          suggestions.push({
            transactionId: txn.id,
            transactionDescription: txn.description,
            transactionAmount: txn.amount.toString(),
            matchType: 'INVOICE',
            matchId: inv.id,
            matchNumber: inv.number,
            matchAmount: inv.total.toString(),
            confidence: 'MEDIUM',
          });
        }
      } else {
        // Money out → look for vendor payments or bills
        const vendorPayments = await this.prisma.vendorPayment.findMany({
          where: {
            companyId,
            isVoided: false,
            amount: absAmount.toFixed(4) as any,
            date: { gte: dateStart, lte: dateEnd },
          },
          take: 3,
        });

        for (const vp of vendorPayments) {
          suggestions.push({
            transactionId: txn.id,
            transactionDescription: txn.description,
            transactionAmount: txn.amount.toString(),
            matchType: 'VENDOR_PAYMENT',
            matchId: vp.id,
            matchNumber: vp.number,
            matchAmount: vp.amount.toString(),
            confidence: 'HIGH',
          });
        }

        const bills = await this.prisma.bill.findMany({
          where: {
            companyId,
            isVoided: false,
            total: absAmount.toFixed(4) as any,
            date: { gte: dateStart, lte: dateEnd },
          },
          take: 3,
        });

        for (const b of bills) {
          suggestions.push({
            transactionId: txn.id,
            transactionDescription: txn.description,
            transactionAmount: txn.amount.toString(),
            matchType: 'BILL',
            matchId: b.id,
            matchNumber: b.number,
            matchAmount: b.total.toString(),
            confidence: 'MEDIUM',
          });
        }
      }
    }

    return {
      totalTransactions: importedTransactions.length,
      totalSuggestions: suggestions.length,
      suggestions,
    };
  }

  // ─── Bank Rules ─────────────────────────────────────────

  /**
   * Apply all active bank rules to IMPORTED transactions in the given bank account.
   * Rules are evaluated by priority (lower number = higher priority).
   */
  async applyBankRules(companyId: string, bankAccountId: string) {
    await this.getBankAccount(companyId, bankAccountId);

    const rules = await this.prisma.bankRule.findMany({
      where: { companyId, isActive: true },
      orderBy: { priority: 'asc' },
    });

    if (rules.length === 0) {
      return { applied: 0 };
    }

    const transactions = await this.prisma.bankTransaction.findMany({
      where: { bankAccountId, status: 'IMPORTED' },
    });

    let applied = 0;
    const results: Array<{ transactionId: string; ruleId: string; ruleName: string }> = [];

    for (const txn of transactions) {
      for (const rule of rules) {
        const conditions = rule.conditions as Array<{
          field: string;
          operator: string;
          value: string;
        }>;

        // Check if conditions is an array, otherwise wrap single condition
        const conditionList = Array.isArray(conditions) ? conditions : [conditions];

        const allMatch = conditionList.every((cond) => {
          const fieldValue = this.getTransactionField(txn, cond.field);
          return this.evaluateCondition(fieldValue, cond.operator, cond.value);
        });

        if (allMatch) {
          // Auto-categorize: just set the account/taxCode, don't post journal
          // (journal posting happens when user confirms via categorize endpoint)
          await this.prisma.bankTransaction.update({
            where: { id: txn.id },
            data: {
              categorizedAccountId: rule.accountId,
              taxCodeId: rule.taxCodeId,
            },
          });
          applied++;
          results.push({
            transactionId: txn.id,
            ruleId: rule.id,
            ruleName: rule.name,
          });
          break; // First matching rule wins
        }
      }
    }

    return { applied, results };
  }

  /**
   * Create a new bank rule.
   */
  async createBankRule(companyId: string, dto: CreateBankRuleDto) {
    // Validate account
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, companyId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    if (dto.taxCodeId) {
      const taxCode = await this.prisma.taxCode.findFirst({
        where: { id: dto.taxCodeId, companyId },
      });
      if (!taxCode) {
        throw new NotFoundException(`Tax code ${dto.taxCodeId} not found`);
      }
    }

    return this.prisma.bankRule.create({
      data: {
        companyId,
        name: dto.name,
        conditions: dto.conditions as any,
        accountId: dto.accountId,
        taxCodeId: dto.taxCodeId,
        description: dto.description,
        priority: dto.priority ?? 0,
      },
      include: { account: true, taxCode: true },
    });
  }

  /**
   * List all bank rules for a company.
   */
  async getBankRules(companyId: string) {
    return this.prisma.bankRule.findMany({
      where: { companyId },
      include: { account: true, taxCode: true },
      orderBy: { priority: 'asc' },
    });
  }

  /**
   * Update a bank rule.
   */
  async updateBankRule(companyId: string, id: string, dto: UpdateBankRuleDto) {
    const rule = await this.prisma.bankRule.findFirst({
      where: { id, companyId },
    });

    if (!rule) {
      throw new NotFoundException(`Bank rule ${id} not found`);
    }

    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, companyId },
      });
      if (!account) throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    if (dto.taxCodeId) {
      const taxCode = await this.prisma.taxCode.findFirst({
        where: { id: dto.taxCodeId, companyId },
      });
      if (!taxCode) throw new NotFoundException(`Tax code ${dto.taxCodeId} not found`);
    }

    return this.prisma.bankRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions as any }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.taxCodeId !== undefined && { taxCodeId: dto.taxCodeId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { account: true, taxCode: true },
    });
  }

  /**
   * Delete a bank rule.
   */
  async deleteBankRule(companyId: string, id: string) {
    const rule = await this.prisma.bankRule.findFirst({
      where: { id, companyId },
    });

    if (!rule) {
      throw new NotFoundException(`Bank rule ${id} not found`);
    }

    await this.prisma.bankRule.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Helpers ────────────────────────────────────────────

  private getTransactionField(txn: any, field: string): string {
    switch (field) {
      case 'payee':
        return (txn.payee || '').toLowerCase();
      case 'description':
        return (txn.description || '').toLowerCase();
      case 'amount':
        return new Decimal(txn.amount.toString()).abs().toString();
      default:
        return '';
    }
  }

  private evaluateCondition(fieldValue: string, operator: string, value: string): boolean {
    const lowerValue = value.toLowerCase();
    switch (operator) {
      case 'contains':
        return fieldValue.includes(lowerValue);
      case 'equals':
        return fieldValue === lowerValue;
      case 'startsWith':
        return fieldValue.startsWith(lowerValue);
      case 'endsWith':
        return fieldValue.endsWith(lowerValue);
      case 'greaterThan':
        return new Decimal(fieldValue || '0').greaterThan(new Decimal(value));
      case 'lessThan':
        return new Decimal(fieldValue || '0').lessThan(new Decimal(value));
      default:
        return false;
    }
  }
}
