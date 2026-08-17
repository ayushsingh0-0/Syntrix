import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { recordHttpRequestMetric } from '../services/metrics.service';

/**
 * HTTP Access Logging Middleware
 * Captures request completion, status code, latency, and client metadata.
 */
export const httpLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip static asset spam if desired
  if (req.url.startsWith('/api/v1/attachments/files')) {
    return next();
  }

  const startTime = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startTime);
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userId = (req as any).user?.id;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Record metric for Prometheus / Grafana
    recordHttpRequestMetric(method, url, statusCode, durationMs);

    const logPayload = {
      httpMethod: method,
      httpUrl: url,
      httpStatus: statusCode,
      durationMs,
      userId,
      clientIp: ip,
      userAgent,
    };

    const message = `${method} ${url} ${statusCode} - ${durationMs}ms`;

    if (statusCode >= 500) {
      logger.error(message, logPayload);
    } else if (statusCode >= 400) {
      logger.warn(message, logPayload);
    } else {
      logger.http(message, logPayload);
    }
  });

  next();
};
