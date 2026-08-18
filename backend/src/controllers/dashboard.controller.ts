import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class DashboardController {
  /**
   * GET /api/v1/organizations/:id/dashboard
   */
  getOrgDashboard = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const daysQuery = req.query.days ? parseInt(req.query.days as string, 10) : 14;
    const days = isNaN(daysQuery) ? 14 : Math.min(Math.max(daysQuery, 3), 180);
    const data = await dashboardService.getOrganizationDashboard(orgId, days);

    res.status(200).json({
      status: 'success',
      data,
    });
  };

  /**
   * GET /api/v1/organizations/:id/projects/:projectId/analytics
   */
  getProjectAnalytics = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const data = await dashboardService.getProjectAnalytics(orgId, projectId);

    res.status(200).json({
      status: 'success',
      data,
    });
  };

  /**
   * GET /api/v1/organizations/:id/dashboard/me
   */
  getUserDashboard = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const userId = res.locals.user?.userId;
    const data = await dashboardService.getUserDashboard(orgId, userId);

    res.status(200).json({
      status: 'success',
      data,
    });
  };
}

export const dashboardController = new DashboardController();
