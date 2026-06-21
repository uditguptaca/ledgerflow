import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, WORKSPACE_ROLE_KEY } from '../decorators';

// ── Role → Default Permissions Map ───────────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
  COMPANY_ADMIN: [
    'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete',
    'journals.view', 'journals.create', 'journals.post', 'journals.void',
    'fiscal.view', 'fiscal.manage', 'fiscal.close',
    'customers.view', 'customers.create', 'customers.edit',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send', 'invoices.void',
    'payments.view', 'payments.create', 'payments.void',
    'vendors.view', 'vendors.create', 'vendors.edit',
    'bills.view', 'bills.create', 'bills.edit', 'bills.approve', 'bills.void',
    'vendor_payments.view', 'vendor_payments.create', 'vendor_payments.void',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.approve',
    'banking.view', 'banking.import', 'banking.categorize', 'banking.reconcile', 'bank_accounts.manage',
    'reports.view', 'reports.export',
    'company.settings', 'users.view', 'users.invite', 'users.manage', 'roles.manage',
    'audit.view', 'documents.view', 'documents.upload', 'documents.delete',
    'inventory.view', 'inventory.manage',
    'projects.view', 'projects.manage', 'time_entries.view', 'time_entries.manage',
  ],
  ACCOUNTANT: [
    'accounts.view', 'accounts.create', 'accounts.edit',
    'journals.view', 'journals.create', 'journals.post', 'journals.void',
    'fiscal.view', 'fiscal.manage', 'fiscal.close',
    'customers.view', 'customers.create', 'customers.edit',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send', 'invoices.void',
    'payments.view', 'payments.create', 'payments.void',
    'vendors.view', 'vendors.create', 'vendors.edit',
    'bills.view', 'bills.create', 'bills.edit', 'bills.approve', 'bills.void',
    'vendor_payments.view', 'vendor_payments.create', 'vendor_payments.void',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.approve',
    'banking.view', 'banking.import', 'banking.categorize', 'banking.reconcile', 'bank_accounts.manage',
    'reports.view', 'reports.export',
    'audit.view', 'documents.view', 'documents.upload',
    'inventory.view', 'inventory.manage',
    'projects.view', 'projects.manage', 'time_entries.view', 'time_entries.manage',
  ],
  BOOKKEEPER: [
    'accounts.view',
    'journals.view', 'journals.create',
    'customers.view', 'customers.create', 'customers.edit',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'payments.view', 'payments.create',
    'vendors.view', 'vendors.create', 'vendors.edit',
    'bills.view', 'bills.create', 'bills.edit',
    'vendor_payments.view', 'vendor_payments.create',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'banking.view', 'banking.import', 'banking.categorize',
    'reports.view',
    'documents.view', 'documents.upload',
    'inventory.view',
    'time_entries.view', 'time_entries.manage',
  ],
  APPROVER: [
    'accounts.view',
    'journals.view',
    'customers.view', 'invoices.view', 'payments.view',
    'vendors.view', 'bills.view', 'bills.approve',
    'vendor_payments.view', 'expenses.view', 'expenses.approve',
    'banking.view', 'reports.view',
    'documents.view',
  ],
  EMPLOYEE: [
    'expenses.view', 'expenses.create',
    'documents.view', 'documents.upload',
    'time_entries.view', 'time_entries.manage',
    'projects.view',
  ],
  READ_ONLY_AUDITOR: [
    'accounts.view', 'journals.view', 'fiscal.view',
    'customers.view', 'invoices.view', 'payments.view',
    'vendors.view', 'bills.view', 'vendor_payments.view', 'expenses.view',
    'banking.view', 'reports.view', 'reports.export',
    'audit.view', 'documents.view',
    'inventory.view', 'projects.view', 'time_entries.view',
  ],
};

// ── JWT Auth Guard ───────────────────────────────────────

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          workspaceMembers: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      request.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        workspaceMembers: user.workspaceMembers,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractToken(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// ── Company Context Guard ────────────────────────────────

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const companyId =
      request.headers['x-company-id'] ||
      request.params.companyId ||
      request.query.companyId;

    if (!companyId) {
      throw new BadRequestException('X-Company-Id header or companyId parameter required');
    }

    // Verify company exists and user has access
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.isActive) {
      throw new ForbiddenException('Company not found or inactive');
    }

    // Verify user belongs to this company's workspace
    const workspaceMember = user.workspaceMembers?.find(
      (m: any) => m.workspaceId === company.workspaceId && m.isActive,
    );

    if (!workspaceMember) {
      throw new ForbiddenException('Access denied: not a member of this workspace');
    }

    // Workspace owners/admins can access all companies
    if (['OWNER', 'ADMIN'].includes(workspaceMember.role)) {
      const companyUser = await this.prisma.companyUser.findUnique({
        where: { userId_companyId: { userId: user.id, companyId } },
      });

      request.company = company;
      request.companyUser = companyUser || {
        role: workspaceMember.role === 'OWNER' ? 'COMPANY_ADMIN' : 'ACCOUNTANT',
        permissionOverrides: null,
      };
      request.workspaceMember = workspaceMember;
      return true;
    }

    // Non-admin: must have explicit CompanyUser entry
    const companyUser = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } },
    });

    if (!companyUser || !companyUser.isActive) {
      throw new ForbiddenException('Access denied: no access to this company');
    }

    request.company = company;
    request.companyUser = companyUser;
    request.workspaceMember = workspaceMember;
    return true;
  }
}

// ── Permission Guard ─────────────────────────────────────

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyUser = request.companyUser;
    const workspaceMember = request.workspaceMember;

    if (!companyUser) {
      throw new ForbiddenException('Company access not established');
    }

    // Workspace owners have all permissions
    if (workspaceMember?.role === 'OWNER') return true;

    const role = companyUser.role as string;
    const defaultPerms = ROLE_PERMISSIONS[role] || [];

    // Apply overrides
    let effectivePerms = new Set(defaultPerms);
    if (companyUser.permissionOverrides) {
      const overrides = companyUser.permissionOverrides as any;
      if (overrides.add) {
        overrides.add.forEach((p: string) => effectivePerms.add(p));
      }
      if (overrides.remove) {
        overrides.remove.forEach((p: string) => effectivePerms.delete(p));
      }
    }

    const hasAllPermissions = requiredPermissions.every((p) =>
      effectivePerms.has(p),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}

export { ROLE_PERMISSIONS };
