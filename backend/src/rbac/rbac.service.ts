import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ROLE_PERMISSIONS } from '../common/guards';
import { AddCompanyUserDto, UpdateCompanyUserDto } from './rbac.dto';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get default roles and their permission lists.
   */
  async getRoles() {
    return ROLE_PERMISSIONS;
  }

  /**
   * Get all unique permission strings in the system.
   */
  async getPermissions() {
    const allPermissions = new Set<string>();
    Object.values(ROLE_PERMISSIONS).forEach((perms) => {
      perms.forEach((p) => allPermissions.add(p));
    });
    return Array.from(allPermissions).sort();
  }

  /**
   * List all company user memberships for a company with user details.
   */
  async getCompanyUsers(companyId: string) {
    return this.prisma.companyUser.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Add an existing workspace user to a company.
   */
  async addCompanyUser(companyId: string, dto: AddCompanyUserDto) {
    // 1. Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // 2. Verify user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    // 3. Verify user belongs to the workspace of this company
    const isWorkspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: dto.userId,
          workspaceId: company.workspaceId,
        },
      },
    });
    if (!isWorkspaceMember || !isWorkspaceMember.isActive) {
      throw new BadRequestException(
        'User must be an active member of the workspace to be added to this company',
      );
    }

    // 4. Check if already has a CompanyUser record
    const existing = await this.prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId: dto.userId,
          companyId,
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('User is already a member of this company');
      }

      // Reactivate membership
      return this.prisma.companyUser.update({
        where: { id: existing.id },
        data: { isActive: true, role: dto.role },
      });
    }

    return this.prisma.companyUser.create({
      data: {
        companyId,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  /**
   * Update a company user's role or permission overrides.
   */
  async updateCompanyUser(companyId: string, companyUserId: string, dto: UpdateCompanyUserDto) {
    const companyUser = await this.prisma.companyUser.findUnique({
      where: { id: companyUserId },
    });

    if (!companyUser || companyUser.companyId !== companyId) {
      throw new NotFoundException('Company user not found');
    }

    return this.prisma.companyUser.update({
      where: { id: companyUserId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.permissionOverrides !== undefined && { permissionOverrides: dto.permissionOverrides }),
      },
    });
  }

  /**
   * Remove a user from a company by deleting their CompanyUser record.
   */
  async removeCompanyUser(companyId: string, companyUserId: string) {
    const companyUser = await this.prisma.companyUser.findUnique({
      where: { id: companyUserId },
    });

    if (!companyUser || companyUser.companyId !== companyId) {
      throw new NotFoundException('Company user not found');
    }

    await this.prisma.companyUser.delete({
      where: { id: companyUserId },
    });

    return { message: 'User removed from company successfully' };
  }
}
