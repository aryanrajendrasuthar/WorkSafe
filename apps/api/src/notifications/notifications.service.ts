import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEventService } from './notification-event.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private events: NotificationEventService,
    private push: PushService,
  ) {}

  async getForUser(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { notifications, total, unreadCount, page, limit };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: (data.metadata ?? {}) as any,
      },
    });

    this.events.emit(data.userId, {
      id: notification.id,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.metadata,
      createdAt: notification.createdAt,
    });

    this.push.sendToUser(data.userId, data.title, data.message, data.metadata).catch(() => {});

    return notification;
  }

  async createForOrg(
    orgId: string,
    type: NotificationType,
    title: string,
    message: string,
    roles?: string[],
  ) {
    const where: any = { organizationId: orgId, isActive: true };
    if (roles?.length) where.role = { in: roles };

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });
    if (!users.length) return;

    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type,
        title,
        message,
        data: {},
      })),
    });

    const now = new Date();
    for (const u of users) {
      this.events.emit(u.id, { id: `org-${now.getTime()}`, type, title, message, createdAt: now });
      this.push.sendToUser(u.id, title, message).catch(() => {});
    }
  }

  async delete(id: string, userId: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
  }
}
