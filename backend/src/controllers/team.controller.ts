import { Request, Response } from 'express';
import {
  createTeamService,
  getOrganizationTeamsService,
  getTeamDetailsService,
  updateTeamDetailsService,
  deleteTeamService,
  addMemberToTeamService,
  updateTeamMemberRoleService,
  removeMemberFromTeamService,
} from '../services/team.service';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const { name, description } = req.body;

  const team = await createTeamService(orgId, userId, name, description);

  res.status(201).json({
    success: true,
    data: team,
  });
};

export const listTeams = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);

  const teams = await getOrganizationTeamsService(orgId, userId);

  res.status(200).json({
    success: true,
    data: teams,
  });
};

export const getTeam = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const teamId = getParam(req.params.teamId);

  const details = await getTeamDetailsService(orgId, teamId, userId);

  res.status(200).json({
    success: true,
    data: details,
  });
};

export const updateTeam = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const teamId = getParam(req.params.teamId);
  const { name, description } = req.body;

  const updatedTeam = await updateTeamDetailsService(orgId, teamId, userId, { name, description });

  res.status(200).json({
    success: true,
    data: updatedTeam,
  });
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const teamId = getParam(req.params.teamId);

  await deleteTeamService(orgId, teamId, userId);

  res.status(200).json({
    success: true,
    message: 'Team deleted successfully',
  });
};

export const addTeamMember = async (req: Request, res: Response): Promise<void> => {
  const { userId: actorUserId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const teamId = getParam(req.params.teamId);
  const { userId, role } = req.body;

  const member = await addMemberToTeamService(orgId, teamId, actorUserId, userId, role);

  res.status(201).json({
    success: true,
    data: member,
  });
};

export const updateTeamMemberRole = async (req: Request, res: Response): Promise<void> => {
  const { userId: actorUserId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const teamId = getParam(req.params.teamId);
  const targetUserId = getParam(req.params.userId);
  const { role } = req.body;

  await updateTeamMemberRoleService(orgId, teamId, actorUserId, targetUserId, role);

  res.status(200).json({
    success: true,
    message: 'Team member role updated successfully',
  });
};

export const removeTeamMember = async (req: Request, res: Response): Promise<void> => {
  const { userId: actorUserId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const teamId = getParam(req.params.teamId);
  const targetUserId = getParam(req.params.userId);

  await removeMemberFromTeamService(orgId, teamId, actorUserId, targetUserId);

  res.status(200).json({
    success: true,
    message: 'Member removed from team successfully',
  });
};
