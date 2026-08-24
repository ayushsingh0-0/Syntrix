import { Request, Response } from 'express';
import { getHealthStatus, getReadinessStatus } from '../services/health.service';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const health = await getHealthStatus();
  res.status(200).json({
    status: 'success',
    data: health,
  });
};

export const getReadiness = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ready = await getReadinessStatus();
    res.status(200).json({
      status: 'ready',
      data: ready,
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: 'Database or critical service unavailable',
    });
  }
};
