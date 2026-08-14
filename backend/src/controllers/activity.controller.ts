import { Request, Response } from 'express';
import { ActivityService } from '../services/activity.service';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class ActivityController {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  getTaskActivities = async (req: Request, res: Response): Promise<void> => {
    const taskId = getParam(req.params.taskId);
    const activities = await this.activityService.getTaskActivities(taskId);
    res.status(200).json({ success: true, data: activities });
  };

  getProjectActivities = async (req: Request, res: Response): Promise<void> => {
    const projectId = getParam(req.params.projectId);
    const activities = await this.activityService.getProjectActivities(projectId);
    res.status(200).json({ success: true, data: activities });
  };

  getOrganizationActivities = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const activities = await this.activityService.getOrganizationActivities(orgId);
    res.status(200).json({ success: true, data: activities });
  };
}
