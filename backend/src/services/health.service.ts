import { getHealthData } from '../repositories/health.repository';
import { getRedisStatus } from '../config/redis.config';
import { queueManager } from '../queues/queue.manager';
import { cacheService } from './cache.service';
import prisma from '../config/prisma';

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

export const getReadinessStatus = async () => {
  // Check Database connection
  await prisma.$queryRaw`SELECT 1`;

  const redis = getRedisStatus();

  return {
    ready: true,
    database: 'connected',
    redis: redis.connected ? 'connected' : 'in-process-fallback',
    timestamp: new Date().toISOString(),
  };
};
