import { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';

export const getHealth = async (req: Request, res: Response): Promise<void> => {
  const health = await getHealthStatus();
  res.status(200).json({
    status: 'success',
    data: health,
  });
};
