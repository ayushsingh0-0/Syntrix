import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';

export interface RedisStatus {
  isEnabled: boolean;
  isConnected: boolean;
  host: string;
  port: number;
}

let redisClient: Redis | null = null;
let isConnected = false;
let hasLoggedNotice = false;

const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  lazyConnect: false,
  showFriendlyErrorStack: false,
  retryStrategy: (times) => {
    if (!env.REDIS_ENABLED) return null;
    if (times > 2) {
      if (!hasLoggedNotice) {
        hasLoggedNotice = true;
        console.log(
          `[Redis] Offline at ${env.REDIS_HOST}:${env.REDIS_PORT} — Syntrix is operating with resilient in-process background handlers.`
        );
      }
      return null; // Stop reconnect loop to avoid terminal spam
    }
    return 1000;
  },
};

/**
 * Initializes and returns the singleton Redis client connection
 */
export const getRedisClient = (): Redis | null => {
  if (!env.REDIS_ENABLED) {
    return null;
  }

  if (!redisClient) {
    try {
      if (env.REDIS_URL) {
        redisClient = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          retryStrategy: (times) => (times > 2 ? null : 1000),
        });
      } else {
        redisClient = new Redis(redisOptions);
      }

      redisClient.on('connect', () => {
        isConnected = true;
        hasLoggedNotice = false;
        console.log(`[Redis] Connected to ${env.REDIS_HOST}:${env.REDIS_PORT}`);
      });

      redisClient.on('ready', () => {
        isConnected = true;
      });

      redisClient.on('error', (err: any) => {
        isConnected = false;
        if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED')) {
          if (!hasLoggedNotice) {
            hasLoggedNotice = true;
            console.log(
              `[Redis] Offline at ${env.REDIS_HOST}:${env.REDIS_PORT} — Syntrix is operating with resilient in-process background handlers.`
            );
          }
          return;
        }
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`[Redis] Connection notice: ${err.message}`);
        }
      });

      redisClient.on('close', () => {
        isConnected = false;
      });
    } catch {
      redisClient = null;
      isConnected = false;
    }
  }

  return redisClient;
};

/**
 * Check if Redis connection is currently operational
 */
export const isRedisReady = (): boolean => {
  return env.REDIS_ENABLED && isConnected;
};

/**
 * Get current Redis status object for health checks
 */
export const getRedisStatus = (): RedisStatus => {
  return {
    isEnabled: env.REDIS_ENABLED,
    isConnected,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  };
};

/**
 * Gracefully disconnect Redis client
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isConnected = false;
      hasLoggedNotice = false;
    }
  }
};
