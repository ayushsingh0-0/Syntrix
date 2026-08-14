import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  archiveProject,
  restoreProject,
  deleteProject,
  listProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from '../controllers/project.controller';
import { requireOrgPermission } from '../middleware/orgAuth.middleware';
import { validate, validateQuery } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  addProjectMemberSchema,
  updateProjectMemberRoleSchema,
} from '../validations/project.validation';
import { OrgPermission } from '../config/permissions';

const router = Router({ mergeParams: true });

// Project Collections & Details
router.post(
  '/',
  requireOrgPermission(OrgPermission.PROJECT_CREATE),
  validate(createProjectSchema),
  asyncHandler(createProject)
);
router.get(
  '/',
  requireOrgPermission(OrgPermission.PROJECT_READ),
  validateQuery(projectQuerySchema),
  asyncHandler(listProjects)
);
router.get('/:projectId', requireOrgPermission(OrgPermission.PROJECT_READ), asyncHandler(getProject));
router.put('/:projectId', validate(updateProjectSchema), asyncHandler(updateProject));
router.patch('/:projectId/archive', asyncHandler(archiveProject));
router.patch('/:projectId/restore', asyncHandler(restoreProject));
router.delete('/:projectId', asyncHandler(deleteProject));

// Project Members Management
router.get('/:projectId/members', asyncHandler(listProjectMembers));
router.post('/:projectId/members', validate(addProjectMemberSchema), asyncHandler(addProjectMember));
router.patch(
  '/:projectId/members/:userId',
  validate(updateProjectMemberRoleSchema),
  asyncHandler(updateProjectMemberRole)
);
// Sub-resource routers: Boards & Tasks
import boardRoutes from './board.routes';
import taskRoutes from './task.routes';

router.use('/:projectId/boards', boardRoutes);
router.use('/:projectId/tasks', taskRoutes);

export default router;

