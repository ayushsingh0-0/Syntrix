import { Router } from 'express';
import { SprintController } from '../controllers/sprint.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });
const controller = new SprintController();

// Sprint collections & backlog
router.get('/', asyncHandler(controller.listSprints));
router.post('/', asyncHandler(controller.createSprint));
router.get('/backlog', asyncHandler(controller.getBacklog));

// Single Sprint operations & lifecycle
router.get('/:sprintId', asyncHandler(controller.getSprint));
router.put('/:sprintId', asyncHandler(controller.updateSprint));
router.delete('/:sprintId', asyncHandler(controller.deleteSprint));

router.post('/:sprintId/start', asyncHandler(controller.startSprint));
router.post('/:sprintId/complete', asyncHandler(controller.completeSprint));
router.post('/:sprintId/cancel', asyncHandler(controller.cancelSprint));

// Sprint Tasks & Analytics
router.post('/:sprintId/tasks', asyncHandler(controller.assignTasks));
router.get('/:sprintId/burndown', asyncHandler(controller.getBurndown));

export default router;
