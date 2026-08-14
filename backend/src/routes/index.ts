import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';
import organizationRoutes from './organization.routes';
import invitationRoutes from './invitation.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/organizations', organizationRoutes);
apiRouter.use('/invitations', invitationRoutes);

export default apiRouter;


