import { Router } from 'express';
import { AttachmentController } from '../controllers/attachment.controller';
import { uploadAttachment } from '../middleware/upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });
const controller = new AttachmentController();

router.get('/', asyncHandler(controller.list));
router.post('/', uploadAttachment.single('file'), asyncHandler(controller.upload));
router.delete('/:attachmentId', asyncHandler(controller.delete));

export default router;
