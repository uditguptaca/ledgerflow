import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationFilterDto } from './dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', required: true, description: 'Company context ID' })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query() filter: NotificationFilterDto,
  ) {
    const unreadOnly = filter.unreadOnly === true || String(filter.unreadOnly) === 'true';
    return this.notificationService.getNotifications(userId, unreadOnly);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return this.notificationService.markAsRead(id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  async readAll(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
