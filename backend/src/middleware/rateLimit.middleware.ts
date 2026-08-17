import { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisReady } from '../config/redis.config';
import { RateLimitConfig, RATE_LIMIT_TIERS } from '../types/rateLimit.types';

// In-memory sliding-window store for fallback
const inMemoryStore = new Map<string, number[]>();

// Cleanup stale in-memory buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of inMemoryStore.entries()) {
    const valid = timestamps.filter((t) => now - t < 15 * 60 * 1000);
    if (valid.length === 0) {
      inMemoryStore.delete(key);
    } else {
      inMemoryStore.set(key, valid);
    }
  }
}, 60 * 1000).unref();

/**
 * Resolve client identifier (Authenticated User ID, X-Forwarded-For, or IP)
 */
export const defaultKeyResolver = (req: Request): string => {
  const user = (req as any).user;
  if (user && user.id) {
    return `user:${user.id}`;
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }

  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
};

/**
 * Factory function creating a distributed sliding-window Rate Limiter
 */
export const createRateLimiter = (config: RateLimitConfig) => {
  const keyResolver = config.keyResolver || defaultKeyResolver;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (config.skip && config.skip(req)) {
      return next();
    }

    const clientKey = keyResolver(req);
    const key = `syntrix:ratelimit:${config.tierName}:${clientKey}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const redis = getRedisClient();

    let currentCount = 0;

    if (redis && isRedisReady()) {
      try {
        const pipeline = redis.pipeline();
        // Remove requests older than the sliding window
        pipeline.zremrangebyscore(key, 0, windowStart);
        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        // Count active requests in current window
        pipeline.zcard(key);
        // Set expiry on key
        pipeline.pexpire(key, config.windowMs);

        const results = await pipeline.exec();
        if (results && results[2] && typeof results[2][1] === 'number') {
          currentCount = results[2][1];
        }
      } catch (err) {
        console.warn(`[RateLimiter] Redis error on key ${key}, falling back to in-memory:`, err);
        currentCount = recordInMemory(key, now, windowStart);
      }
    } else {
      currentCount = recordInMemory(key, now, windowStart);
    }

    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetTime = Math.ceil((now + config.windowMs) / 1000);
    const retryAfterSeconds = Math.ceil(config.windowMs / 1000);

    // Standard RFC RateLimit headers
    res.setHeader('RateLimit-Limit', config.maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetTime);

    if (currentCount > config.maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests for ${config.tierName}. Please try again in ${retryAfterSeconds} seconds.`,
          retryAfterSeconds,
        },
      });
      return;
    }

    next();
  };
};

function recordInMemory(key: string, now: number, windowStart: number): number {
  const existing = inMemoryStore.get(key) || [];
  const valid = existing.filter((ts) => ts > windowStart);
  valid.push(now);
  inMemoryStore.set(key, valid);
  return valid.length;
}

// Pre-configured standard limiters
export const authLimiter = createRateLimiter(RATE_LIMIT_TIERS.AUTH);
export const passwordResetLimiter = createRateLimiter(RATE_LIMIT_TIERS.PASSWORD_RESET);
export const searchLimiter = createRateLimiter(RATE_LIMIT_TIERS.SEARCH_ANALYTICS);
export const globalApiLimiter = createRateLimiter(RATE_LIMIT_TIERS.GLOBAL_API);
