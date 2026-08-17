import { getHealthData } from '../repositories/health.repository';
import { getRedisStatus } from '../config/redis.config';
import { queueManager } from '../queues/queue.manager';
import { cacheService } from './cache.service';

export const getHealthStatus = async () => {
  const baseHealth = getHealthData();
  const redis = getRedisStatus();
  const queues = await queueManager.getMetrics();
  const cache = cacheService.getMetrics();

  return {
    ...baseHealth,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    redis,
    queues,
    cache,
  };
};
