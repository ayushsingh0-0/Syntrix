import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';
import organizationRoutes from './organization.routes';
import invitationRoutes from './invitation.routes';
import notificationRoutes from './notification.routes';
import { AttachmentController } from '../controllers/attachment.controller';
import express from 'express';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';
import { globalApiLimiter } from '../middleware/rateLimit.middleware';

const apiRouter = Router();
const attachmentController = new AttachmentController();

// Apply global rate limiting to all /api/v1 routes
apiRouter.use(globalApiLimiter);

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/organizations', organizationRoutes);
apiRouter.use('/invitations', invitationRoutes);
apiRouter.use('/notifications', notificationRoutes);

// Attachment Downloads & Static File Serving
apiRouter.get('/attachments/:attachmentId/download', asyncHandler(attachmentController.download));
apiRouter.use('/attachments/files', express.static(path.resolve(process.cwd(), 'uploads')));

export default apiRouter;




