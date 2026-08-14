import { BoardRepository } from '../repositories/board.repository';
import { findProjectById } from '../repositories/project.repository';
import { findOrgMember } from '../repositories/organization.repository';
import { ApiError } from '../utils/ApiError';
import type {
  CreateBoardDTO,
  UpdateBoardDTO,
  CreateColumnDTO,
  UpdateColumnDTO,
  ReorderColumnItem,
  CreateTaskDTO,
  UpdateTaskDTO,
  MoveTaskDTO,
  TaskStatusType,
} from '../types/board.types';

export class BoardService {
  private boardRepo: BoardRepository;

  constructor() {
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
   * Get all boards for a project (auto-provisions default board if none exist)
   */
  async getProjectBoards(orgId: string, projectId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    let boards = await this.boardRepo.findByProjectId(projectId);

    if (boards.length === 0) {
      // Auto-provision default board with 4 standard columns
      const defaultBoard = await this.boardRepo.create(
        projectId,
        { name: 'Main Board', isDefault: true },
        true
      );
      if (defaultBoard) {
        boards = [defaultBoard as any];
      }
    }

    return boards;
  }

  /**
   * Get a single board by ID
   */
  async getBoardById(orgId: string, projectId: string, boardId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    const board = await this.boardRepo.findById(boardId);
    if (!board || board.projectId !== projectId) {
      throw new ApiError(404, 'Board not found in this project');
    }
    return board;
  }

  /**
   * Create custom board
   */
  async createBoard(orgId: string, projectId: string, data: CreateBoardDTO) {
    await this.validateProjectInOrg(orgId, projectId);
    return this.boardRepo.create(projectId, data, true);
  }

  /**
   * Update board
   */
  async updateBoard(orgId: string, projectId: string, boardId: string, data: UpdateBoardDTO) {
    await this.getBoardById(orgId, projectId, boardId);
    return this.boardRepo.update(boardId, data);
  }

  /**
   * Delete board (cannot delete if default and sole board)
   */
  async deleteBoard(orgId: string, projectId: string, boardId: string) {
    await this.getBoardById(orgId, projectId, boardId);
    const allBoards = await this.boardRepo.findByProjectId(projectId);

    if (allBoards.length <= 1) {
      throw new ApiError(400, 'Cannot delete the only board in a project');
    }

    return this.boardRepo.delete(boardId);
  }

  /**
   * Create column in board
   */
  async createColumn(orgId: string, projectId: string, boardId: string, data: CreateColumnDTO) {
    await this.getBoardById(orgId, projectId, boardId);
    return this.boardRepo.createColumn(boardId, data);
  }

  /**
   * Update column
   */
  async updateColumn(orgId: string, projectId: string, boardId: string, columnId: string, data: UpdateColumnDTO) {
    await this.getBoardById(orgId, projectId, boardId);
    const column = await this.boardRepo.findColumnById(columnId);
    if (!column || column.boardId !== boardId) {
      throw new ApiError(404, 'Column not found in this board');
    }
    return this.boardRepo.updateColumn(columnId, data);
  }

  /**
   * Delete column
   */
  async deleteColumn(orgId: string, projectId: string, boardId: string, columnId: string) {
    await this.getBoardById(orgId, projectId, boardId);
    const column = await this.boardRepo.findColumnById(columnId);
    if (!column || column.boardId !== boardId) {
      throw new ApiError(404, 'Column not found in this board');
    }

    if (column.tasks && column.tasks.length > 0) {
      throw new ApiError(
        400,
        `Cannot delete column "${column.name}" because it contains ${column.tasks.length} active tasks. Please move the tasks first.`
      );
    }

    return this.boardRepo.deleteColumn(columnId);
  }

  /**
   * Reorder columns in board
   */
  async reorderColumns(orgId: string, projectId: string, boardId: string, items: ReorderColumnItem[]) {
    await this.getBoardById(orgId, projectId, boardId);
    return this.boardRepo.reorderColumns(boardId, items);
  }

  /**
   * Create task in project / column
   */
  async createTask(orgId: string, projectId: string, reporterId: string, data: CreateTaskDTO) {
    const project = await this.validateProjectInOrg(orgId, projectId);

    if (data.assigneeId) {
      const isMember = await findOrgMember(orgId, data.assigneeId);
      if (!isMember) {
        throw new ApiError(400, 'Assignee must be an active member of this organization');
      }
    }

    if (data.columnId) {
      const column = await this.boardRepo.findColumnById(data.columnId);
      if (!column || column.board.projectId !== projectId) {
        throw new ApiError(404, 'Target column not found in this project');
      }

      // Check WIP limit
      if (column.wipLimit && column.tasks.length >= column.wipLimit) {
        throw new ApiError(
          400,
          `Column "${column.name}" has reached its maximum Work In Progress (WIP) limit of ${column.wipLimit} tasks`
        );
      }
    }

    return this.boardRepo.createTask(projectId, project.key, reporterId, data);
  }

  /**
   * Update task
   */
  async updateTask(orgId: string, projectId: string, taskId: string, data: UpdateTaskDTO) {
    await this.validateProjectInOrg(orgId, projectId);
    const task = await this.boardRepo.findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new ApiError(404, 'Task not found in this project');
    }

    if (data.assigneeId) {
      const isMember = await findOrgMember(orgId, data.assigneeId);
      if (!isMember) {
        throw new ApiError(400, 'Assignee must be an active member of this organization');
      }
    }

    return this.boardRepo.updateTask(taskId, data);
  }

  /**
   * Move task across columns and recalculate position
   */
  async moveTask(orgId: string, projectId: string, taskId: string, data: MoveTaskDTO) {
    await this.validateProjectInOrg(orgId, projectId);
    const task = await this.boardRepo.findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new ApiError(404, 'Task not found in this project');
    }

    const targetColumn = await this.boardRepo.findColumnById(data.columnId);
    if (!targetColumn || targetColumn.board.projectId !== projectId) {
      throw new ApiError(404, 'Target column not found in this project');
    }

    // Determine status from column name if not explicitly provided
    let derivedStatus: TaskStatusType | undefined = data.targetStatus;
    if (!derivedStatus) {
      const colLower = targetColumn.name.toLowerCase();
      if (colLower.includes('done') || colLower.includes('complete')) {
        derivedStatus = 'DONE';
      } else if (colLower.includes('review') || colLower.includes('qa') || colLower.includes('testing')) {
        derivedStatus = 'REVIEW';
      } else if (colLower.includes('progress') || colLower.includes('doing') || colLower.includes('active')) {
        derivedStatus = 'IN_PROGRESS';
      } else if (colLower.includes('todo') || colLower.includes('backlog')) {
        derivedStatus = 'TODO';
      }
    }

    return this.boardRepo.moveTask(taskId, data.columnId, data.targetPosition, derivedStatus);
  }

  /**
   * Delete task
   */
  async deleteTask(orgId: string, projectId: string, taskId: string) {
    await this.validateProjectInOrg(orgId, projectId);
    const task = await this.boardRepo.findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new ApiError(404, 'Task not found in this project');
    }

    return this.boardRepo.deleteTask(taskId);
  }
}
