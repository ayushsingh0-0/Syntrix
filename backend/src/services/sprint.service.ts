import { SprintRepository } from '../repositories/sprint.repository';
import { findProjectById } from '../repositories/project.repository';
import { ApiError } from '../utils/ApiError';
import type {
  CreateSprintDTO,
  UpdateSprintDTO,
  StartSprintDTO,
  CompleteSprintDTO,
  AssignTasksToSprintDTO,
  BurndownResponse,
  BurndownDataPoint,
} from '../types/sprint.types';

export class SprintService {
  private sprintRepo: SprintRepository;

  constructor() {
    this.sprintRepo = new SprintRepository();
  }

  /**
   * Helper: Validate project belongs to organization
   */
  private async validateProjectInOrg(orgId: string, projectId: string) {
    const project = await findProjectById(projectId);
    if (!project || project.organizationId !== orgId) {
      throw new ApiError(404, 'Project not found in this organization');
    }
    return project;
  }

  /**
   * List all sprints in project
   */
  async getSprints(orgId: string, projectId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    return this.sprintRepo.findSprintsByProject(projectId);
  }

  /**
   * Get single sprint details
   */
  async getSprintDetails(orgId: string, projectId: string, sprintId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    const sprint = await this.sprintRepo.findSprintById(sprintId);
    if (!sprint || sprint.projectId !== projectId) {
      throw new ApiError(404, 'Sprint not found in this project');
    }
    return sprint;
  }

  /**
   * Get project backlog tasks (unassigned to any sprint)
   */
  async getBacklog(orgId: string, projectId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    return this.sprintRepo.getBacklogTasks(projectId);
  }

  /**
   * Create a new planned sprint
   */
  async createSprint(orgId: string, projectId: string, data: CreateSprintDTO) {
    await this.validateProjectInOrg(orgId, projectId);
    return this.sprintRepo.createSprint(projectId, data);
  }

  /**
   * Update planned sprint metadata
   */
  async updateSprint(orgId: string, projectId: string, sprintId: string, data: UpdateSprintDTO) {
    await this.validateProjectInOrg(orgId, projectId);
    const sprint = await this.sprintRepo.findSprintById(sprintId);
    if (!sprint || sprint.projectId !== projectId) {
      throw new ApiError(404, 'Sprint not found in this project');
    }

    if (sprint.status === 'COMPLETED' || sprint.status === 'CANCELLED') {
      throw new ApiError(400, `Cannot edit a ${sprint.status.toLowerCase()} sprint`);
    }

    return this.sprintRepo.updateSprint(sprintId, {
      name: data.name,
      goal: data.goal,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
  }

  /**
   * Start a sprint (Enforcing single active sprint invariant)
   */
  async startSprint(orgId: string, projectId: string, sprintId: string, data: StartSprintDTO) {
    await this.validateProjectInOrg(orgId, projectId);
    const sprint = await this.sprintRepo.findSprintById(sprintId);
    if (!sprint || sprint.projectId !== projectId) {
      throw new ApiError(404, 'Sprint not found in this project');
    }

    if (sprint.status !== 'PLANNED') {
      throw new ApiError(400, `Cannot start sprint with status '${sprint.status}'`);
    }

    // Invariant check: Single active sprint per project
    const activeSprint = await this.sprintRepo.findActiveSprint(projectId);
    if (activeSprint) {
      throw new ApiError(
        400,
        `Cannot start sprint: Sprint '${activeSprint.name}' is already active. Please complete or cancel it before starting another sprint.`
      );
    }

    return this.sprintRepo.updateSprint(sprintId, {
      status: 'ACTIVE',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      goal: data.goal !== undefined ? data.goal : sprint.goal,
    });
  }

  /**
   * Complete an active sprint & rollover unfinished tasks
   */
  async completeSprint(orgId: string, projectId: string, sprintId: string, data: CompleteSprintDTO) {
    await this.validateProjectInOrg(orgId, projectId);
    const sprint = await this.sprintRepo.findSprintById(sprintId);
    if (!sprint || sprint.projectId !== projectId) {
      throw new ApiError(404, 'Sprint not found in this project');
    }

    if (sprint.status !== 'ACTIVE') {
      throw new ApiError(400, `Only active sprints can be completed (current status: ${sprint.status})`);
    }

    // Validate rollover target sprint if specified
    if (data.rolloverToSprintId) {
      const targetSprint = await this.sprintRepo.findSprintById(data.rolloverToSprintId);
      if (!targetSprint || targetSprint.projectId !== projectId) {
        throw new ApiError(404, 'Target rollover sprint not found in this project');
      }
      if (targetSprint.status !== 'PLANNED') {
        throw new ApiError(400, 'Target rollover sprint must be in PLANNED status');
      }
    }

    // Move incomplete tasks to backlog or target sprint
    await this.sprintRepo.rolloverIncompleteTasks(sprintId, data.rolloverToSprintId || null);

    return this.sprintRepo.updateSprint(sprintId, {
      status: 'COMPLETED',
      completedAt: new Date(),
    });
  }

  /**
   * Cancel sprint
   */
  async cancelSprint(orgId: string, projectId: string, sprintId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    const sprint = await this.sprintRepo.findSprintById(sprintId);
    if (!sprint || sprint.projectId !== projectId) {
      throw new ApiError(404, 'Sprint not found in this project');
    }

    if (sprint.status === 'COMPLETED') {
      throw new ApiError(400, 'Cannot cancel an already completed sprint');
    }

    // Release sprint tasks to backlog
    await this.sprintRepo.assignTasksToSprint(
      null,
      sprint.tasks.map((t) => t.id)
    );

    return this.sprintRepo.updateSprint(sprintId, {
      status: 'CANCELLED',
    });
  }

  /**
   * Assign tasks to sprint (or remove by passing sprintId = null)
   */
  async assignTasks(orgId: string, projectId: string, sprintId: string | null, data: AssignTasksToSprintDTO) {
    await this.validateProjectInOrg(orgId, projectId);

    if (sprintId) {
      const sprint = await this.sprintRepo.findSprintById(sprintId);
      if (!sprint || sprint.projectId !== projectId) {
        throw new ApiError(404, 'Sprint not found in this project');
      }
      if (sprint.status === 'COMPLETED' || sprint.status === 'CANCELLED') {
        throw new ApiError(400, `Cannot assign tasks to a ${sprint.status.toLowerCase()} sprint`);
      }
    }

    await this.sprintRepo.assignTasksToSprint(sprintId, data.taskIds);
    return { success: true, count: data.taskIds.length };
  }

  /**
   * Delete sprint
   */
  async deleteSprint(orgId: string, projectId: string, sprintId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    const sprint = await this.sprintRepo.findSprintById(sprintId);
    if (!sprint || sprint.projectId !== projectId) {
      throw new ApiError(404, 'Sprint not found in this project');
    }
    return this.sprintRepo.deleteSprint(sprintId);
  }

  /**
   * Calculate Burndown analytics timeline
   */
  async getBurndown(orgId: string, projectId: string, sprintId: string): Promise<BurndownResponse> {
    await this.validateProjectInOrg(orgId, projectId);
    const sprint = await this.sprintRepo.findSprintById(sprintId);
    if (!sprint || sprint.projectId !== projectId) {
      throw new ApiError(404, 'Sprint not found in this project');
    }

    const startDate = sprint.startDate || sprint.createdAt;
    const endDate = sprint.endDate || new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const totalTasks = sprint.tasks.length;
    const completedTasks = sprint.tasks.filter((t) => t.status === 'DONE').length;

    const totalStoryPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    const completedStoryPoints = sprint.tasks
      .filter((t) => t.status === 'DONE')
      .reduce((sum, t) => sum + (t.storyPoints || 1), 0);

    // Calculate total duration in days (minimum 1 day)
    const durationDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const timeline: BurndownDataPoint[] = [];
    const now = new Date();

    for (let day = 0; day <= durationDays; day++) {
      const currentDayTime = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      const isPastOrToday = currentDayTime <= now || sprint.status === 'COMPLETED';

      const idealRatio = Math.max(0, 1 - day / durationDays);
      const idealRemainingPoints = Number((totalStoryPoints * idealRatio).toFixed(1));
      const idealRemainingTasks = Math.round(totalTasks * idealRatio);

      // Actual remaining computation
      let actualRemainingPoints = totalStoryPoints;
      let actualRemainingTasks = totalTasks;

      if (isPastOrToday) {
        if (day === durationDays || sprint.status === 'COMPLETED') {
          actualRemainingPoints = totalStoryPoints - completedStoryPoints;
          actualRemainingTasks = totalTasks - completedTasks;
        } else {
          // Proportionate actual progress representation
          const progressFactor = Math.min(1, day / durationDays);
          actualRemainingPoints = Number((totalStoryPoints - completedStoryPoints * progressFactor).toFixed(1));
          actualRemainingTasks = Math.round(totalTasks - completedTasks * progressFactor);
        }
      }

      timeline.push({
        date: currentDayTime.toISOString().substring(0, 10),
        idealRemainingPoints,
        actualRemainingPoints,
        idealRemainingTasks,
        actualRemainingTasks,
      });
    }

    return {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalStoryPoints,
        completedStoryPoints,
        totalTasks,
        completedTasks,
      },
      timeline,
    };
  }
}
