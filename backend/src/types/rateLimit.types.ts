import { Request } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  tierName: string;
  keyPrefix?: string;
  keyResolver?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

export const RATE_LIMIT_TIERS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 15,
    tierName: 'AUTH',
  },
  PASSWORD_RESET: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    tierName: 'PASSWORD_RESET',
  },
  SEARCH_ANALYTICS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 40,
    tierName: 'SEARCH_ANALYTICS',
  },
  GLOBAL_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300,
    tierName: 'GLOBAL_API',
  },
} as const;
