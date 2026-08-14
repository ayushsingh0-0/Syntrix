import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';
import { requireOrgPermission } from '../middleware/orgAuth.middleware';
import { OrgPermission } from '../config/permissions';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });
const controller = new BoardController();

// Boards list & creation
router.get('/', asyncHandler(controller.getBoards));
router.post('/', requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(controller.createBoard));

// Single Board operations
router.get('/:boardId', asyncHandler(controller.getBoardById));
router.put('/:boardId', requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(controller.updateBoard));
router.delete('/:boardId', requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(controller.deleteBoard));

// Column operations
router.post('/:boardId/columns', requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(controller.createColumn));
router.put('/:boardId/columns/:columnId', requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(controller.updateColumn));
router.delete('/:boardId/columns/:columnId', requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(controller.deleteColumn));
router.patch('/:boardId/columns/reorder', requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(controller.reorderColumns));

export default router;
