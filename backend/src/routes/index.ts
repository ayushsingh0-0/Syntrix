import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
export default apiRouter;
