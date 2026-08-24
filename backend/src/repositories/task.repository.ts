import prisma from '../config/prisma';
import type {
  TaskQueryParams,
  CreateLabelDTO,
  UpdateLabelDTO,
  DependencyTypeEnum,
} from '../types/task.types';

export class TaskRepository {
  /**
   * Paginated task query with multi-attribute filtering, sorting, and cursor support
   */
  async findPaginatedTasks(projectId: string, params: TaskQueryParams) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = params.cursor ? 1 : (page - 1) * limit;

    const where: any = { projectId };

    if (params.q) {
      where.OR = [
        { title: { contains: params.q } },
        { key: { contains: params.q } },
        { description: { contains: params.q } },
      ];
    }

    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.assigneeId) where.assigneeId = params.assigneeId;
    if (params.reporterId) where.reporterId = params.reporterId;
    if (params.columnId) where.columnId = params.columnId;

    if (params.labelId) {
      where.labels = {
        some: { labelId: params.labelId },
      };
    }

    const orderBy: any = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        ...(params.cursor ? { cursor: { id: params.cursor } } : {}),
        skip,
        take: limit,
        orderBy,
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          reporter: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          column: {
            select: { id: true, name: true, color: true },
          },
          labels: {
            include: {
              label: true,
            },
          },
          _count: {
            select: {
              watchers: true,
              dependencies: true,
              blockingTasks: true,
            },
          },
        },
      }),
    ]);

    const nextCursor = tasks.length === limit ? tasks[tasks.length - 1].id : null;

    return {
      tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        nextCursor,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get full details of a task
   */
  async findTaskDetailsById(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, organizationId: true, key: true, name: true },
        },
        column: true,
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        labels: {
          include: {
            label: true,
          },
        },
        watchers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        dependencies: {
          include: {
            dependsOnTask: {
              select: { id: true, key: true, title: true, status: true, priority: true },
            },
          },
        },
        blockingTasks: {
          include: {
            task: {
              select: { id: true, key: true, title: true, status: true, priority: true },
            },
          },
        },
      },
    });
  }

  /**
   * Sync labels on task
   */
  async syncTaskLabels(taskId: string, labelIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.taskLabel.deleteMany({ where: { taskId } });

      if (labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: labelIds.map((labelId) => ({ taskId, labelId })),
        });
      }

      return tx.taskLabel.findMany({
        where: { taskId },
        include: { label: true },
      });
    });
  }

  /**
   * Watcher subscriptions
   */
  async isWatching(taskId: string, userId: string) {
    const watcher = await prisma.taskWatcher.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    return !!watcher;
  }

  async addWatcher(taskId: string, userId: string) {
    return prisma.taskWatcher.create({
      data: { taskId, userId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async removeWatcher(taskId: string, userId: string) {
    return prisma.taskWatcher.delete({
      where: { taskId_userId: { taskId, userId } },
    });
  }

  /**
   * Task dependencies
   */
  async addDependency(taskId: string, dependsOnTaskId: string, type: DependencyTypeEnum = 'BLOCKS') {
    return prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
        type,
      },
      include: {
        dependsOnTask: {
          select: { id: true, key: true, title: true, status: true, priority: true },
        },
      },
    });
  }

  async removeDependency(dependencyId: string) {
    return prisma.taskDependency.delete({ where: { id: dependencyId } });
  }

  /**
   * Get all tasks that a task depends on (for DAG cycle traversal)
   */
  async getOutgoingDependencies(taskId: string) {
    return prisma.taskDependency.findMany({
      where: { taskId },
      select: { dependsOnTaskId: true },
    });
  }

  /**
   * Labels CRUD
   */
  async findLabelsByOrg(organizationId: string) {
    return prisma.label.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { tasks: true } },
      },
    });
  }

  async findLabelById(labelId: string) {
    return prisma.label.findUnique({ where: { id: labelId } });
  }

  async createLabel(organizationId: string, data: CreateLabelDTO) {
    return prisma.label.create({
      data: {
        organizationId,
        name: data.name,
        color: data.color || '#3b82f6',
        description: data.description,
      },
    });
  }

  async updateLabel(labelId: string, data: UpdateLabelDTO) {
    return prisma.label.update({
      where: { id: labelId },
      data: {
        name: data.name,
        color: data.color,
        description: data.description,
      },
    });
  }

  async deleteLabel(labelId: string) {
    return prisma.label.delete({ where: { id: labelId } });
  }
}
