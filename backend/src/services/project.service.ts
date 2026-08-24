import { ApiError } from '../utils/ApiError';
import {
  createProjectWithLead,
  findProjectById,
  findProjectByOrgAndKey,
  findPaginatedProjects,
  updateProject,
  setProjectArchiveStatus,
  deleteProject,
  findProjectMember,
  findProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  countProjectLeads,
} from '../repositories/project.repository';
import { findOrgMember } from '../repositories/organization.repository';
import { findTeamById } from '../repositories/team.repository';
import { findUserById } from '../repositories/user.repository';
import { ProjectRole } from '../generated/prisma/client';
import { OrgPermission, hasOrgPermission } from '../config/permissions';
import { cacheService } from './cache.service';
import { CacheKeys } from '../types/cache.types';
import {
  CreateProjectInput,
  ProjectQueryParams,
  SafeProject,
  SafeProjectMember,
  UpdateProjectInput,
} from '../types/project.types';

const canManageProject = async (
  orgId: string,
  projectId: string,
  userId: string,
  permission: OrgPermission = OrgPermission.PROJECT_UPDATE
): Promise<boolean> => {
  const orgMember = await findOrgMember(orgId, userId);
  if (!orgMember) return false;

  // Org Owners, Admins, and Managers have required permission
  if (hasOrgPermission(orgMember.role, permission)) {
    return true;
  }

  // Otherwise, project LEADs have manage authority for their project
  const projectMember = await findProjectMember(projectId, userId);
  return projectMember?.role === ProjectRole.LEAD;
};

export const createProjectService = async (
  orgId: string,
  userId: string,
  data: CreateProjectInput
): Promise<SafeProject> => {
  // 1. Check for key collision in organization
  const existingKey = await findProjectByOrgAndKey(orgId, data.key);
  if (existingKey) {
    throw new ApiError(409, `Project key '${data.key.toUpperCase()}' is already in use in this organization`);
  }

  // 2. If teamId is provided, verify team belongs to this organization
  if (data.teamId) {
    const team = await findTeamById(data.teamId);
    if (!team || team.organizationId !== orgId) {
      throw new ApiError(404, 'Team not found in this organization');
    }
  }

  const project = await createProjectWithLead(orgId, userId, data);

  // Invalidate cached organization metrics & dashboards
  await cacheService.invalidatePattern(CacheKeys.orgPattern(orgId));

  return {
    id: project.id,
    organizationId: project.organizationId,
    teamId: project.teamId,
    name: project.name,
    key: project.key,
    description: project.description,
    status: project.status,
    priority: project.priority,
    startDate: project.startDate,
    targetDate: project.targetDate,
    isArchived: project.isArchived,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    team: project.team,
    memberCount: project._count.members,
    myRole: ProjectRole.LEAD,
  };
};

export const getOrganizationProjectsService = async (
  orgId: string,
  userId: string,
  params: ProjectQueryParams
) => {
  const result = await findPaginatedProjects(orgId, params);

  const data: SafeProject[] = result.projects.map((proj) => {
    const membership = proj.members.find((m) => m.userId === userId);
    return {
      id: proj.id,
      organizationId: proj.organizationId,
      teamId: proj.teamId,
      name: proj.name,
      key: proj.key,
      description: proj.description,
      status: proj.status,
      priority: proj.priority,
      startDate: proj.startDate,
      targetDate: proj.targetDate,
      isArchived: proj.isArchived,
      createdAt: proj.createdAt,
      updatedAt: proj.updatedAt,
      team: proj.team,
      memberCount: proj._count.members,
      myRole: membership?.role,
    };
  });

  return {
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
    data,
  };
};

export const getProjectDetailsService = async (
  orgId: string,
  projectId: string,
  userId: string
): Promise<SafeProject> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const callerMembership = await findProjectMember(projectId, userId);

  return {
    id: project.id,
    organizationId: project.organizationId,
    teamId: project.teamId,
    name: project.name,
    key: project.key,
    description: project.description,
    status: project.status,
    priority: project.priority,
    startDate: project.startDate,
    targetDate: project.targetDate,
    isArchived: project.isArchived,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    team: project.team,
    memberCount: project._count.members,
    myRole: callerMembership?.role,
  };
};

export const updateProjectDetailsService = async (
  orgId: string,
  projectId: string,
  actorUserId: string,
  data: UpdateProjectInput
): Promise<SafeProject> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const authorized = await canManageProject(orgId, projectId, actorUserId, OrgPermission.PROJECT_UPDATE);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to update this project');
  }

  const sanitizedData: UpdateProjectInput = {
    ...data,
    teamId: data.teamId && data.teamId.trim() ? data.teamId.trim() : null,
    description: data.description !== undefined ? (data.description && data.description.trim() ? data.description.trim() : null) : undefined,
  };

  if (sanitizedData.teamId) {
    const team = await findTeamById(sanitizedData.teamId);
    if (!team || team.organizationId !== orgId) {
      throw new ApiError(404, 'Team not found in this organization');
    }
  }

  const updated = await updateProject(projectId, sanitizedData);
  const callerMembership = await findProjectMember(projectId, actorUserId);

  await cacheService.invalidatePattern(CacheKeys.orgPattern(orgId));

  return {
    id: updated.id,
    organizationId: updated.organizationId,
    teamId: updated.teamId,
    name: updated.name,
    key: updated.key,
    description: updated.description,
    status: updated.status,
    priority: updated.priority,
    startDate: updated.startDate,
    targetDate: updated.targetDate,
    isArchived: updated.isArchived,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    team: updated.team,
    memberCount: updated._count.members,
    myRole: callerMembership?.role,
  };
};

export const archiveProjectService = async (
  orgId: string,
  projectId: string,
  actorUserId: string
): Promise<SafeProject> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const authorized = await canManageProject(orgId, projectId, actorUserId, OrgPermission.PROJECT_UPDATE);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to archive this project');
  }

  const updated = await setProjectArchiveStatus(projectId, true);
  const callerMembership = await findProjectMember(projectId, actorUserId);

  await cacheService.invalidatePattern(CacheKeys.orgPattern(orgId));

  return {
    id: updated.id,
    organizationId: updated.organizationId,
    teamId: updated.teamId,
    name: updated.name,
    key: updated.key,
    description: updated.description,
    status: updated.status,
    priority: updated.priority,
    startDate: updated.startDate,
    targetDate: updated.targetDate,
    isArchived: updated.isArchived,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    team: updated.team,
    memberCount: updated._count.members,
    myRole: callerMembership?.role,
  };
};

export const restoreProjectService = async (
  orgId: string,
  projectId: string,
  actorUserId: string
): Promise<SafeProject> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const authorized = await canManageProject(orgId, projectId, actorUserId, OrgPermission.PROJECT_UPDATE);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to restore this project');
  }

  const updated = await setProjectArchiveStatus(projectId, false);
  const callerMembership = await findProjectMember(projectId, actorUserId);

  await cacheService.invalidatePattern(CacheKeys.orgPattern(orgId));

  return {
    id: updated.id,
    organizationId: updated.organizationId,
    teamId: updated.teamId,
    name: updated.name,
    key: updated.key,
    description: updated.description,
    status: updated.status,
    priority: updated.priority,
    startDate: updated.startDate,
    targetDate: updated.targetDate,
    isArchived: updated.isArchived,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    team: updated.team,
    memberCount: updated._count.members,
    myRole: callerMembership?.role,
  };
};

export const deleteProjectService = async (
  orgId: string,
  projectId: string,
  actorUserId: string
): Promise<void> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const authorized = await canManageProject(orgId, projectId, actorUserId, OrgPermission.PROJECT_DELETE);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to delete this project');
  }

  await deleteProject(projectId);
  await cacheService.invalidatePattern(CacheKeys.orgPattern(orgId));
};

export const getProjectMembersService = async (
  orgId: string,
  projectId: string
): Promise<SafeProjectMember[]> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const members = await findProjectMembers(projectId);

  return members.map((m) => ({
    id: m.id,
    projectId: m.projectId,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    user: m.user,
  }));
};

export const addMemberToProjectService = async (
  orgId: string,
  projectId: string,
  actorUserId: string,
  targetUserId: string,
  role: ProjectRole = ProjectRole.MEMBER
): Promise<SafeProjectMember> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const authorized = await canManageProject(orgId, projectId, actorUserId, OrgPermission.PROJECT_UPDATE);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to add members to this project');
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'Target user not found');
  }

  // CRITICAL: Check parent organization membership
  const orgMember = await findOrgMember(orgId, targetUserId);
  if (!orgMember) {
    throw new ApiError(400, 'User must be a member of the organization before joining a project');
  }

  const existingMember = await findProjectMember(projectId, targetUserId);
  if (existingMember) {
    throw new ApiError(409, 'User is already a member of this project');
  }

  const newMember = await addProjectMember(projectId, targetUserId, role);

  return {
    id: newMember.id,
    projectId: newMember.projectId,
    userId: newMember.userId,
    role: newMember.role,
    createdAt: newMember.createdAt,
    updatedAt: newMember.updatedAt,
    user: newMember.user,
  };
};

export const updateProjectMemberRoleService = async (
  orgId: string,
  projectId: string,
  actorUserId: string,
  targetUserId: string,
  newRole: ProjectRole
): Promise<void> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const authorized = await canManageProject(orgId, projectId, actorUserId, OrgPermission.PROJECT_UPDATE);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to modify member roles in this project');
  }

  const targetMember = await findProjectMember(projectId, targetUserId);
  if (!targetMember) {
    throw new ApiError(404, 'Member not found in this project');
  }

  // Prevent demoting the sole lead
  if (targetMember.role === ProjectRole.LEAD && newRole !== ProjectRole.LEAD) {
    const leadCount = await countProjectLeads(projectId);
    if (leadCount <= 1) {
      throw new ApiError(400, 'Cannot demote the sole lead of a project. Designate another lead first.');
    }
  }

  await updateProjectMemberRole(projectId, targetUserId, newRole);
};

export const removeMemberFromProjectService = async (
  orgId: string,
  projectId: string,
  actorUserId: string,
  targetUserId: string
): Promise<void> => {
  const project = await findProjectById(projectId);

  if (!project || project.organizationId !== orgId) {
    throw new ApiError(404, 'Project not found in this organization');
  }

  const targetMember = await findProjectMember(projectId, targetUserId);
  if (!targetMember) {
    throw new ApiError(404, 'Member not found in this project');
  }

  // If removing someone else, actor must be authorized
  if (actorUserId !== targetUserId) {
    const authorized = await canManageProject(orgId, projectId, actorUserId, OrgPermission.PROJECT_UPDATE);
    if (!authorized) {
      throw new ApiError(403, 'Forbidden: You do not have permission to remove members from this project');
    }
  }

  // Prevent leaving/removing the sole lead
  if (targetMember.role === ProjectRole.LEAD) {
    const leadCount = await countProjectLeads(projectId);
    if (leadCount <= 1) {
      throw new ApiError(400, 'The sole lead cannot leave the project without designating another lead or deleting the project.');
    }
  }

  await removeProjectMember(projectId, targetUserId);
};
