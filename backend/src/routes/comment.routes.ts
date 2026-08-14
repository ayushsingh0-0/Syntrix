import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });
const controller = new CommentController();

router.get('/', asyncHandler(controller.listComments));
router.post('/', asyncHandler(controller.createComment));
router.put('/:commentId', asyncHandler(controller.updateComment));
router.delete('/:commentId', asyncHandler(controller.deleteComment));

export default router;
