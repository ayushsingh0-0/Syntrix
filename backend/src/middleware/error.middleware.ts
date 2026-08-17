import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const correlationId = (req as any).correlationId;

  // 1. Custom ApiError
  if (err instanceof ApiError || (err && typeof (err as any).statusCode === 'number')) {
    const statusCode = (err as any).statusCode || 400;
    const message = (err as any).message || 'Request failed';

    if (statusCode >= 500) {
      logger.error(`[API_ERROR] ${statusCode} on ${method} ${url}: ${message}`, {
        statusCode,
        method,
        url,
        correlationId,
        stack: (err as any).stack,
      });
    } else {
      logger.warn(`[CLIENT_ERROR] ${statusCode} on ${method} ${url}: ${message}`, {
        statusCode,
        method,
        url,
        correlationId,
      });
    }

    res.status(statusCode).json({
      success: false,
      message,
    });
    return;
  }

  // 2. Zod Validation Error
  if (err && (err as any).name === 'ZodError') {
    const issues = (err as any).issues || (err as any).errors;
    logger.warn(`[VALIDATION_ERROR] 400 on ${method} ${url}`, {
      method,
      url,
      correlationId,
      issues,
    });

    res.status(400).json({
      success: false,
      errors: issues,
    });
    return;
  }

  // 3. JWT Authentication Errors
  if (
    err &&
    ((err as any).name === 'JsonWebTokenError' || (err as any).name === 'TokenExpiredError')
  ) {
    logger.warn(`[JWT_ERROR] 401 on ${method} ${url}: ${(err as any).message}`, {
      method,
      url,
      correlationId,
    });

    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
    return;
  }

  // 4. Unhandled 500 Exceptions
  logger.error(`[UNHANDLED_EXCEPTION] 500 on ${method} ${url}: ${(err as any)?.message || err}`, {
    method,
    url,
    correlationId,
    stack: (err as any)?.stack,
  });

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
