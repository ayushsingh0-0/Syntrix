export const CACHE_TTL = {
  DASHBOARD: 60, // 1 minute
  PROJECT_ANALYTICS: 60, // 1 minute
  USER_DASHBOARD: 30, // 30 seconds
  PERMISSIONS_MATRIX: 3600, // 1 hour
  PROJECT_SUMMARY: 120, // 2 minutes
  SEARCH_RESULTS: 30, // 30 seconds
} as const;

export interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRatio: number;
  keysCount: number;
  isRedisActive: boolean;
}

export const CacheKeys = {
  orgDashboard: (orgId: string) => `syntrix:org:${orgId}:dashboard`,
  userDashboard: (orgId: string, userId: string) => `syntrix:org:${orgId}:user:${userId}:dashboard`,
  projectAnalytics: (orgId: string, projectId: string) =>
    `syntrix:org:${orgId}:project:${projectId}:analytics`,
  permissionsMatrix: () => 'syntrix:reference:permissions-matrix',
  orgPattern: (orgId: string) => `syntrix:org:${orgId}:*`,
  projectPattern: (orgId: string, projectId: string) => `syntrix:org:${orgId}:project:${projectId}:*`,
};
