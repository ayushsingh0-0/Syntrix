import { TaskRepository } from '../repositories/task.repository';
import { BoardRepository } from '../repositories/board.repository';
import { findProjectById } from '../repositories/project.repository';
import { findOrgMember } from '../repositories/organization.repository';
import { ApiError } from '../utils/ApiError';
import type {
  TaskQueryParams,
  CreateLabelDTO,
  UpdateLabelDTO,
  AddDependencyDTO,
  UpdateTaskDetailedDTO,
} from '../types/task.types';

export class TaskService {
  private taskRepo: TaskRepository;
  private boardRepo: BoardRepository;

  constructor() {
    this.taskRepo = new TaskRepository();
    this.boardRepo = new BoardRepository();
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
   * Get paginated tasks with filters
   */
  async getTasks(orgId: string, projectId: string, params: TaskQueryParams) {
    await this.validateProjectInOrg(orgId, projectId);
    return this.taskRepo.findPaginatedTasks(projectId, params);
  }

  /**
   * Get single task with full relational details
   */
  async getTaskDetails(orgId: string, projectId: string, taskId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    const task = await this.taskRepo.findTaskDetailsById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new ApiError(404, 'Task not found in this project');
    }
    return task;
  }

  /**
   * Update task with label sync
   */
  async updateTask(orgId: string, projectId: string, taskId: string, data: UpdateTaskDetailedDTO) {
    await this.validateProjectInOrg(orgId, projectId);
    const task = await this.taskRepo.findTaskDetailsById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new ApiError(404, 'Task not found in this project');
    }

    if (data.assigneeId) {
      const isMember = await findOrgMember(orgId, data.assigneeId);
      if (!isMember) {
        throw new ApiError(400, 'Assignee must be an active member of this organization');
      }
    }

    if (data.columnId) {
      const col = await this.boardRepo.findColumnById(data.columnId);
      if (!col || col.board.projectId !== projectId) {
        throw new ApiError(404, 'Target column not found in this project');
      }
    }

    // Update core task
    await this.boardRepo.updateTask(taskId, {
      title: data.title,
      description: data.description,
      columnId: data.columnId,
      priority: data.priority,
      status: data.status,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
    });

    // Sync labels if provided
    if (data.labelIds !== undefined) {
      await this.taskRepo.syncTaskLabels(taskId, data.labelIds);
    }

    return this.taskRepo.findTaskDetailsById(taskId);
  }

  /**
   * Delete task
   */
  async deleteTask(orgId: string, projectId: string, taskId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    const task = await this.taskRepo.findTaskDetailsById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new ApiError(404, 'Task not found in this project');
    }
    return this.boardRepo.deleteTask(taskId);
  }

  /**
   * Toggle task watcher
   */
  async toggleWatcher(orgId: string, projectId: string, taskId: string, userId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    const task = await this.taskRepo.findTaskDetailsById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new ApiError(404, 'Task not found in this project');
    }

    const isWatching = await this.taskRepo.isWatching(taskId, userId);
    if (isWatching) {
      await this.taskRepo.removeWatcher(taskId, userId);
      return { isWatching: false, message: 'Unsubscribed from task updates' };
    } else {
      await this.taskRepo.addWatcher(taskId, userId);
      return { isWatching: true, message: 'Subscribed to task updates' };
    }
  }

  /**
   * Add task dependency with DAG cycle check
   */
  async addDependency(orgId: string, projectId: string, taskId: string, data: AddDependencyDTO) {
    await this.validateProjectInOrg(orgId, projectId);

    if (taskId === data.dependsOnTaskId) {
      throw new ApiError(400, 'A task cannot depend on itself');
    }

    const [sourceTask, targetTask] = await Promise.all([
      this.taskRepo.findTaskDetailsById(taskId),
      this.taskRepo.findTaskDetailsById(data.dependsOnTaskId),
    ]);

    if (!sourceTask || sourceTask.projectId !== projectId) {
      throw new ApiError(404, 'Source task not found in this project');
    }
    if (!targetTask || targetTask.projectId !== projectId) {
      throw new ApiError(404, 'Dependent task not found in this project');
    }

    // DAG Cycle Detection: DFS check if dependsOnTaskId can reach taskId
    const hasCycle = await this.detectCycle(data.dependsOnTaskId, taskId);
    if (hasCycle) {
      throw new ApiError(
        400,
        `Circular dependency detected: Task '${targetTask.key}' is already downstream of '${sourceTask.key}'. Adding this link would cause an infinite blocking cycle.`
      );
    }

    return this.taskRepo.addDependency(taskId, data.dependsOnTaskId, data.type || 'BLOCKS');
  }

  /**
   * Recursive DFS cycle detector
   */
  private async detectCycle(currentTaskId: string, targetTaskId: string, visited = new Set<string>()): Promise<boolean> {
    if (currentTaskId === targetTaskId) return true;
    if (visited.has(currentTaskId)) return false;

    visited.add(currentTaskId);

    const outgoing = await this.taskRepo.getOutgoingDependencies(currentTaskId);
    for (const dep of outgoing) {
      const cycleFound = await this.detectCycle(dep.dependsOnTaskId, targetTaskId, visited);
      if (cycleFound) return true;
    }

    return false;
  }

  /**
   * Remove dependency
   */
  async removeDependency(orgId: string, projectId: string, taskId: string, dependencyId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    return this.taskRepo.removeDependency(dependencyId);
  }

  /**
   * Labels Management
   */
  async getLabels(orgId: string) {
    return this.taskRepo.findLabelsByOrg(orgId);
  }

  async createLabel(orgId: string, data: CreateLabelDTO) {
    const existing = await this.taskRepo.findLabelsByOrg(orgId);
    if (existing.some((l) => l.name.toLowerCase() === data.name.trim().toLowerCase())) {
      throw new ApiError(409, `Label '${data.name}' already exists in this organization`);
    }
    return this.taskRepo.createLabel(orgId, data);
  }

  async updateLabel(orgId: string, labelId: string, data: UpdateLabelDTO) {
    const label = await this.taskRepo.findLabelById(labelId);
    if (!label || label.organizationId !== orgId) {
      throw new ApiError(404, 'Label not found in this organization');
    }
    return this.taskRepo.updateLabel(labelId, data);
  }

  async deleteLabel(orgId: string, labelId: string) {
    const label = await this.taskRepo.findLabelById(labelId);
    if (!label || label.organizationId !== orgId) {
      throw new ApiError(404, 'Label not found in this organization');
    }
    return this.taskRepo.deleteLabel(labelId);
  }
}
