import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { NotificationFilterQuery, CreateNotificationDTO } from './notification.types';
import { socketEmitter } from '../../socket';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  public static async list(
    userId: string,
    query: NotificationFilterQuery
  ): Promise<{ notifications: unknown[]; unreadCount: number; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    const where: any = { userId };
    if (query.isRead !== undefined) {
      where.isRead = String(query.isRead) === 'true';
    }

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  public static async markAsRead(id: string, userId: string): Promise<unknown> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Forbidden: You can only update your own notifications', 403);
    }

    return prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  public static async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  public static async create(dto: CreateNotificationDTO): Promise<unknown> {
    const notification = await prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || NotificationType.IN_APP,
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
      },
    });

    socketEmitter.emitNotification(dto.userId, notification);
    return notification;
  }
}

