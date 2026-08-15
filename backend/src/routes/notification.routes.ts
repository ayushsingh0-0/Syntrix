import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.get('/unread-count', asyncHandler(controller.unreadCount));
router.patch('/:id/read', asyncHandler(controller.markRead));
router.post('/read-all', asyncHandler(controller.markAllRead));
router.delete('/:id', asyncHandler(controller.delete));

export default router;
