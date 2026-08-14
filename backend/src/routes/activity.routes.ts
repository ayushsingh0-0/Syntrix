import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });
const controller = new ActivityController();

router.get('/tasks/:taskId/activities', asyncHandler(controller.getTaskActivities));
router.get('/activities', asyncHandler(controller.getProjectActivities));

export default router;
