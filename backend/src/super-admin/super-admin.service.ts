import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      role: u.workspaceMembers[0]?.role || 'Member',
      workspaceName: u.workspaceMembers[0]?.workspace?.name || 'None',
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString().split('T')[0],
    }));
  }

  async toggleUserStatus(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  async getAllCompanies() {
    const companies = await this.prisma.company.findMany({
      include: {
        workspace: true,
      },
      orderBy: { name: 'asc' },
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      workspaceName: c.workspace?.name || 'None',
      currency: c.baseCurrency,
      country: c.country,
    }));
  }

  async deleteCompany(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID '${id}' not found`);
    }

    await this.prisma.company.delete({
      where: { id },
    });

    return { success: true };
  }

  async getAllSubscriptions() {
    const subscriptions = await this.prisma.workspaceSubscription.findMany({
      include: {
        workspace: {
          include: {
            members: true,
            companies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((s) => ({
      id: s.id,
      workspaceName: s.workspace?.name || 'None',
      plan: s.plan,
      seatsUsed: s.workspace?.members?.length || 0,
      seatsLimit: s.seats,
      companyLimit: s.plan === 'BASIC' ? 1 : s.plan === 'PROFESSIONAL' ? 5 : 20,
      status: s.status,
    }));
  }

  async createSubscription(dto: { workspaceName: string; plan: string }) {
    const slug = dto.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${slug}-${Date.now().toString().slice(-4)}`;

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.workspaceName,
          slug: uniqueSlug,
        },
      });

      const plan = dto.plan || 'BASIC';
      const seats = plan === 'BASIC' ? 5 : plan === 'PROFESSIONAL' ? 25 : 100;

      const sub = await tx.workspaceSubscription.create({
        data: {
          workspaceId: workspace.id,
          plan,
          seats,
          status: 'ACTIVE',
        },
      });

      return sub;
    });
  }

  async updateSubscription(id: string, dto: { plan: string }) {
    const sub = await this.prisma.workspaceSubscription.findUnique({
      where: { id },
    });
    if (!sub) {
      throw new NotFoundException(`Subscription with ID '${id}' not found`);
    }

    const plan = dto.plan;
    const seats = plan === 'BASIC' ? 5 : plan === 'PROFESSIONAL' ? 25 : 100;

    return this.prisma.workspaceSubscription.update({
      where: { id },
      data: { plan, seats },
    });
  }
}
