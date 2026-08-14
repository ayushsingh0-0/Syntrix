import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });
const controller = new BoardController();

// Task CRUD and movement
router.post('/', asyncHandler(controller.createTask));
router.put('/:taskId', asyncHandler(controller.updateTask));
router.patch('/:taskId/move', asyncHandler(controller.moveTask));
router.delete('/:taskId', asyncHandler(controller.deleteTask));

export default router;
