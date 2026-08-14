import { Router } from 'express';
import {
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from '../controllers/team.controller';
import { requireOrgPermission } from '../middleware/orgAuth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  updateTeamMemberRoleSchema,
} from '../validations/team.validation';
import { OrgPermission } from '../config/permissions';

const router = Router({ mergeParams: true });

// Team Collections & Detail
router.get('/', requireOrgPermission(OrgPermission.MEMBER_READ), asyncHandler(listTeams));
router.post(
  '/',
  requireOrgPermission(OrgPermission.TEAM_MANAGE),
  validate(createTeamSchema),
  asyncHandler(createTeam)
);
router.get('/:teamId', requireOrgPermission(OrgPermission.MEMBER_READ), asyncHandler(getTeam));
router.put('/:teamId', validate(updateTeamSchema), asyncHandler(updateTeam));
router.delete('/:teamId', asyncHandler(deleteTeam));

// Team Member Management
router.post('/:teamId/members', validate(addTeamMemberSchema), asyncHandler(addTeamMember));
router.patch(
  '/:teamId/members/:userId',
  validate(updateTeamMemberRoleSchema),
  asyncHandler(updateTeamMemberRole)
);
router.delete('/:teamId/members/:userId', asyncHandler(removeTeamMember));

export default router;
