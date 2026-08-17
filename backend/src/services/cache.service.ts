import { getRedisClient, isRedisReady } from '../config/redis.config';
import { CacheMetrics } from '../types/cache.types';

interface InMemoryCacheEntry {
  value: string;
  expiresAt: number;
}

export class CacheService {
  private hits = 0;
  private misses = 0;
  private inMemoryCache = new Map<string, InMemoryCacheEntry>();

  /**
   * Fetch a deserialized value by key
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();

    if (redis && isRedisReady()) {
      try {
        const raw = await redis.get(key);
        if (raw !== null) {
          this.hits++;
          return JSON.parse(raw) as T;
        }
        this.misses++;
        return null;
      } catch (err) {
        console.warn(`[CacheService] Redis get failed for ${key}, checking in-memory fallback:`, err);
      }
    }

    // In-memory fallback
    const entry = this.inMemoryCache.get(key);
    if (entry) {
      if (Date.now() <= entry.expiresAt) {
        this.hits++;
        return JSON.parse(entry.value) as T;
      }
      this.inMemoryCache.delete(key);
    }

    this.misses++;
    return null;
  }

  /**
   * Set a serialized value with TTL in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const redis = getRedisClient();

    if (redis && isRedisReady()) {
      try {
        await redis.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err) {
        console.warn(`[CacheService] Redis set failed for ${key}, falling back to in-memory:`, err);
      }
    }

    // In-memory fallback
    this.inMemoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Cache-Aside implementation: Return cached value or compute and store
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<{ data: T; isHit: boolean }> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return { data: cached, isHit: true };
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return { data: fresh, isHit: false };
  }

  /**
   * Explicitly delete a single cache key
   */
  async del(key: string): Promise<void> {
    const redis = getRedisClient();

    if (redis && isRedisReady()) {
      try {
        await redis.del(key);
      } catch (err) {
        console.warn(`[CacheService] Redis del failed for ${key}:`, err);
      }
    }

    this.inMemoryCache.delete(key);
  }

  /**
   * Invalidate multiple keys by pattern (e.g. `syntrix:org:xyz:*`)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let deletedCount = 0;
    const redis = getRedisClient();

    if (redis && isRedisReady()) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          deletedCount = await redis.del(...keys);
        }
      } catch (err) {
        console.warn(`[CacheService] Redis pattern invalidation failed for ${pattern}:`, err);
      }
    }

    // In-memory pattern matching
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of Array.from(this.inMemoryCache.keys())) {
      if (regexPattern.test(key)) {
        this.inMemoryCache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get operational cache metrics for health checks and observability
   */
  getMetrics(): CacheMetrics {
    const totalRequests = this.hits + this.misses;
    const hitRatio = totalRequests > 0 ? Number((this.hits / totalRequests).toFixed(2)) : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      totalRequests,
      hitRatio,
      keysCount: this.inMemoryCache.size,
      isRedisActive: isRedisReady(),
    };
  }

  /**
   * Flush all cached items (primarily for tests)
   */
  async clear(): Promise<void> {
    this.hits = 0;
    this.misses = 0;
    this.inMemoryCache.clear();

    const redis = getRedisClient();
    if (redis && isRedisReady()) {
      try {
        await redis.flushdb();
      } catch {
        // Ignore in tests
      }
    }
  }
}

export const cacheService = new CacheService();
