import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import metricsRoutes from './metrics.routes';
import userRoutes from './user.routes';
import organizationRoutes from './organization.routes';
import invitationRoutes from './invitation.routes';
import notificationRoutes from './notification.routes';
import { AttachmentController } from '../controllers/attachment.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { globalApiLimiter } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';

const apiRouter = Router();
const attachmentController = new AttachmentController();

// 1. Global rate limiting protection on all /api/v1 routes
apiRouter.use(globalApiLimiter);

// 2. Core Domain Sub-Routers
apiRouter.use('/health', healthRoutes);
apiRouter.use('/metrics', metricsRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/organizations', organizationRoutes);
apiRouter.use('/invitations', invitationRoutes);
apiRouter.use('/notifications', notificationRoutes);

// 3. Authenticated Attachment Downloads (Tenant-Protected with Security Headers)
apiRouter.get(
  '/attachments/:attachmentId/download',
  authenticate,
  asyncHandler(attachmentController.download)
);

export default apiRouter;
