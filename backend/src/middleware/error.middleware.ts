import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';

export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(err);

  if (err instanceof ApiError || (err && (err as any).statusCode)) {
    res.status((err as any).statusCode || 400).json({
      success: false,
      message: (err as any).message,
    });

    return;
  }

  if (err && (err as any).name === 'ZodError') {
    res.status(400).json({
      success: false,
      errors: (err as any).issues || (err as any).errors,
    });
    return;
  }

  if (err && ((err as any).name === 'JsonWebTokenError' || (err as any).name === 'TokenExpiredError')) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
