import prisma from '../config/prisma';
import type { CreateNotificationDTO } from '../types/notification.types';

export class NotificationRepository {
  async createNotification(data: CreateNotificationDTO) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId || null,
        organizationId: data.organizationId || null,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        type: data.type,
        title: data.title,
        message: data.message,
        data: (data.data as any) || undefined,
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async createMany(dataList: CreateNotificationDTO[]) {
    if (dataList.length === 0) return { count: 0 };
    return prisma.notification.createMany({
      data: dataList.map((d) => ({
        userId: d.userId,
        actorId: d.actorId || null,
        organizationId: d.organizationId || null,
        projectId: d.projectId || null,
        taskId: d.taskId || null,
        type: d.type,
        title: d.title,
        message: d.message,
        data: (d.data as any) || undefined,
      })),
    });
  }

  async findByUser(userId: string, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (params.unreadOnly) {
      where.isRead = false;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
    ]);

    return {
      notifications,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }
}
