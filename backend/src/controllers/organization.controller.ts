import { Request, Response } from 'express';
import {
  createOrganization,
  getUserOrgs,
  getOrganizationDetails,
  updateOrganizationDetails,
  deleteOrganization,
  getOrganizationMembers,
  addMemberToOrganization,
  updateMemberRoleService,
  removeMemberFromOrg,
  transferOrganizationOwnership,
  getMyOrgPermissions,
  getOrgPermissionsMatrix,
} from '../services/organization.service';


const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const { name, slug, logoUrl } = req.body;

  const organization = await createOrganization(userId, name, slug, logoUrl);

  res.status(201).json({
    success: true,
    data: organization,
  });
};

export const listMyOrgs = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;

  const organizations = await getUserOrgs(userId);

  res.status(200).json({
    success: true,
    data: organizations,
  });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id);

  const organization = await getOrganizationDetails(orgId, userId);

  res.status(200).json({
    success: true,
    data: organization,
  });
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const orgId = getParam(req.params.id);
  const { name, slug, logoUrl, isArchived } = req.body;

  const updatedOrg = await updateOrganizationDetails(orgId, {
    name,
    slug,
    logoUrl,
    isArchived,
  });

  res.status(200).json({
    success: true,
    data: updatedOrg,
  });
};

export const deleteOrgController = async (req: Request, res: Response): Promise<void> => {
  const orgId = getParam(req.params.id);

  await deleteOrganization(orgId);

  res.status(200).json({
    success: true,
    message: 'Organization deleted successfully',
  });
};

export const listMembers = async (req: Request, res: Response): Promise<void> => {
  const orgId = getParam(req.params.id);

  const members = await getOrganizationMembers(orgId);

  res.status(200).json({
    success: true,
    data: members,
  });
};

export const addMember = async (req: Request, res: Response): Promise<void> => {
  const { userId: actingUserId } = res.locals.user;
  const orgId = getParam(req.params.id);
  const { userId, role } = req.body;

  const member = await addMemberToOrganization(orgId, actingUserId, userId, role);

  res.status(201).json({
    success: true,
    data: member,
  });
};

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  const { userId: actingUserId } = res.locals.user;
  const orgId = getParam(req.params.id);
  const targetUserId = getParam(req.params.userId);
  const { role } = req.body;

  await updateMemberRoleService(orgId, actingUserId, targetUserId, role);

  res.status(200).json({
    success: true,
    message: 'Member role updated successfully',
  });
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const { userId: actingUserId } = res.locals.user;
  const orgId = getParam(req.params.id);
  const targetUserId = getParam(req.params.userId);

  await removeMemberFromOrg(orgId, actingUserId, targetUserId);

  res.status(200).json({
    success: true,
    message: 'Member removed successfully',
  });
};

export const transferOwnership = async (req: Request, res: Response): Promise<void> => {
  const { userId: currentOwnerId } = res.locals.user;
  const orgId = getParam(req.params.id);
  const { newOwnerId } = req.body;

  await transferOrganizationOwnership(orgId, currentOwnerId, newOwnerId);

  res.status(200).json({
    success: true,
    message: 'Ownership transferred successfully',
  });
};

export const getMyPermissionsController = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id);

  const permissions = await getMyOrgPermissions(orgId, userId);

  res.status(200).json({
    success: true,
    data: permissions,
  });
};

export const getMatrixController = async (_req: Request, res: Response): Promise<void> => {
  const matrix = getOrgPermissionsMatrix();

  res.status(200).json({
    success: true,
    data: matrix,
  });
};
