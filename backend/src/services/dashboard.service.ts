import { DashboardRepository } from '../repositories/dashboard.repository';
import { ApiError } from '../utils/ApiError';
import { cacheService } from './cache.service';
import { CACHE_TTL, CacheKeys } from '../types/cache.types';

export class DashboardService {
  private dashboardRepo: DashboardRepository;

  constructor() {
    this.dashboardRepo = new DashboardRepository();
  }

  /**
   * Fetch complete organization dashboard analytics payload (Cache-Aside: 60s TTL)
   */
  async getOrganizationDashboard(orgId: string, days = 14) {
    const cacheKey = `${CacheKeys.orgDashboard(orgId)}:days=${days}`;

    const { data, isHit } = await cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.DASHBOARD,
      async () => {
        const startTime = performance.now();

        const [summary, workload, velocity, activities] = await Promise.all([
          this.dashboardRepo.getOrganizationSummary(orgId),
          this.dashboardRepo.getMemberWorkload(orgId),
          this.dashboardRepo.getCompletionVelocity(orgId, days),
          this.dashboardRepo.getRecentActivities(orgId, 10),
        ]);

        const durationMs = Math.round(performance.now() - startTime);

        return {
          durationMs,
          summary,
          workload,
          velocity,
          recentActivities: activities,
        };
      }
    );

    return { ...data, isCacheHit: isHit };
  }

  /**
   * Fetch deep project analytics (Cache-Aside: 60s TTL)
   */
  async getProjectAnalytics(orgId: string, projectId: string) {
    const cacheKey = CacheKeys.projectAnalytics(orgId, projectId);

    const { data, isHit } = await cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.PROJECT_ANALYTICS,
      async () => {
        const startTime = performance.now();

        const [analytics, velocity, activities] = await Promise.all([
          this.dashboardRepo.getProjectAnalytics(orgId, projectId),
          this.dashboardRepo.getCompletionVelocity(orgId, 14, projectId),
          this.dashboardRepo.getRecentActivities(orgId, 8, projectId),
        ]);

        if (!analytics) {
          throw new ApiError(404, 'Project not found in this organization');
        }

        const durationMs = Math.round(performance.now() - startTime);

        return {
          durationMs,
          ...analytics,
          velocity,
          recentActivities: activities,
        };
      }
    );

    return { ...data, isCacheHit: isHit };
  }

  /**
   * Fetch personal user productivity dashboard within the organization (Cache-Aside: 30s TTL)
   */
  async getUserDashboard(orgId: string, userId: string) {
    const cacheKey = CacheKeys.userDashboard(orgId, userId);

    const { data, isHit } = await cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.USER_DASHBOARD,
      async () => {
        return this.dashboardRepo.getUserDashboard(orgId, userId);
      }
    );

    return { ...data, isCacheHit: isHit };
  }
}

export const dashboardService = new DashboardService();
