import prisma from '../config/prisma';
import type {
  CreateSprintDTO,
  UpdateSprintDTO,
  SprintStatusType,
} from '../types/sprint.types';

export class SprintRepository {
  /**
   * List all sprints in a project with task counts and story points sum
   */
  async findSprintsByProject(projectId: string) {
    return prisma.sprint.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
            labels: { include: { label: true } },
            column: { select: { id: true, name: true, color: true } },
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  /**
   * Find single sprint by ID
   */
  async findSprintById(sprintId: string) {
    return prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: { select: { id: true, organizationId: true, key: true, name: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
            labels: { include: { label: true } },
            column: { select: { id: true, name: true, color: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Find currently active sprint in a project
   */
  async findActiveSprint(projectId: string) {
    return prisma.sprint.findFirst({
      where: { projectId, status: 'ACTIVE' },
      include: {
        tasks: true,
      },
    });
  }

  /**
   * Create a planned sprint
   */
  async createSprint(projectId: string, data: CreateSprintDTO) {
    return prisma.sprint.create({
      data: {
        projectId,
        name: data.name,
        goal: data.goal,
        status: 'PLANNED',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        tasks: true,
      },
    });
  }

  /**
   * Update sprint metadata / status
   */
  async updateSprint(
    sprintId: string,
    data: {
      name?: string;
      goal?: string | null;
      status?: SprintStatusType;
      startDate?: Date | null;
      endDate?: Date | null;
      completedAt?: Date | null;
    }
  ) {
    return prisma.sprint.update({
      where: { id: sprintId },
      data,
      include: {
        tasks: true,
      },
    });
  }

  /**
   * Delete sprint (unassigns all associated tasks to backlog first)
   */
  async deleteSprint(sprintId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { sprintId },
        data: { sprintId: null },
      });

      return tx.sprint.delete({
        where: { id: sprintId },
      });
    });
  }

  /**
   * Assign tasks to a sprint
   */
  async assignTasksToSprint(sprintId: string | null, taskIds: string[]) {
    return prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { sprintId },
    });
  }

  /**
   * Move incomplete tasks from a sprint to backlog or target sprint
   */
  async rolloverIncompleteTasks(sourceSprintId: string, targetSprintId: string | null) {
    return prisma.task.updateMany({
      where: {
        sprintId: sourceSprintId,
        status: { not: 'DONE' },
      },
      data: { sprintId: targetSprintId },
    });
  }

  /**
   * Fetch unassigned backlog tasks for a project
   */
  async getBacklogTasks(projectId: string) {
    return prisma.task.findMany({
      where: {
        projectId,
        sprintId: null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        labels: { include: { label: true } },
        column: { select: { id: true, name: true, color: true } },
      },
      orderBy: { position: 'asc' },
    });
  }
}
