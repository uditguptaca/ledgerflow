import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
import {
  UpdateWorkspaceDto,
  CreateInvitationDto,
  AcceptInvitationDto,
} from './workspace.dto';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      ignoreTLS: true,
    });
  }

  /**
   * Get all workspaces the current user belongs to.
   */
  async getCurrentUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId, isActive: true },
      include: {
        workspace: {
          include: {
            subscription: true,
            _count: {
              select: {
                members: true,
                companies: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Update workspace settings. Only OWNER/ADMIN roles may call this.
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceDto,
  ) {
    await this.assertWorkspaceRole(workspaceId, userId, ['OWNER', 'ADMIN']);

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
      },
    });

    return workspace;
  }

  /**
   * List members of a workspace.
   */
  async getMembers(workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members;
  }

  /**
   * Create a workspace invitation, send email with invite link.
   */
  async createInvitation(
    workspaceId: string,
    userId: string,
    dto: CreateInvitationDto,
  ) {
    await this.assertWorkspaceRole(workspaceId, userId, ['OWNER', 'ADMIN']);

    // Check if user already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: existingUser.id,
            workspaceId,
          },
        },
      });

      if (existingMember && existingMember.isActive) {
        throw new ConflictException('User is already a member of this workspace');
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        workspaceId,
        email: dto.email.toLowerCase(),
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    // Validate companyAccess references
    if (dto.companyAccess?.length) {
      for (const ca of dto.companyAccess) {
        const company = await this.prisma.company.findFirst({
          where: { id: ca.companyId, workspaceId },
        });
        if (!company) {
          throw new BadRequestException(
            `Company ${ca.companyId} not found in this workspace`,
          );
        }
      }
    }

    const token = uuidv4();
    const invitation = await this.prisma.invitation.create({
      data: {
        workspaceId,
        email: dto.email.toLowerCase(),
        workspaceRole: dto.workspaceRole || 'MEMBER',
        companyAccess: (dto.companyAccess as any) || [],
        token,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send invitation email
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    this.sendEmail(
      dto.email,
      `You've been invited to ${workspace?.name || 'a workspace'} on LedgerFlow`,
      `<h2>Workspace Invitation</h2>
       <p>You've been invited to join <strong>${workspace?.name}</strong> on LedgerFlow.</p>
       <a href="${appUrl}/invitations/accept?token=${token}">Accept Invitation</a>
       <p>This invitation expires in 7 days.</p>`,
    ).catch((err) => this.logger.error('Failed to send invitation email', err));

    return invitation;
  }

  /**
   * List pending invitations for a workspace.
   */
  async getInvitations(workspaceId: string, userId: string) {
    await this.assertWorkspaceRole(workspaceId, userId, ['OWNER', 'ADMIN']);

    return this.prisma.invitation.findMany({
      where: { workspaceId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke a pending invitation.
   */
  async revokeInvitation(
    workspaceId: string,
    invitationId: string,
    userId: string,
  ) {
    await this.assertWorkspaceRole(workspaceId, userId, ['OWNER', 'ADMIN']);

    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, workspaceId, status: 'PENDING' },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    return { message: 'Invitation revoked' };
  }

  /**
   * Accept an invitation: create or find the user, create WorkspaceMember,
   * and create CompanyUser entries for each company in companyAccess.
   */
  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
      include: { workspace: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(`Invitation is ${invitation.status.toLowerCase()}`);
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Find or create user
      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        if (!dto.firstName || !dto.lastName || !dto.password) {
          throw new BadRequestException(
            'New users must provide firstName, lastName, and password',
          );
        }

        const passwordHash = await argon2.hash(dto.password);
        user = await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            emailVerified: true, // Invitation acceptance verifies email
          },
        });
      }

      // Create workspace member (or reactivate)
      const existingMember = await tx.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: invitation.workspaceId,
          },
        },
      });

      if (existingMember) {
        await tx.workspaceMember.update({
          where: { id: existingMember.id },
          data: {
            isActive: true,
            role: invitation.workspaceRole,
          },
        });
      } else {
        await tx.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId: invitation.workspaceId,
            role: invitation.workspaceRole,
          },
        });
      }

      // Create CompanyUser entries from companyAccess
      const companyAccess = (invitation.companyAccess as any[]) || [];
      for (const ca of companyAccess) {
        const existing = await tx.companyUser.findUnique({
          where: {
            userId_companyId: {
              userId: user.id,
              companyId: ca.companyId,
            },
          },
        });

        if (existing) {
          await tx.companyUser.update({
            where: { id: existing.id },
            data: { isActive: true, role: ca.role },
          });
        } else {
          await tx.companyUser.create({
            data: {
              userId: user.id,
              companyId: ca.companyId,
              role: ca.role,
            },
          });
        }
      }

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return user;
    });

    return {
      message: 'Invitation accepted successfully',
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      },
      workspace: {
        id: invitation.workspaceId,
        name: invitation.workspace.name,
      },
    };
  }

  // ─── Helpers ─────────────────────────────────────────────

  private async assertWorkspaceMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    return member;
  }

  private async assertWorkspaceRole(
    workspaceId: string,
    userId: string,
    roles: string[],
  ) {
    const member = await this.assertWorkspaceMember(workspaceId, userId);

    if (!roles.includes(member.role)) {
      throw new ForbiddenException(
        `Requires workspace role: ${roles.join(' or ')}`,
      );
    }

    return member;
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"LedgerFlow" <noreply@ledgerflow.io>',
        ),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
