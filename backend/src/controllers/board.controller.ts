import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import {
  createBoardSchema,
  updateBoardSchema,
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
} from '../validations/board.validation';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class BoardController {
  private boardService: BoardService;

  constructor() {
    this.boardService = new BoardService();
  }

  getBoards = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const boards = await this.boardService.getProjectBoards(orgId, projectId);
    res.status(200).json({ success: true, data: boards, message: 'Project boards retrieved successfully' });
  };

  getBoardById = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const boardId = getParam(req.params.boardId);
    const board = await this.boardService.getBoardById(orgId, projectId, boardId);
    res.status(200).json({ success: true, data: board, message: 'Board retrieved successfully' });
  };

  createBoard = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const validated = createBoardSchema.parse(req.body);
    const board = await this.boardService.createBoard(orgId, projectId, validated);
    res.status(201).json({ success: true, data: board, message: 'Board created successfully' });
  };

  updateBoard = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const boardId = getParam(req.params.boardId);
    const validated = updateBoardSchema.parse(req.body);
    const board = await this.boardService.updateBoard(orgId, projectId, boardId, validated);
    res.status(200).json({ success: true, data: board, message: 'Board updated successfully' });
  };

  deleteBoard = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const boardId = getParam(req.params.boardId);
    await this.boardService.deleteBoard(orgId, projectId, boardId);
    res.status(200).json({ success: true, data: null, message: 'Board deleted successfully' });
  };

  createColumn = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const boardId = getParam(req.params.boardId);
    const validated = createColumnSchema.parse(req.body);
    const column = await this.boardService.createColumn(orgId, projectId, boardId, validated);
    res.status(201).json({ success: true, data: column, message: 'Column added to board' });
  };

  updateColumn = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const boardId = getParam(req.params.boardId);
    const columnId = getParam(req.params.columnId);
    const validated = updateColumnSchema.parse(req.body);
    const column = await this.boardService.updateColumn(orgId, projectId, boardId, columnId, validated);
    res.status(200).json({ success: true, data: column, message: 'Column updated successfully' });
  };

  deleteColumn = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const boardId = getParam(req.params.boardId);
    const columnId = getParam(req.params.columnId);
    await this.boardService.deleteColumn(orgId, projectId, boardId, columnId);
    res.status(200).json({ success: true, data: null, message: 'Column removed from board' });
  };

  reorderColumns = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const boardId = getParam(req.params.boardId);
    const validated = reorderColumnsSchema.parse(req.body);
    const columns = await this.boardService.reorderColumns(orgId, projectId, boardId, validated.columns);
    res.status(200).json({ success: true, data: columns, message: 'Columns reordered successfully' });
  };

  createTask = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const reporterId = (res.locals.user?.userId || (req as any).user?.userId) as string;
    const validated = createTaskSchema.parse(req.body);
    const task = await this.boardService.createTask(orgId, projectId, reporterId, validated);
    res.status(201).json({ success: true, data: task, message: 'Task created successfully' });
  };

  updateTask = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const validated = updateTaskSchema.parse(req.body);
    const task = await this.boardService.updateTask(orgId, projectId, taskId, validated);
    res.status(200).json({ success: true, data: task, message: 'Task updated successfully' });
  };

  moveTask = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const validated = moveTaskSchema.parse(req.body);
    const task = await this.boardService.moveTask(orgId, projectId, taskId, validated);
    res.status(200).json({ success: true, data: task, message: 'Task moved successfully' });
  };

  deleteTask = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    await this.boardService.deleteTask(orgId, projectId, taskId);
    res.status(200).json({ success: true, data: null, message: 'Task deleted successfully' });
  };
}
