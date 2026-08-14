import { Request, Response } from 'express';
import {
  createProjectService,
  getOrganizationProjectsService,
  getProjectDetailsService,
  updateProjectDetailsService,
  archiveProjectService,
  restoreProjectService,
  deleteProjectService,
  getProjectMembersService,
  addMemberToProjectService,
  updateProjectMemberRoleService,
  removeMemberFromProjectService,
} from '../services/project.service';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const data = req.body;

  const project = await createProjectService(orgId, userId, data);

  res.status(201).json({
    success: true,
    data: project,
  });
};

export const listProjects = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const query = res.locals.query || req.query;

  const result = await getOrganizationProjectsService(orgId, userId, query);

  res.status(200).json({
    success: true,
    meta: result.meta,
    data: result.data,
  });
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);

  const project = await getProjectDetailsService(orgId, projectId, userId);

  res.status(200).json({
    success: true,
    data: project,
  });
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);
  const data = req.body;

  const updated = await updateProjectDetailsService(orgId, projectId, userId, data);

  res.status(200).json({
    success: true,
    data: updated,
  });
};

export const archiveProject = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);

  const archived = await archiveProjectService(orgId, projectId, userId);

  res.status(200).json({
    success: true,
    message: 'Project archived successfully',
    data: archived,
  });
};

export const restoreProject = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);

  const restored = await restoreProjectService(orgId, projectId, userId);

  res.status(200).json({
    success: true,
    message: 'Project restored successfully',
    data: restored,
  });
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);

  await deleteProjectService(orgId, projectId, userId);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
};

export const listProjectMembers = async (req: Request, res: Response): Promise<void> => {
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);

  const members = await getProjectMembersService(orgId, projectId);

  res.status(200).json({
    success: true,
    data: members,
  });
};

export const addProjectMember = async (req: Request, res: Response): Promise<void> => {
  const { userId: actorUserId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);
  const { userId, role } = req.body;

  const member = await addMemberToProjectService(orgId, projectId, actorUserId, userId, role);

  res.status(201).json({
    success: true,
    data: member,
  });
};

export const updateProjectMemberRole = async (req: Request, res: Response): Promise<void> => {
  const { userId: actorUserId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);
  const targetUserId = getParam(req.params.userId);
  const { role } = req.body;

  await updateProjectMemberRoleService(orgId, projectId, actorUserId, targetUserId, role);

  res.status(200).json({
    success: true,
    message: 'Project member role updated successfully',
  });
};

export const removeProjectMember = async (req: Request, res: Response): Promise<void> => {
  const { userId: actorUserId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const projectId = getParam(req.params.projectId);
  const targetUserId = getParam(req.params.userId);

  await removeMemberFromProjectService(orgId, projectId, actorUserId, targetUserId);

  res.status(200).json({
    success: true,
    message: 'Member removed from project successfully',
  });
};
