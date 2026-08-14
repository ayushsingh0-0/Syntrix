import prisma from '../config/prisma';
import type {
  CreateBoardDTO,
  UpdateBoardDTO,
  CreateColumnDTO,
  UpdateColumnDTO,
  ReorderColumnItem,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskStatusType,
} from '../types/board.types';

export class BoardRepository {
  /**
   * Find all boards for a project with their columns and tasks
   */
  async findByProjectId(projectId: string) {
    return prisma.board.findMany({
      where: { projectId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
                reporter: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Find a single board by ID with columns and tasks
   */
  async findById(boardId: string) {
    return prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: {
          select: { id: true, organizationId: true, key: true, name: true },
        },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
                reporter: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create a board, optionally with default standard columns
   */
  async create(projectId: string, data: CreateBoardDTO, withDefaultColumns = false) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.board.updateMany({
          where: { projectId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const board = await tx.board.create({
        data: {
          projectId,
          name: data.name,
          description: data.description,
          isDefault: data.isDefault ?? false,
        },
      });

      if (withDefaultColumns) {
        const defaultColumns = [
          { name: 'To Do', position: 0, color: '#64748b' },
          { name: 'In Progress', position: 1, color: '#3b82f6' },
          { name: 'In Review', position: 2, color: '#8b5cf6' },
          { name: 'Done', position: 3, color: '#10b981' },
        ];

        for (const col of defaultColumns) {
          await tx.boardColumn.create({
            data: {
              boardId: board.id,
              name: col.name,
              position: col.position,
              color: col.color,
            },
          });
        }
      }

      return tx.board.findUnique({
        where: { id: board.id },
        include: {
          columns: {
            orderBy: { position: 'asc' },
            include: { tasks: true },
          },
        },
      });
    });
  }

  /**
   * Update board
   */
  async update(boardId: string, data: UpdateBoardDTO) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.board.findUnique({ where: { id: boardId } });
      if (existing && data.isDefault) {
        await tx.board.updateMany({
          where: { projectId: existing.projectId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.board.update({
        where: { id: boardId },
        data: {
          name: data.name,
          description: data.description,
          isDefault: data.isDefault,
        },
      });
    });
  }

  /**
   * Delete board
   */
  async delete(boardId: string) {
    return prisma.board.delete({ where: { id: boardId } });
  }

  /**
   * Find column by ID
   */
  async findColumnById(columnId: string) {
    return prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: {
            project: {
              select: { id: true, organizationId: true },
            },
          },
        },
        tasks: true,
      },
    });
  }

  /**
   * Create column in board
   */
  async createColumn(boardId: string, data: CreateColumnDTO) {
    const highestCol = await prisma.boardColumn.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const nextPosition = highestCol ? highestCol.position + 1 : 0;

    return prisma.boardColumn.create({
      data: {
        boardId,
        name: data.name,
        position: nextPosition,
        color: data.color,
        wipLimit: data.wipLimit,
      },
      include: { tasks: true },
    });
  }

  /**
   * Update column
   */
  async updateColumn(columnId: string, data: UpdateColumnDTO) {
    return prisma.boardColumn.update({
      where: { id: columnId },
      data: {
        name: data.name,
        color: data.color,
        wipLimit: data.wipLimit,
      },
      include: { tasks: true },
    });
  }

  /**
   * Delete column
   */
  async deleteColumn(columnId: string) {
    return prisma.boardColumn.delete({ where: { id: columnId } });
  }

  /**
   * Reorder columns in a board
   */
  async reorderColumns(boardId: string, items: ReorderColumnItem[]) {
    return prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.boardColumn.update({
          where: { id: item.id },
          data: { position: item.position },
        });
      }

      return tx.boardColumn.findMany({
        where: { boardId },
        orderBy: { position: 'asc' },
        include: { tasks: true },
      });
    });
  }


  /**
   * Find task by ID
   */
  async findTaskById(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, organizationId: true, key: true },
        },
        column: true,
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Create task with auto-incrementing project sequence number
   */
  async createTask(projectId: string, projectKey: string, reporterId: string, data: CreateTaskDTO) {
    return prisma.$transaction(async (tx) => {
      const highestTask = await tx.task.findFirst({
        where: { projectId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });

      const nextNumber = highestTask ? highestTask.number + 1 : 1;
      const key = `${projectKey}-${nextNumber}`;

      let initialPosition = 65535.0;
      if (data.columnId) {
        const topTask = await tx.task.findFirst({
          where: { columnId: data.columnId },
          orderBy: { position: 'desc' },
          select: { position: true },
        });
        if (topTask) {
          initialPosition = topTask.position + 1000.0;
        }
      }

      return tx.task.create({
        data: {
          projectId,
          columnId: data.columnId || null,
          number: nextNumber,
          key,
          title: data.title,
          description: data.description || null,
          priority: data.priority ?? 'MEDIUM',
          status: data.status ?? 'TODO',
          position: initialPosition,
          assigneeId: data.assigneeId || null,
          reporterId,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          estimatedHours: data.estimatedHours || null,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
          column: true,
        },
      });
    });
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, data: UpdateTaskDTO) {
    return prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        columnId: data.columnId,
        priority: data.priority,
        status: data.status,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        estimatedHours: data.estimatedHours,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
        column: true,
      },
    });
  }

  /**
   * Move task across columns and recalculate position
   */
  async moveTask(taskId: string, targetColumnId: string, targetPosition: number, targetStatus?: TaskStatusType) {
    return prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: targetColumnId,
        position: targetPosition,
        status: targetStatus,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
        column: true,
      },
    });
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string) {
    return prisma.task.delete({ where: { id: taskId } });
  }
}
