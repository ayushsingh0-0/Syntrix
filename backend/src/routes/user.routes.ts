import { Router } from 'express';
import {
  getCurrentUser,
  updateMe,
  search,
  getSessions,
  revokeSession,
  adminTest,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { validate, validateQuery } from '../middleware/validate.middleware';
import { updateProfileSchema, searchUserSchema } from '../validations/user.validation';
import { UserRole } from '../generated/prisma/client';

const router = Router();

router.get('/me', authenticate, asyncHandler(getCurrentUser));
router.put('/me', authenticate, validate(updateProfileSchema), asyncHandler(updateMe));
router.get('/search', authenticate, validateQuery(searchUserSchema), asyncHandler(search));
router.get('/sessions', authenticate, asyncHandler(getSessions));
router.delete('/sessions/:id', authenticate, asyncHandler(revokeSession));

router.get(
  '/admin-test',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(adminTest)
);

export default router;

