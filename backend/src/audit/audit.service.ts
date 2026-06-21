import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogParams {
  companyId?: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
  metadata?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit event record.
   * This is designed to be called from any module that needs audit logging.
   */
  async log(params: AuditLogParams, tx?: Prisma.TransactionClient): Promise<void> {
    try {
      const client = tx || this.prisma;
      await client.auditEvent.create({
        data: {
          companyId: params.companyId || null,
          userId: params.userId || null,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          before: params.before ? (params.before as Prisma.InputJsonValue) : undefined,
          after: params.after ? (params.after as Prisma.InputJsonValue) : undefined,
          metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (error) {
      // Audit logging should never break the calling operation
      this.logger.error('Failed to create audit event', {
        params,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Query audit events with pagination and filters.
   * All queries are scoped by companyId (from header) unless the user is a platform admin.
   */
  async findAll(filters: {
    companyId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditEventWhereInput = {};

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.timestamp.lte = new Date(filters.endDate);
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
