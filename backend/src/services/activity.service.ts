import { ActivityRepository } from '../repositories/activity.repository';
import type { ActivityActionType } from '../types/activity.types';

export class ActivityService {
  private activityRepo: ActivityRepository;

  constructor() {
    this.activityRepo = new ActivityRepository();
  }

  async logEvent(
    organizationId: string,
    projectId: string | null,
    taskId: string | null,
    userId: string,
    action: ActivityActionType,
    details?: Record<string, unknown> | null
  ) {
    try {
      return await this.activityRepo.logActivity({
        organizationId,
        projectId,
        taskId,
        userId,
        action,
        details,
      });
    } catch (err) {
      console.error('Failed to write activity audit log:', err);
      return null;
    }
  }

  async getTaskActivities(taskId: string) {
    return this.activityRepo.findByTask(taskId);
  }

  async getProjectActivities(projectId: string) {
    return this.activityRepo.findByProject(projectId);
  }

  async getOrganizationActivities(organizationId: string) {
    return this.activityRepo.findByOrganization(organizationId);
  }
}

export const globalActivityService = new ActivityService();
