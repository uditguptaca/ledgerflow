import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto, GetAccountsQueryDto } from './accounting.dto';
import Decimal from 'decimal.js';

/**
 * Valid subTypes for each account type.
 * Ensures users cannot create an ASSET with an ACCOUNTS_PAYABLE subType, etc.
 */
const TYPE_SUBTYPES: Record<string, string[]> = {
  ASSET: ['CASH_AND_BANK', 'ACCOUNTS_RECEIVABLE', 'CURRENT_ASSET', 'INVENTORY', 'FIXED_ASSET', 'OTHER_ASSET'],
  LIABILITY: ['ACCOUNTS_PAYABLE', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'CREDIT_CARD', 'OTHER_LIABILITY'],
  EQUITY: ['OWNERS_EQUITY', 'RETAINED_EARNINGS', 'OPENING_BALANCE', 'OTHER_EQUITY'],
  INCOME: ['SALES_REVENUE', 'OTHER_INCOME'],
  EXPENSE: ['COST_OF_GOODS_SOLD', 'OPERATING_EXPENSE', 'PAYROLL_EXPENSE', 'OTHER_EXPENSE'],
};

/**
 * Default normal balance for each account type.
 * Used for validation — typically ASSET/EXPENSE are DEBIT-normal,
 * LIABILITY/EQUITY/INCOME are CREDIT-normal.
 * Contra accounts are the exception.
 */
const DEFAULT_NORMAL_BALANCE: Record<string, string> = {
  ASSET: 'DEBIT',
  LIABILITY: 'CREDIT',
  EQUITY: 'CREDIT',
  INCOME: 'CREDIT',
  EXPENSE: 'DEBIT',
};

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List accounts for a company with optional filters.
   * If tree=true, returns a nested hierarchy.
   */
  async getAccounts(companyId: string, filters?: GetAccountsQueryDto) {
    const where: any = { companyId };

    if (filters?.type) where.type = filters.type;
    if (filters?.subType) where.subType = filters.subType;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const accounts = await this.prisma.account.findMany({
      where,
      include: { children: true },
      orderBy: { code: 'asc' },
    });

    if (filters?.tree) {
      return this.buildTree(accounts);
    }

    return accounts;
  }

  /**
   * Get a single account by ID, scoped to the company.
   * @throws NotFoundException if account doesn't exist in the company.
   */
  async getAccount(companyId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
      include: { children: true, parent: true },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    return account;
  }

  /**
   * Create a new account in the chart of accounts.
   * Validates code uniqueness, type/subType consistency, and normalBalance.
   * Prevents creation of system accounts via API.
   */
  async createAccount(companyId: string, dto: CreateAccountDto) {
    // Validate type/subType consistency
    const validSubTypes = TYPE_SUBTYPES[dto.type];
    if (!validSubTypes || !validSubTypes.includes(dto.subType)) {
      throw new BadRequestException(
        `SubType '${dto.subType}' is not valid for account type '${dto.type}'. Valid subtypes: ${validSubTypes?.join(', ')}`,
      );
    }

    // Validate normalBalance consistency
    const expectedNormal = DEFAULT_NORMAL_BALANCE[dto.type];
    if (!dto.isContra && dto.normalBalance !== expectedNormal) {
      throw new BadRequestException(
        `Normal balance '${dto.normalBalance}' is incorrect for non-contra '${dto.type}' account. Expected '${expectedNormal}'.`,
      );
    }
    if (dto.isContra && dto.normalBalance === expectedNormal) {
      throw new BadRequestException(
        `Contra account must have opposite normal balance. Expected '${expectedNormal === 'DEBIT' ? 'CREDIT' : 'DEBIT'}'.`,
      );
    }

    // Check code uniqueness within company
    const existing = await this.prisma.account.findUnique({
      where: { companyId_code: { companyId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(`Account code '${dto.code}' already exists in this company`);
    }

    // Validate parent if provided
    if (dto.parentId) {
      const parent = await this.prisma.account.findFirst({
        where: { id: dto.parentId, companyId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent account ${dto.parentId} not found`);
      }
      if (parent.type !== dto.type) {
        throw new BadRequestException(
          `Parent account type '${parent.type}' does not match new account type '${dto.type}'`,
        );
      }
    }

    return this.prisma.account.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        subType: dto.subType,
        normalBalance: dto.normalBalance,
        isContra: dto.isContra ?? false,
        isSystem: false, // Cannot create system accounts via API
        parentId: dto.parentId,
        description: dto.description,
      },
    });
  }

  /**
   * Update an existing account.
   * Cannot change type/subType of system accounts.
   * Cannot deactivate an account with a non-zero balance.
   */
  async updateAccount(companyId: string, accountId: string, dto: UpdateAccountDto) {
    const account = await this.getAccount(companyId, accountId);

    // If deactivating, check for non-zero balance
    if (dto.isActive === false && account.isActive) {
      const balance = await this.getAccountBalance(companyId, accountId);
      if (!balance.equals(new Decimal(0))) {
        throw new BadRequestException(
          `Cannot deactivate account '${account.name}' with non-zero balance of ${balance.toFixed(4)}`,
        );
      }
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Find a system account by its systemTag (e.g., 'AR', 'AP', 'TAX_PAYABLE').
   * Used by the posting engine to resolve control accounts.
   * @throws NotFoundException if the system account is not configured.
   */
  async getSystemAccount(companyId: string, systemTag: string) {
    const account = await this.prisma.account.findFirst({
      where: { companyId, systemTag, isActive: true },
    });

    if (!account) {
      throw new NotFoundException(
        `System account with tag '${systemTag}' not found for this company. ` +
        `Please run the chart of accounts setup.`,
      );
    }

    return account;
  }

  /**
   * Calculate account balance by summing all posted, non-voided journal lines.
   * DEBIT-normal accounts: SUM(debit) - SUM(credit)
   * CREDIT-normal accounts: SUM(credit) - SUM(debit)
   */
  private async getAccountBalance(companyId: string, accountId: string): Promise<Decimal> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) {
      return new Decimal(0);
    }

    const aggregation = await this.prisma.journalLine.aggregate({
      where: {
        accountId,
        journalEntry: {
          companyId,
          isPosted: true,
          isVoided: false,
        },
      },
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
   * Build a tree structure from a flat list of accounts.
   * Roots are accounts with no parentId.
   */
  private buildTree(accounts: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const account of accounts) {
      map.set(account.id, { ...account, children: [] });
    }

    for (const account of accounts) {
      const node = map.get(account.id);
      if (account.parentId && map.has(account.parentId)) {
        map.get(account.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
