import { Router } from 'express';
import { previewInvite, acceptInvite } from '../controllers/invitation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { acceptInvitationSchema } from '../validations/invitation.validation';

const router = Router();

router.get('/:token', asyncHandler(previewInvite));
router.post('/accept', authenticate, validate(acceptInvitationSchema), asyncHandler(acceptInvite));

export default router;
