import { Request, Response } from 'express';
import { SprintService } from '../services/sprint.service';
import {
  createSprintSchema,
  updateSprintSchema,
  startSprintSchema,
  completeSprintSchema,
  assignTasksToSprintSchema,
} from '../validations/sprint.validation';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class SprintController {
  private sprintService: SprintService;

  constructor() {
    this.sprintService = new SprintService();
  }

  listSprints = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprints = await this.sprintService.getSprints(orgId, projectId);
    res.status(200).json({ success: true, data: sprints });
  };

  getSprint = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprintId = getParam(req.params.sprintId);
    const sprint = await this.sprintService.getSprintDetails(orgId, projectId, sprintId);
    res.status(200).json({ success: true, data: sprint });
  };

  getBacklog = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const backlogTasks = await this.sprintService.getBacklog(orgId, projectId);
    res.status(200).json({ success: true, data: backlogTasks });
  };

  createSprint = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const validated = createSprintSchema.parse(req.body);
    const sprint = await this.sprintService.createSprint(orgId, projectId, validated);
    res.status(201).json({ success: true, data: sprint, message: 'Sprint created successfully' });
  };

  updateSprint = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprintId = getParam(req.params.sprintId);
    const validated = updateSprintSchema.parse(req.body);
    const sprint = await this.sprintService.updateSprint(orgId, projectId, sprintId, validated);
    res.status(200).json({ success: true, data: sprint, message: 'Sprint updated successfully' });
  };

  startSprint = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprintId = getParam(req.params.sprintId);
    const validated = startSprintSchema.parse(req.body);
    const sprint = await this.sprintService.startSprint(orgId, projectId, sprintId, validated);
    res.status(200).json({ success: true, data: sprint, message: 'Sprint started successfully' });
  };

  completeSprint = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprintId = getParam(req.params.sprintId);
    const validated = completeSprintSchema.parse(req.body);
    const sprint = await this.sprintService.completeSprint(orgId, projectId, sprintId, validated);
    res.status(200).json({ success: true, data: sprint, message: 'Sprint completed successfully' });
  };

  cancelSprint = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprintId = getParam(req.params.sprintId);
    const sprint = await this.sprintService.cancelSprint(orgId, projectId, sprintId);
    res.status(200).json({ success: true, data: sprint, message: 'Sprint cancelled' });
  };

  assignTasks = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprintId = req.params.sprintId ? getParam(req.params.sprintId) : null;
    const validated = assignTasksToSprintSchema.parse(req.body);
    const result = await this.sprintService.assignTasks(orgId, projectId, sprintId, validated);
    res.status(200).json({ success: true, data: result, message: 'Tasks assigned to sprint' });
  };

  deleteSprint = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprintId = getParam(req.params.sprintId);
    await this.sprintService.deleteSprint(orgId, projectId, sprintId);
    res.status(200).json({ success: true, data: null, message: 'Sprint deleted successfully' });
  };

  getBurndown = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const sprintId = getParam(req.params.sprintId);
    const burndown = await this.sprintService.getBurndown(orgId, projectId, sprintId);
    res.status(200).json({ success: true, data: burndown });
  };
}
