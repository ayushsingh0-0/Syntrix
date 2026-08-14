import { ApiError } from '../utils/ApiError';
import {
  createTeamWithLead,
  findTeamById,
  findTeamsByOrgId,
  updateTeam,
  deleteTeam,
  findTeamMember,
  findTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  countTeamLeads,
} from '../repositories/team.repository';
import { findOrgMember } from '../repositories/organization.repository';
import { findUserById } from '../repositories/user.repository';
import { TeamRole } from '../generated/prisma/client';
import { OrgPermission, hasOrgPermission } from '../config/permissions';
import { SafeTeam, SafeTeamMember, UpdateTeamInput } from '../types/team.types';

const canManageTeam = async (orgId: string, teamId: string, userId: string): Promise<boolean> => {
  const orgMember = await findOrgMember(orgId, userId);
  if (!orgMember) return false;

  // Org Owners, Admins, and Managers have OrgPermission.TEAM_MANAGE
  if (hasOrgPermission(orgMember.role, OrgPermission.TEAM_MANAGE)) {
    return true;
  }

  // Otherwise, team LEADs have manage authority for their own team
  const teamMember = await findTeamMember(teamId, userId);
  return teamMember?.role === TeamRole.LEAD;
};

export const createTeamService = async (
  orgId: string,
  userId: string,
  name: string,
  description?: string | null
): Promise<SafeTeam> => {
  const team = await createTeamWithLead(orgId, userId, name, description);

  return {
    id: team.id,
    organizationId: team.organizationId,
    name: team.name,
    description: team.description,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    memberCount: team._count.members,
    myRole: TeamRole.LEAD,
  };
};

export const getOrganizationTeamsService = async (
  orgId: string,
  userId: string
): Promise<SafeTeam[]> => {
  const teams = await findTeamsByOrgId(orgId);

  return teams.map((team) => {
    const membership = team.members.find((m) => m.userId === userId);
    return {
      id: team.id,
      organizationId: team.organizationId,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      memberCount: team._count.members,
      myRole: membership?.role,
    };
  });
};

export const getTeamDetailsService = async (
  orgId: string,
  teamId: string,
  userId: string
) => {
  const team = await findTeamById(teamId);

  if (!team || team.organizationId !== orgId) {
    throw new ApiError(404, 'Team not found in this organization');
  }

  const [members, callerMembership] = await Promise.all([
    findTeamMembers(teamId),
    findTeamMember(teamId, userId),
  ]);

  return {
    team: {
      id: team.id,
      organizationId: team.organizationId,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      memberCount: team._count.members,
      myRole: callerMembership?.role,
    },
    members: members.map((m) => ({
      id: m.id,
      teamId: m.teamId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      user: m.user,
    })),
  };
};

export const updateTeamDetailsService = async (
  orgId: string,
  teamId: string,
  actorUserId: string,
  data: UpdateTeamInput
): Promise<SafeTeam> => {
  const team = await findTeamById(teamId);

  if (!team || team.organizationId !== orgId) {
    throw new ApiError(404, 'Team not found in this organization');
  }

  const authorized = await canManageTeam(orgId, teamId, actorUserId);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to manage this team');
  }

  const updatedTeam = await updateTeam(teamId, data);
  const callerMembership = await findTeamMember(teamId, actorUserId);

  return {
    id: updatedTeam.id,
    organizationId: updatedTeam.organizationId,
    name: updatedTeam.name,
    description: updatedTeam.description,
    createdAt: updatedTeam.createdAt,
    updatedAt: updatedTeam.updatedAt,
    memberCount: updatedTeam._count.members,
    myRole: callerMembership?.role,
  };
};

export const deleteTeamService = async (
  orgId: string,
  teamId: string,
  actorUserId: string
): Promise<void> => {
  const team = await findTeamById(teamId);

  if (!team || team.organizationId !== orgId) {
    throw new ApiError(404, 'Team not found in this organization');
  }

  const authorized = await canManageTeam(orgId, teamId, actorUserId);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to delete this team');
  }

  await deleteTeam(teamId);
};

export const addMemberToTeamService = async (
  orgId: string,
  teamId: string,
  actorUserId: string,
  targetUserId: string,
  role: TeamRole = TeamRole.MEMBER
): Promise<SafeTeamMember> => {
  const team = await findTeamById(teamId);

  if (!team || team.organizationId !== orgId) {
    throw new ApiError(404, 'Team not found in this organization');
  }

  const authorized = await canManageTeam(orgId, teamId, actorUserId);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to add members to this team');
  }

  // 1. Verify target user exists
  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'Target user not found');
  }

  // 2. CRITICAL: Verify target user is already an active member of this organization
  const orgMember = await findOrgMember(orgId, targetUserId);
  if (!orgMember) {
    throw new ApiError(400, 'User must be a member of the organization before joining a team');
  }

  // 3. Check if already in team
  const existingTeamMember = await findTeamMember(teamId, targetUserId);
  if (existingTeamMember) {
    throw new ApiError(409, 'User is already a member of this team');
  }

  const newMember = await addTeamMember(teamId, targetUserId, role);

  return {
    id: newMember.id,
    teamId: newMember.teamId,
    userId: newMember.userId,
    role: newMember.role,
    createdAt: newMember.createdAt,
    updatedAt: newMember.updatedAt,
    user: newMember.user,
  };
};

export const updateTeamMemberRoleService = async (
  orgId: string,
  teamId: string,
  actorUserId: string,
  targetUserId: string,
  newRole: TeamRole
): Promise<void> => {
  const team = await findTeamById(teamId);

  if (!team || team.organizationId !== orgId) {
    throw new ApiError(404, 'Team not found in this organization');
  }

  const authorized = await canManageTeam(orgId, teamId, actorUserId);
  if (!authorized) {
    throw new ApiError(403, 'Forbidden: You do not have permission to modify member roles in this team');
  }

  const targetMember = await findTeamMember(teamId, targetUserId);
  if (!targetMember) {
    throw new ApiError(404, 'Member not found in this team');
  }

  // Prevent demoting the sole lead
  if (targetMember.role === TeamRole.LEAD && newRole !== TeamRole.LEAD) {
    const leadCount = await countTeamLeads(teamId);
    if (leadCount <= 1) {
      throw new ApiError(400, 'Cannot demote the sole lead of a team. Designate another lead first.');
    }
  }

  await updateTeamMemberRole(teamId, targetUserId, newRole);
};

export const removeMemberFromTeamService = async (
  orgId: string,
  teamId: string,
  actorUserId: string,
  targetUserId: string
): Promise<void> => {
  const team = await findTeamById(teamId);

  if (!team || team.organizationId !== orgId) {
    throw new ApiError(404, 'Team not found in this organization');
  }

  const targetMember = await findTeamMember(teamId, targetUserId);
  if (!targetMember) {
    throw new ApiError(404, 'Member not found in this team');
  }

  // If removing someone else, actor must have manage authority
  if (actorUserId !== targetUserId) {
    const authorized = await canManageTeam(orgId, teamId, actorUserId);
    if (!authorized) {
      throw new ApiError(403, 'Forbidden: You do not have permission to remove members from this team');
    }
  }

  // Prevent leaving/removing the sole lead
  if (targetMember.role === TeamRole.LEAD) {
    const leadCount = await countTeamLeads(teamId);
    if (leadCount <= 1) {
      throw new ApiError(400, 'The sole lead cannot leave the team without designating another lead or deleting the team.');
    }
  }

  await removeTeamMember(teamId, targetUserId);
};
