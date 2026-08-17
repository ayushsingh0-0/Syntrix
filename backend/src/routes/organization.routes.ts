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
  getMyPermissionsController,
  getMatrixController,
} from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireOrgMember, requireOrgPermission } from '../middleware/orgAuth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createInvite,
  listInvites,
  resendInvite,
  revokeInvite,
} from '../controllers/invitation.controller';
import {
  createOrgSchema,
  updateOrgSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from '../validations/organization.validation';
import { createInvitationSchema } from '../validations/invitation.validation';
import { OrgPermission } from '../config/permissions';

const router = Router();

// Global Permission Matrix
router.get('/matrix', asyncHandler(getMatrixController));

// Organization Collections
router.post('/', authenticate, validate(createOrgSchema), asyncHandler(create));
router.get('/', authenticate, asyncHandler(listMyOrgs));

// Organization Detail & Management
router.get('/:id', authenticate, asyncHandler(requireOrgMember), asyncHandler(getById));
router.put(
  '/:id',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.ORG_UPDATE),
  validate(updateOrgSchema),
  asyncHandler(update)
);
router.delete(
  '/:id',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.ORG_DELETE),
  asyncHandler(deleteOrgController)
);

// Member Permissions
router.get(
  '/:id/permissions/me',
  authenticate,
  asyncHandler(requireOrgMember),
  asyncHandler(getMyPermissionsController)
);

// Member Management
router.get(
  '/:id/members',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.MEMBER_READ),
  asyncHandler(listMembers)
);
router.post(
  '/:id/members',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.MEMBER_ROLE_UPDATE),
  validate(addMemberSchema),
  asyncHandler(addMember)
);
router.patch(
  '/:id/members/:userId',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.MEMBER_ROLE_UPDATE),
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
  requireOrgPermission(OrgPermission.ORG_TRANSFER_OWNERSHIP),
  validate(transferOwnershipSchema),
  asyncHandler(transferOwnership)
);

// Invitation Management
router.post(
  '/:id/invitations',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.MEMBER_INVITE),
  validate(createInvitationSchema),
  asyncHandler(createInvite)
);
router.get(
  '/:id/invitations',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.MEMBER_INVITE),
  asyncHandler(listInvites)
);
router.post(
  '/:id/invitations/:invitationId/resend',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.MEMBER_INVITE),
  asyncHandler(resendInvite)
);
router.delete(
  '/:id/invitations/:invitationId',
  authenticate,
  asyncHandler(requireOrgMember),
  requireOrgPermission(OrgPermission.MEMBER_INVITE),
  asyncHandler(revokeInvite)
);

// Team Management
import teamRoutes from './team.routes';
router.use('/:id/teams', authenticate, asyncHandler(requireOrgMember), teamRoutes);

// Project Management
import projectRoutes from './project.routes';
router.use('/:id/projects', authenticate, asyncHandler(requireOrgMember), projectRoutes);

// Label Management
import { TaskController } from '../controllers/task.controller';
const labelController = new TaskController();
router.get('/:id/labels', authenticate, asyncHandler(requireOrgMember), asyncHandler(labelController.getLabels));
router.post('/:id/labels', authenticate, asyncHandler(requireOrgMember), requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(labelController.createLabel));
router.put('/:id/labels/:labelId', authenticate, asyncHandler(requireOrgMember), requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(labelController.updateLabel));
router.delete('/:id/labels/:labelId', authenticate, asyncHandler(requireOrgMember), requireOrgPermission(OrgPermission.PROJECT_UPDATE), asyncHandler(labelController.deleteLabel));

// Global Search
import { searchController } from '../controllers/search.controller';
import { searchLimiter } from '../middleware/rateLimit.middleware';
router.get('/:id/search', authenticate, asyncHandler(requireOrgMember), searchLimiter, asyncHandler(searchController.search));

// Dashboard & Analytics
import { dashboardController } from '../controllers/dashboard.controller';
router.get('/:id/dashboard', authenticate, asyncHandler(requireOrgMember), searchLimiter, asyncHandler(dashboardController.getOrgDashboard));
router.get('/:id/dashboard/me', authenticate, asyncHandler(requireOrgMember), searchLimiter, asyncHandler(dashboardController.getUserDashboard));

export default router;





