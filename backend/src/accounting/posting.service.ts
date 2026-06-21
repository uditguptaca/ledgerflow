import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AccountService } from './account.service';
import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';

// ── Interfaces ───────────────────────────────────────────

export interface JournalLine {
  accountId: string;
  debit?: string | Decimal;
  credit?: string | Decimal;
  description?: string;
  customerId?: string;
  vendorId?: string;
  projectId?: string;
  classTag?: string;
  locationTag?: string;
}

export interface PostJournalParams {
  companyId: string;
  date: Date;
  memo?: string;
  sourceType: string;
  sourceId?: string;
  purpose?: string;
  lines: JournalLine[];
  createdBy: string;
}

interface TrialBalanceRow {
  id: string;
  code: string;
  name: string;
  type: string;
  subType: string;
  debit: string;
  credit: string;
}

interface TrialBalanceResult {
  accounts: TrialBalanceRow[];
  totalDebits: string;
  totalCredits: string;
  isBalanced: boolean;
}

interface GeneralLedgerEntry {
  date: Date;
  number: string;
  memo: string | null;
  sourceType: string;
  sourceId: string | null;
  debit: string;
  credit: string;
  runningBalance: string;
  journalEntryId: string;
  lineDescription: string | null;
}

interface GeneralLedgerResult {
  account: {
    id: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
  };
  openingBalance: string;
  entries: GeneralLedgerEntry[];
  closingBalance: string;
}

/**
 * Control account tags that cannot be posted to via MANUAL journal entries.
 * These accounts are controlled exclusively by sub-ledger modules
 * (invoices, bills, payments, etc.).
 */
const CONTROL_ACCOUNT_TAGS = new Set([
  'AR',
  'AP',
  'TAX_PAYABLE',
  'TAX_RECEIVABLE',
  'INVENTORY',
  'GRNI',
  'RETAINED_EARNINGS',
  'OPENING_BALANCE_EQUITY',
]);

@Injectable()
export class PostingService {
  private readonly logger = new Logger(PostingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService,
  ) {}

  /**
   * THE CORE POSTING ENGINE.
   *
   * Creates a balanced, posted journal entry with all lines in a single
   * database transaction. This is the ONLY way data enters the general ledger.
   *
   * Steps:
   * 1. Validate each line has exactly one of debit/credit, and amount > 0
   * 2. Balance check: total debits === total credits (Decimal.js exact arithmetic)
   * 3. Period check: cannot post to a HARD_CLOSE period
   * 4. Control account check: MANUAL entries cannot touch control accounts
   * 5. Idempotency: unique constraint on (companyId, sourceType, sourceId, purpose)
   * 6. Generate sequential journal number (JE-0001)
   * 7. Create JournalEntry + JournalLines
   * 8. Log audit event
   *
   * @throws BadRequestException if lines are invalid or unbalanced
   * @throws ForbiddenException if period is closed or control account is targeted
   */
  async postJournal(params: PostJournalParams, tx?: Prisma.TransactionClient) {
    const {
      companyId,
      date,
      memo,
      sourceType,
      sourceId,
      lines,
      createdBy,
    } = params;
    const purpose = params.purpose ?? 'PRIMARY';
    const client = tx || this.prisma;

    // ── Step 1: Validate Lines ───────────────────────────

    if (!lines || lines.length < 2) {
      throw new BadRequestException('Journal entry must have at least 2 lines');
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const debitVal = line.debit !== undefined && line.debit !== null ? new Decimal(line.debit.toString()) : new Decimal(0);
      const creditVal = line.credit !== undefined && line.credit !== null ? new Decimal(line.credit.toString()) : new Decimal(0);

      const hasDebit = debitVal.gt(0);
      const hasCredit = creditVal.gt(0);

      if (!hasDebit && !hasCredit) {
        throw new BadRequestException(
          `Line ${i + 1}: must have either debit or credit`,
        );
      }
      if (hasDebit && hasCredit) {
        throw new BadRequestException(
          `Line ${i + 1}: cannot have both debit and credit`,
        );
      }

      const amount = hasDebit ? debitVal : creditVal;
      if (amount.lessThanOrEqualTo(0)) {
        throw new BadRequestException(
          `Line ${i + 1}: amount must be greater than zero, got ${amount.toFixed(4)}`,
        );
      }
    }

    // ── Step 2: Balance Check ────────────────────────────

    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const line of lines) {
      if (line.debit) {
        totalDebits = totalDebits.plus(new Decimal(line.debit));
      }
      if (line.credit) {
        totalCredits = totalCredits.plus(new Decimal(line.credit));
      }
    }

    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `Journal entry is not balanced: debits=${totalDebits.toFixed(4)}, credits=${totalCredits.toFixed(4)}`,
      );
    }

    // ── Step 3: Period Check ─────────────────────────────

    const period = await client.fiscalPeriod.findFirst({
      where: {
        fiscalYear: { companyId },
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (period && period.status === 'HARD_CLOSE') {
      throw new ForbiddenException('Cannot post to a closed period');
    }

    // ── Step 4: Control Account Check ────────────────────

    if (sourceType === 'MANUAL') {
      const accountIds = lines.map((l) => l.accountId);
      const accounts = await client.account.findMany({
        where: {
          id: { in: accountIds },
          companyId,
          systemTag: { not: null },
        },
        select: { id: true, name: true, systemTag: true },
      });

      for (const account of accounts) {
        if (account.systemTag && CONTROL_ACCOUNT_TAGS.has(account.systemTag)) {
          throw new ForbiddenException(
            `Cannot manually post to control account: ${account.name}`,
          );
        }
      }
    }

    // ── Step 5–9: Create in Transaction ──────────────────

    try {
      const runInTx = async (tx: Prisma.TransactionClient) => {
        // Step 6: Generate number
        const company = await tx.company.update({
          where: { id: companyId },
          data: { nextJournalNum: { increment: 1 } },
        });

        const journalNum = company.nextJournalNum - 1; // We incremented, so subtract 1
        const number = `${company.journalPrefix}-${String(journalNum).padStart(4, '0')}`;

        // Step 7: Create JournalEntry
        const journalEntry = await tx.journalEntry.create({
          data: {
            companyId,
            number,
            date,
            memo,
            sourceType,
            sourceId,
            purpose,
            isPosted: true,
            postedAt: new Date(),
            createdBy,
            lines: {
              create: lines.map((line) => ({
                accountId: line.accountId,
                debit: line.debit ? new Decimal(line.debit).toFixed(4) : '0',
                credit: line.credit ? new Decimal(line.credit).toFixed(4) : '0',
                description: line.description,
                customerId: line.customerId,
                vendorId: line.vendorId,
                projectId: line.projectId,
                classTag: line.classTag,
                locationTag: line.locationTag,
              })),
            },
          },
          include: { lines: true },
        });

        // Step 9: Log audit event
        await tx.auditEvent.create({
          data: {
            companyId,
            userId: createdBy,
            entityType: 'JournalEntry',
            entityId: journalEntry.id,
            action: 'POST',
            after: {
              number: journalEntry.number,
              date: journalEntry.date,
              sourceType,
              sourceId,
              purpose,
              totalDebits: totalDebits.toFixed(4),
              totalCredits: totalCredits.toFixed(4),
              lineCount: lines.length,
            } as any,
          },
        });

        return journalEntry;
      };

      if (tx) {
        return await runInTx(tx);
      } else {
        return await this.prisma.$transaction(runInTx);
      }
    } catch (error: any) {
      // Step 5: Idempotency — handle unique constraint violation
      // Prisma error code P2002 = unique constraint violation
      if (error.code === 'P2002') {
        const existing = await client.journalEntry.findFirst({
          where: { companyId, sourceType, sourceId, purpose },
          include: { lines: true },
        });

        if (existing) {
          this.logger.warn(
            `Idempotent catch: returning existing journal ${existing.number} ` +
            `for ${sourceType}/${sourceId}/${purpose}`,
          );
          return existing;
        }
      }
      throw error;
    }
  }

  /**
   * Void a posted journal entry by creating a reversal entry.
   *
   * 1. Find original journal — must be posted and not already voided
   * 2. Create REVERSAL journal: swap debit↔credit on every line
   * 3. Mark original as isVoided=true
   * 4. Return the reversal journal
   *
   * @throws NotFoundException if journal not found
   * @throws BadRequestException if already voided or not posted
   */
  async voidJournal(journalEntryId: string, userId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    const original = await client.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: { lines: true },
    });

    if (!original) {
      throw new NotFoundException(`Journal entry ${journalEntryId} not found`);
    }

    if (!original.isPosted) {
      throw new BadRequestException('Cannot void a journal entry that is not posted');
    }

    if (original.isVoided) {
      throw new BadRequestException('Journal entry is already voided');
    }

    // Build reversal lines: swap debit and credit
    const reversalLines: JournalLine[] = original.lines.map((line) => ({
      accountId: line.accountId,
      debit: new Decimal(line.credit.toString()).greaterThan(0)
        ? new Decimal(line.credit.toString()).toFixed(4)
        : undefined,
      credit: new Decimal(line.debit.toString()).greaterThan(0)
        ? new Decimal(line.debit.toString()).toFixed(4)
        : undefined,
      description: `Reversal: ${line.description || ''}`.trim(),
      customerId: line.customerId ?? undefined,
      vendorId: line.vendorId ?? undefined,
      projectId: line.projectId ?? undefined,
      classTag: line.classTag ?? undefined,
      locationTag: line.locationTag ?? undefined,
    }));

    const runInTx = async (tx: Prisma.TransactionClient) => {
      // Create the reversal journal via the posting engine
      // We need to do this within the transaction manually since
      // postJournal creates its own transaction
      const company = await tx.company.update({
        where: { id: original.companyId },
        data: { nextJournalNum: { increment: 1 } },
      });

      const journalNum = company.nextJournalNum - 1;
      const number = `${company.journalPrefix}-${String(journalNum).padStart(4, '0')}`;

      const reversalEntry = await tx.journalEntry.create({
        data: {
          companyId: original.companyId,
          number,
          date: new Date(),
          memo: `Void/Reversal of ${original.number}: ${original.memo || ''}`.trim(),
          sourceType: original.sourceType,
          sourceId: original.sourceId,
          purpose: 'REVERSAL',
          isPosted: true,
          postedAt: new Date(),
          createdBy: userId,
          reversalOfId: original.id,
          lines: {
            create: reversalLines.map((line) => ({
              accountId: line.accountId,
              debit: line.debit ?? '0',
              credit: line.credit ?? '0',
              description: line.description,
              customerId: line.customerId,
              vendorId: line.vendorId,
              projectId: line.projectId,
              classTag: line.classTag,
              locationTag: line.locationTag,
            })),
          },
        },
        include: { lines: true },
      });

      // Mark original as voided
      await tx.journalEntry.update({
        where: { id: original.id },
        data: { isVoided: true },
      });

      // Audit log
      await tx.auditEvent.create({
        data: {
          companyId: original.companyId,
          userId,
          entityType: 'JournalEntry',
          entityId: original.id,
          action: 'VOID',
          before: { number: original.number, isVoided: false } as any,
          after: {
            number: original.number,
            isVoided: true,
            reversalJournalId: reversalEntry.id,
            reversalNumber: reversalEntry.number,
          } as any,
        },
      });

      this.logger.log(
        `Voided journal ${original.number} → reversal ${reversalEntry.number}`,
      );

      return reversalEntry;
    };

    if (tx) {
      return await runInTx(tx);
    } else {
      return await this.prisma.$transaction(runInTx);
    }
  }

  /**
   * Calculate the balance for a single account as of a given date.
   *
   * Sums all debit and credit journal lines where the parent JournalEntry
   * is posted, not voided, and has a date <= asOfDate.
   *
   * For DEBIT-normal accounts: SUM(debit) - SUM(credit)
   * For CREDIT-normal accounts: SUM(credit) - SUM(debit)
   */
  async getAccountBalance(
    companyId: string,
    accountId: string,
    asOfDate?: Date,
  ): Promise<Decimal> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const whereClause: any = {
      accountId,
      journalEntry: {
        companyId,
        isPosted: true,
        isVoided: false,
      },
    };

    if (asOfDate) {
      whereClause.journalEntry.date = { lte: asOfDate };
    }

    const aggregation = await this.prisma.journalLine.aggregate({
      where: whereClause,
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const totalDebit = new Decimal(aggregation._sum.debit?.toString() ?? '0');
    const totalCredit = new Decimal(aggregation._sum.credit?.toString() ?? '0');

    if (account.normalBalance === 'DEBIT') {
      return totalDebit.minus(totalCredit);
    } else {
      return totalCredit.minus(totalDebit);
    }
  }

  /**
   * Generate a trial balance as of a specific date.
   *
   * For every active account, computes the balance. Debit-normal accounts
   * with positive balances appear in the debit column; credit-normal in credit.
   * Negative (unusual) balances appear in the opposite column.
   *
   * totalDebits must equal totalCredits — verified with isBalanced flag.
   */
  async getTrialBalance(
    companyId: string,
    asOfDate: Date,
  ): Promise<TrialBalanceResult> {
    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: 'asc' },
    });

    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);
    const rows: TrialBalanceRow[] = [];

    for (const account of accounts) {
      const balance = await this.getAccountBalance(companyId, account.id, asOfDate);

      // Skip zero-balance accounts
      if (balance.equals(0)) {
        rows.push({
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          subType: account.subType,
          debit: '0.0000',
          credit: '0.0000',
        });
        continue;
      }

      let debit = '0.0000';
      let credit = '0.0000';

      if (account.normalBalance === 'DEBIT') {
        if (balance.greaterThan(0)) {
          debit = balance.toFixed(4);
          totalDebits = totalDebits.plus(balance);
        } else {
          // Unusual negative balance on debit-normal → shows in credit
          credit = balance.abs().toFixed(4);
          totalCredits = totalCredits.plus(balance.abs());
        }
      } else {
        // CREDIT normal
        if (balance.greaterThan(0)) {
          credit = balance.toFixed(4);
          totalCredits = totalCredits.plus(balance);
        } else {
          // Unusual negative balance on credit-normal → shows in debit
          debit = balance.abs().toFixed(4);
          totalDebits = totalDebits.plus(balance.abs());
        }
      }

      rows.push({
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        subType: account.subType,
        debit,
        credit,
      });
    }

    return {
      accounts: rows,
      totalDebits: totalDebits.toFixed(4),
      totalCredits: totalCredits.toFixed(4),
      isBalanced: totalDebits.equals(totalCredits),
    };
  }

  /**
   * General Ledger report for a single account over a date range.
   *
   * Returns:
   * - account metadata
   * - opening balance (balance as of day before startDate)
   * - individual entries with running balance
   * - closing balance (last running balance)
   */
  async getGeneralLedger(
    companyId: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GeneralLedgerResult> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    // Opening balance: as of day before startDate
    const dayBefore = new Date(startDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const openingBalance = await this.getAccountBalance(companyId, accountId, dayBefore);

    // Fetch journal lines within the date range
    const journalLines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        journalEntry: {
          companyId,
          isPosted: true,
          isVoided: false,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        journalEntry: {
          select: {
            id: true,
            number: true,
            date: true,
            memo: true,
            sourceType: true,
            sourceId: true,
          },
        },
      },
      orderBy: {
        journalEntry: { date: 'asc' },
      },
    });

    // Build entries with running balance
    let runningBalance = new Decimal(openingBalance.toString());
    const entries: GeneralLedgerEntry[] = [];

    for (const line of journalLines) {
      const debitAmt = new Decimal(line.debit.toString());
      const creditAmt = new Decimal(line.credit.toString());

      // Adjust running balance based on normal balance direction
      if (account.normalBalance === 'DEBIT') {
        runningBalance = runningBalance.plus(debitAmt).minus(creditAmt);
      } else {
        runningBalance = runningBalance.plus(creditAmt).minus(debitAmt);
      }

      entries.push({
        date: line.journalEntry.date,
        number: line.journalEntry.number,
        memo: line.journalEntry.memo,
        sourceType: line.journalEntry.sourceType,
        sourceId: line.journalEntry.sourceId,
        debit: debitAmt.toFixed(4),
        credit: creditAmt.toFixed(4),
        runningBalance: runningBalance.toFixed(4),
        journalEntryId: line.journalEntry.id,
        lineDescription: line.description,
      });
    }

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
      },
      openingBalance: openingBalance.toFixed(4),
      entries,
      closingBalance: runningBalance.toFixed(4),
    };
  }

  /**
   * List journal entries with pagination and optional filters.
   */
  async getJournals(
    companyId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      sourceType?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters.sourceType) {
      where.sourceType = filters.sourceType;
    }

    const [entries, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true } },
            },
          },
        },
        orderBy: [{ date: 'desc' }, { number: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return {
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single journal entry by ID with all lines.
   */
  async getJournal(companyId: string, journalEntryId: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: journalEntryId, companyId },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, type: true } },
          },
        },
        reversalOf: { select: { id: true, number: true } },
        reversedBy: { select: { id: true, number: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Journal entry ${journalEntryId} not found`);
    }

    return entry;
  }
}
