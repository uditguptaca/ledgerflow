import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './company.dto';
const path = require('path');
const fs = require('fs');

function getSharedConstantsPath() {
  const paths = [
    path.resolve(__dirname, '..', '..', '..', '..', 'packages', 'shared', 'dist', 'constants'),
    path.resolve(__dirname, '..', '..', '..', 'packages', 'shared', 'dist', 'constants'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p + '.js')) {
      return p;
    }
  }
  return paths[0]; // fallback
}

const DEFAULT_CHART_OF_ACCOUNTS = require(getSharedConstantsPath()).DEFAULT_CHART_OF_ACCOUNTS as any[];
import Decimal from 'decimal.js';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new company under a workspace.
   * Automatically seeds the default chart of accounts, tax codes, and current fiscal calendar.
   */
  async createCompany(workspaceId: string, userId: string, dto: CreateCompanyDto) {
    // 1. Verify user is OWNER or ADMIN of the workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('Access denied: not a member of this workspace');
    }

    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Access denied: only owners or admins can create companies');
    }

    // 2. Perform creation and seeding inside a database transaction to ensure double-entry/system integrity
    const company = await this.prisma.$transaction(async (tx) => {
      // Create company
      const newCompany = await tx.company.create({
        data: {
          workspaceId,
          name: dto.name,
          legalName: dto.legalName || null,
          country: dto.country || 'US',
          baseCurrency: dto.baseCurrency || 'USD',
          taxId: dto.taxId || null,
          fiscalYearStartMonth: dto.fiscalYearStartMonth || 1,
        },
      });

      // Add creator to company user as COMPANY_ADMIN
      await tx.companyUser.create({
        data: {
          userId,
          companyId: newCompany.id,
          role: 'COMPANY_ADMIN',
        },
      });

      // Seed chart of accounts
      await tx.account.createMany({
        data: DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
          companyId: newCompany.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          subType: acc.subType,
          normalBalance: acc.normalBalance,
          isSystem: acc.isSystem,
          isContra: acc.isContra,
          systemTag: acc.systemTag || null,
          description: acc.description || null,
        })),
      });

      // Seed basic tax codes
      const taxCodesData = [
        {
          companyId: newCompany.id,
          code: 'GST',
          name: 'Goods and Services Tax',
          rate: new Decimal(0.1000),
          type: 'OUTPUT',
          description: 'Standard Goods and Services Tax (10%)',
        },
        {
          companyId: newCompany.id,
          code: 'TAX-FREE',
          name: 'Tax Free',
          rate: new Decimal(0.0000),
          type: 'NONE',
          description: 'Zero-rated tax (0%)',
        },
        {
          companyId: newCompany.id,
          code: 'REDUCED',
          name: 'Reduced Rate Tax',
          rate: new Decimal(0.0500),
          type: 'OUTPUT',
          description: 'Reduced rate tax (5%)',
        },
      ];

      await tx.taxCode.createMany({
        data: taxCodesData,
      });

      // Create default FiscalYear and 12 monthly FiscalPeriods
      const startMonth = dto.fiscalYearStartMonth || 1;
      const currentYear = new Date().getFullYear();
      const startDate = new Date(Date.UTC(currentYear, startMonth - 1, 1));
      const endDate = new Date(Date.UTC(currentYear + 1, startMonth - 1, 1));
      endDate.setUTCDate(endDate.getUTCDate() - 1); // Last day of 12th month

      const fiscalYear = await tx.fiscalYear.create({
        data: {
          companyId: newCompany.id,
          name: `FY ${startDate.getUTCFullYear()}`,
          startDate,
          endDate,
          status: 'ACTIVE',
        },
      });

      const periodsData = [];
      for (let p = 1; p <= 12; p++) {
        const periodStart = new Date(Date.UTC(currentYear, startMonth - 1 + (p - 1), 1));
        const periodEnd = new Date(Date.UTC(currentYear, startMonth - 1 + p, 1));
        periodEnd.setUTCDate(periodEnd.getUTCDate() - 1);

        const monthName = periodStart.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
        const periodName = `${monthName} ${periodStart.getUTCFullYear()}`;

        periodsData.push({
          fiscalYearId: fiscalYear.id,
          periodNumber: p,
          name: periodName,
          startDate: periodStart,
          endDate: periodEnd,
          status: 'OPEN',
        });
      }

      await tx.fiscalPeriod.createMany({
        data: periodsData,
      });

      return newCompany;
    });

    return company;
  }

  /**
   * List companies the user has access to in a specific workspace.
   */
  async getCompanies(workspaceId: string | undefined, userId: string) {
    let activeWorkspaceId = workspaceId;
    if (!activeWorkspaceId || activeWorkspaceId === 'undefined' || activeWorkspaceId === 'null') {
      const defaultMember = await this.prisma.workspaceMember.findFirst({
        where: { userId, isActive: true },
        select: { workspaceId: true },
      });
      if (!defaultMember) {
        throw new ForbiddenException('User is not a member of any workspace');
      }
      activeWorkspaceId = defaultMember.workspaceId;
    }

    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: activeWorkspaceId } },
    });

    if (!workspaceMember || !workspaceMember.isActive) {
      throw new ForbiddenException('Access denied: not a member of this workspace');
    }

    // Workspace owners/admins can see all companies in the workspace
    if (['OWNER', 'ADMIN'].includes(workspaceMember.role)) {
      return this.prisma.company.findMany({
        where: { workspaceId: activeWorkspaceId, isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    // Non-admin: must have an explicit CompanyUser membership
    const companyUsers = await this.prisma.companyUser.findMany({
      where: {
        userId,
        isActive: true,
        company: {
          workspaceId: activeWorkspaceId,
          isActive: true,
        },
      },
      include: {
        company: true,
      },
      orderBy: {
        company: {
          name: 'asc',
        },
      },
    });

    return companyUsers.map((cu) => cu.company);
  }

  /**
   * Get a single company by ID.
   */
  async getCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  /**
   * Update company details.
   */
  async updateCompany(companyId: string, userId: string, dto: UpdateCompanyDto) {
    const company = await this.getCompany(companyId);

    // Verify workspace access and role
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: company.workspaceId,
        },
      },
    });

    if (workspaceMember && workspaceMember.isActive && ['OWNER', 'ADMIN'].includes(workspaceMember.role)) {
      // Allowed
    } else {
      // Check company user role (must be COMPANY_ADMIN)
      const companyUser = await this.prisma.companyUser.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId,
          },
        },
      });

      if (!companyUser || !companyUser.isActive || companyUser.role !== 'COMPANY_ADMIN') {
        throw new ForbiddenException('Access denied: admin permissions required to update company');
      }
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
    });
  }

  /**
   * Seed the Chart of Accounts using default template.
   */
  async seedChartOfAccounts(companyId: string) {
    const existingCount = await this.prisma.account.count({
      where: { companyId },
    });
    if (existingCount > 0) {
      throw new BadRequestException('Chart of accounts already seeded');
    }

    await this.prisma.account.createMany({
      data: DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
        companyId,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subType: acc.subType,
        normalBalance: acc.normalBalance,
        isSystem: acc.isSystem,
        isContra: acc.isContra,
        systemTag: acc.systemTag || null,
        description: acc.description || null,
      })),
    });

    return { message: 'Chart of accounts seeded successfully' };
  }

  /**
   * Alias method for seeding chart of accounts.
   */
  async seedDefaultChartOfAccounts(companyId: string) {
    return this.seedChartOfAccounts(companyId);
  }

  /**
   * Seed default tax codes.
   */
  async seedDefaultTaxCodes(companyId: string) {
    const existingCount = await this.prisma.taxCode.count({
      where: { companyId },
    });
    if (existingCount > 0) {
      throw new BadRequestException('Tax codes already seeded');
    }

    await this.prisma.taxCode.createMany({
      data: [
        {
          companyId,
          code: 'GST',
          name: 'Goods and Services Tax',
          rate: new Decimal(0.1000),
          type: 'OUTPUT',
          description: 'Standard Goods and Services Tax (10%)',
        },
        {
          companyId,
          code: 'TAX-FREE',
          name: 'Tax Free',
          rate: new Decimal(0.0000),
          type: 'NONE',
          description: 'Zero-rated tax (0%)',
        },
        {
          companyId,
          code: 'REDUCED',
          name: 'Reduced Rate Tax',
          rate: new Decimal(0.0500),
          type: 'OUTPUT',
          description: 'Reduced rate tax (5%)',
        },
      ],
    });

    return { message: 'Default tax codes seeded successfully' };
  }
}
