import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { StartReconciliationDto } from './dto';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a new reconciliation session for a bank account.
   * Opening balance is taken from the last completed reconciliation, or 0 if first time.
   * All non-reconciled bank transactions up to the statement date are loaded as lines.
   */
  async startReconciliation(companyId: string, dto: StartReconciliationDto) {
    // Verify bank account belongs to company
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, companyId },
    });

    if (!bankAccount) {
      throw new NotFoundException(`Bank account ${dto.bankAccountId} not found`);
    }

    // Check no in-progress session exists
    const existingSession = await this.prisma.reconciliationSession.findFirst({
      where: { bankAccountId: dto.bankAccountId, status: 'IN_PROGRESS' },
    });

    if (existingSession) {
      throw new BadRequestException(
        'There is already an in-progress reconciliation session for this bank account. Complete or delete it first.',
      );
    }

    // Calculate opening balance from last completed reconciliation
    const lastCompleted = await this.prisma.reconciliationSession.findFirst({
      where: { bankAccountId: dto.bankAccountId, status: 'COMPLETED' },
      orderBy: { statementDate: 'desc' },
    });

    const openingBalance = lastCompleted
      ? new Decimal(lastCompleted.statementEndBalance.toString())
      : new Decimal(0);

    const statementEndBalance = new Decimal(dto.statementEndBalance);
    const difference = statementEndBalance.minus(openingBalance);

    return this.prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.reconciliationSession.create({
        data: {
          bankAccountId: dto.bankAccountId,
          statementDate: new Date(dto.statementDate),
          statementEndBalance: statementEndBalance.toFixed(4),
          openingBalance: openingBalance.toFixed(4),
          clearedBalance: openingBalance.toFixed(4),
          difference: difference.toFixed(4),
          status: 'IN_PROGRESS',
        },
      });

      // Load all non-reconciled transactions up to statement date
      const transactions = await tx.bankTransaction.findMany({
        where: {
          bankAccountId: dto.bankAccountId,
          isReconciled: false,
          date: { lte: new Date(dto.statementDate) },
          status: { not: 'EXCLUDED' },
        },
        orderBy: { date: 'asc' },
      });

      if (transactions.length > 0) {
        await tx.reconciliationLine.createMany({
          data: transactions.map((t) => ({
            reconciliationSessionId: session.id,
            bankTransactionId: t.id,
            cleared: false,
          })),
        });
      }

      // Fetch complete session
      return tx.reconciliationSession.findUnique({
        where: { id: session.id },
        include: {
          lines: {
            include: { transaction: true },
            orderBy: { transaction: { date: 'asc' } },
          },
        },
      });
    });
  }

  /**
   * Get a reconciliation session with all lines and computed balances.
   */
  async getReconciliation(sessionId: string) {
    const session = await this.prisma.reconciliationSession.findUnique({
      where: { id: sessionId },
      include: {
        lines: {
          include: { transaction: true },
          orderBy: { transaction: { date: 'asc' } },
        },
        bankAccount: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Reconciliation session ${sessionId} not found`);
    }

    // Recalculate cleared balance
    const openingBalance = new Decimal(session.openingBalance.toString());
    let clearedDebits = new Decimal(0);
    let clearedCredits = new Decimal(0);

    for (const line of session.lines) {
      if (line.cleared) {
        const amount = new Decimal(line.transaction.amount.toString());
        if (line.transaction.type === 'CREDIT') {
          clearedCredits = clearedCredits.plus(amount.abs());
        } else {
          clearedDebits = clearedDebits.plus(amount.abs());
        }
      }
    }

    const clearedBalance = openingBalance.plus(clearedCredits).minus(clearedDebits);
    const statementEndBalance = new Decimal(session.statementEndBalance.toString());
    const difference = statementEndBalance.minus(clearedBalance);

    return {
      ...session,
      clearedBalance: clearedBalance.toFixed(4),
      difference: difference.toFixed(4),
      summary: {
        totalLines: session.lines.length,
        clearedLines: session.lines.filter((l) => l.cleared).length,
        unclearedLines: session.lines.filter((l) => !l.cleared).length,
        clearedCredits: clearedCredits.toFixed(4),
        clearedDebits: clearedDebits.toFixed(4),
      },
    };
  }

  /**
   * Toggle the cleared flag on a reconciliation line and recalculate balances.
   */
  async toggleCleared(sessionId: string, transactionId: string) {
    const session = await this.prisma.reconciliationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Reconciliation session ${sessionId} not found`);
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Cannot modify a completed reconciliation session');
    }

    const line = await this.prisma.reconciliationLine.findFirst({
      where: {
        reconciliationSessionId: sessionId,
        bankTransactionId: transactionId,
      },
    });

    if (!line) {
      throw new NotFoundException(
        `Transaction ${transactionId} not found in reconciliation session ${sessionId}`,
      );
    }

    await this.prisma.reconciliationLine.update({
      where: { id: line.id },
      data: { cleared: !line.cleared },
    });

    // Return updated session
    return this.getReconciliation(sessionId);
  }

  /**
   * Complete a reconciliation session.
   * Difference must be 0 (or within ±0.01 rounding tolerance).
   * Marks all cleared transactions as reconciled.
   */
  async completeReconciliation(sessionId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.reconciliationSession.findUnique({
        where: { id: sessionId },
        include: {
          lines: {
            include: { transaction: true },
          },
        },
      });

      if (!session) {
        throw new NotFoundException(`Reconciliation session ${sessionId} not found`);
      }

      if (session.status !== 'IN_PROGRESS') {
        throw new BadRequestException('Session is already completed');
      }

      // Recalculate difference
      const openingBalance = new Decimal(session.openingBalance.toString());
      let clearedCredits = new Decimal(0);
      let clearedDebits = new Decimal(0);

      const clearedLines = session.lines.filter((l) => l.cleared);

      for (const line of clearedLines) {
        const amount = new Decimal(line.transaction.amount.toString());
        if (line.transaction.type === 'CREDIT') {
          clearedCredits = clearedCredits.plus(amount.abs());
        } else {
          clearedDebits = clearedDebits.plus(amount.abs());
        }
      }

      const clearedBalance = openingBalance.plus(clearedCredits).minus(clearedDebits);
      const statementEndBalance = new Decimal(session.statementEndBalance.toString());
      const difference = statementEndBalance.minus(clearedBalance).abs();

      if (difference.greaterThan(new Decimal('0.01'))) {
        throw new BadRequestException(
          `Cannot complete reconciliation: difference is ${difference.toFixed(4)}. Must be 0 (±0.01 tolerance).`,
        );
      }

      // Mark cleared transactions as reconciled
      for (const line of clearedLines) {
        await tx.bankTransaction.update({
          where: { id: line.bankTransactionId },
          data: {
            isReconciled: true,
            status: 'RECONCILED',
          },
        });
      }

      // Complete the session
      const completed = await tx.reconciliationSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          clearedBalance: clearedBalance.toFixed(4),
          difference: '0',
          reconciledBy: userId,
          completedAt: new Date(),
        },
        include: {
          lines: {
            include: { transaction: true },
          },
          bankAccount: true,
        },
      });

      this.logger.log(
        `Reconciliation completed for bank account ${session.bankAccountId}, ` +
        `${clearedLines.length} transactions reconciled`,
      );

      return completed;
    });
  }

  /**
   * Get reconciliation history for a bank account.
   */
  async getReconciliationHistory(bankAccountId: string) {
    return this.prisma.reconciliationSession.findMany({
      where: { bankAccountId, status: 'COMPLETED' },
      orderBy: { statementDate: 'desc' },
      include: {
        _count: { select: { lines: true } },
      },
    });
  }
}
