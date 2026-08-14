import { Router } from 'express';
import {
  create,
  listMyOrgs,
  getById,
  update,
  deleteOrgController,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  transferOwnership,
} from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireOrgMember, requireOrgRole } from '../middleware/orgAuth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createOrgSchema,
  updateOrgSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from '../validations/organization.validation';
import { OrganizationRole } from '../generated/prisma/client';

const router = Router();

// Organization Collections
router.post('/', authenticate, validate(createOrgSchema), asyncHandler(create));
router.get('/', authenticate, asyncHandler(listMyOrgs));

// Organization Detail & Management
router.get('/:id', authenticate, asyncHandler(requireOrgMember), asyncHandler(getById));
router.put(
  '/:id',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgRole(OrganizationRole.OWNER, OrganizationRole.ADMIN),
  validate(updateOrgSchema),
  asyncHandler(update)
);
router.delete(
  '/:id',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgRole(OrganizationRole.OWNER),
  asyncHandler(deleteOrgController)
);

// Member Management
router.get('/:id/members', authenticate, asyncHandler(requireOrgMember), asyncHandler(listMembers));
router.post(
  '/:id/members',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgRole(OrganizationRole.OWNER, OrganizationRole.ADMIN),
  validate(addMemberSchema),
  asyncHandler(addMember)
);
router.patch(
  '/:id/members/:userId',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgRole(OrganizationRole.OWNER, OrganizationRole.ADMIN),
  validate(updateMemberRoleSchema),
  asyncHandler(updateMemberRole)
);
router.delete(
  '/:id/members/:userId',
  authenticate,
  asyncHandler(requireOrgMember),
  asyncHandler(removeMember)
);
router.post(
  '/:id/transfer-ownership',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgRole(OrganizationRole.OWNER),
  validate(transferOwnershipSchema),
  asyncHandler(transferOwnership)
);

export default router;
