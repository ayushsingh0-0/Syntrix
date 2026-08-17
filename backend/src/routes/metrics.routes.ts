import { Router, Request, Response } from 'express';
import { metricsService } from '../services/metrics.service';

const metricsRouter = Router();

metricsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const format = req.query.format as string;
  const acceptHeader = req.headers.accept || '';

  if (format === 'json' || (acceptHeader.includes('application/json') && format !== 'prometheus')) {
    res.status(200).json({
      status: 'success',
      data: metricsService.getMetricsJson(),
    });
    return;
  }

  // Default: Prometheus OpenMetrics text format
  const plaintext = await metricsService.getPrometheusMetrics();
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(plaintext);
});

export default metricsRouter;
