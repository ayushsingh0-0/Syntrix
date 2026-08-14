import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';
import { TaskController } from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });
const boardController = new BoardController();
const taskController = new TaskController();

// Paginated Task Queries & Creation
router.get('/', asyncHandler(taskController.listTasks));
router.post('/', asyncHandler(boardController.createTask));

// Single Task Details & Updates
router.get('/:taskId', asyncHandler(taskController.getTaskDetails));
router.put('/:taskId', asyncHandler(taskController.updateTaskDetailed));
router.patch('/:taskId/move', asyncHandler(boardController.moveTask));
router.delete('/:taskId', asyncHandler(taskController.deleteTask));

// Task Watchers
router.post('/:taskId/watch', asyncHandler(taskController.toggleWatcher));

// Task Dependencies (DAG Links)
router.post('/:taskId/dependencies', asyncHandler(taskController.addDependency));
router.delete('/:taskId/dependencies/:dependencyId', asyncHandler(taskController.removeDependency));

export default router;
