import prisma from '../config/prisma';
import type { CreateActivityDTO } from '../types/activity.types';

export class ActivityRepository {
  /**
   * Log an activity event
   */
  async logActivity(data: CreateActivityDTO) {
    return prisma.activityLog.create({
      data: {
        organizationId: data.organizationId,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        userId: data.userId,
        action: data.action,
        details: (data.details as any) || undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }


  /**
   * Get activity timeline for a task
   */
  async findByTask(taskId: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  /**
   * Get activity timeline for a project
   */
  async findByProject(projectId: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, key: true, title: true } },
      },
    });
  }

  /**
   * Get activity timeline for an organization
   */
  async findByOrganization(organizationId: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, key: true, title: true } },
        project: { select: { id: true, name: true, key: true } },
      },
    });
  }
}
