import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';

interface RequestContext {
  correlationId: string;
  userId?: string;
  orgId?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Helper to retrieve the active request correlation ID anywhere in the app
 */
export const getCorrelationId = (): string => {
  return requestContextStorage.getStore()?.correlationId || 'system';
};

/**
 * Helper to retrieve the active request user/org context anywhere in the app
 */
export const getRequestContext = (): RequestContext | undefined => {
  return requestContextStorage.getStore();
};

/**
 * Middleware: Extract incoming X-Request-Id or generate a new UUID v4,
 * and attach it to the AsyncLocalStorage context and response headers.
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers['x-request-id'];
  const correlationId =
    typeof incomingId === 'string' && incomingId.trim() !== ''
      ? incomingId.trim()
      : crypto.randomUUID();

  // Attach to Express request object
  (req as any).correlationId = correlationId;

  // Propagate in response header
  res.setHeader('X-Request-Id', correlationId);

  // Run downstream handlers inside AsyncLocalStorage context
  requestContextStorage.run({ correlationId }, () => {
    next();
  });
};
