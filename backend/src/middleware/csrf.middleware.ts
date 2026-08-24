import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

/**
 * List of allowed client origins for CORS and CSRF origin verification.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

export function getAllowedOrigins(): string[] {
  const customOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
  if (customOrigin) {
    return [...DEFAULT_ALLOWED_ORIGINS, customOrigin];
  }
  return DEFAULT_ALLOWED_ORIGINS;
}

/**
 * Middleware that verifies the Origin / Referer of state-changing HTTP requests
 * to guard against Cross-Site Request Forgery (CSRF).
 */
export function verifySafeRequest(req: Request, _res: Response, next: NextFunction): void {
  // Safe methods (GET, HEAD, OPTIONS) do not alter server state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const allowed = getAllowedOrigins();

  // If request has Origin header (standard browser AJAX / fetch), verify it matches allowlist
  if (origin) {
    const isAllowed = allowed.some((allowedOrigin) => origin.startsWith(allowedOrigin));
    if (!isAllowed && env.NODE_ENV === 'production') {
      return next(new ApiError(403, 'CSRF security violation: Untrusted origin header'));
    }
  } else if (referer && env.NODE_ENV === 'production') {
    const isAllowed = allowed.some((allowedOrigin) => referer.startsWith(allowedOrigin));
    if (!isAllowed) {
      return next(new ApiError(403, 'CSRF security violation: Untrusted referer header'));
    }
  }

  next();
}
