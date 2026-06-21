import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification for a user.
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    companyId?: string,
    link?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        companyId: companyId || null,
        type,
        title,
        message,
        link: link || null,
      },
    });

    this.logger.debug(`Notification created for user ${userId}: ${title}`);

    return notification;
  }

  /**
   * Get notifications for a user, optionally only unread ones.
   */
  async getNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 notifications
    });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications for a user as read.
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  /**
   * Get the count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
