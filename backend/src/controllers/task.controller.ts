import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import {
  taskQuerySchema,
  createLabelSchema,
  updateLabelSchema,
  addDependencySchema,
  updateTaskDetailedSchema,
} from '../validations/task.validation';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  listTasks = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const query = taskQuerySchema.parse(req.query);
    const result = await this.taskService.getTasks(orgId, projectId, query as any);
    res.status(200).json({ success: true, data: result.tasks, meta: result.meta });
  };

  getTaskDetails = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const task = await this.taskService.getTaskDetails(orgId, projectId, taskId);
    res.status(200).json({ success: true, data: task, message: 'Task details retrieved successfully' });
  };

  updateTaskDetailed = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const validated = updateTaskDetailedSchema.parse(req.body);
    const task = await this.taskService.updateTask(orgId, projectId, taskId, validated as any);
    res.status(200).json({ success: true, data: task, message: 'Task updated successfully' });
  };

  deleteTask = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    await this.taskService.deleteTask(orgId, projectId, taskId);
    res.status(200).json({ success: true, data: null, message: 'Task deleted successfully' });
  };

  toggleWatcher = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = (res.locals.user?.userId || (req as any).user?.userId) as string;
    const result = await this.taskService.toggleWatcher(orgId, projectId, taskId, userId);
    res.status(200).json({ success: true, data: result, message: result.message });
  };

  addDependency = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const validated = addDependencySchema.parse(req.body);
    const dep = await this.taskService.addDependency(orgId, projectId, taskId, validated as any);
    res.status(201).json({ success: true, data: dep, message: 'Dependency linked successfully' });
  };

  removeDependency = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const dependencyId = getParam(req.params.dependencyId);
    await this.taskService.removeDependency(orgId, projectId, taskId, dependencyId);
    res.status(200).json({ success: true, data: null, message: 'Dependency removed' });
  };

  // Label handlers
  getLabels = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const labels = await this.taskService.getLabels(orgId);
    res.status(200).json({ success: true, data: labels });
  };

  createLabel = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const validated = createLabelSchema.parse(req.body);
    const label = await this.taskService.createLabel(orgId, validated);
    res.status(201).json({ success: true, data: label, message: 'Label created successfully' });
  };

  updateLabel = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const labelId = getParam(req.params.labelId);
    const validated = updateLabelSchema.parse(req.body);
    const label = await this.taskService.updateLabel(orgId, labelId, validated);
    res.status(200).json({ success: true, data: label, message: 'Label updated successfully' });
  };

  deleteLabel = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const labelId = getParam(req.params.labelId);
    await this.taskService.deleteLabel(orgId, labelId);
    res.status(200).json({ success: true, data: null, message: 'Label deleted' });
  };
}
