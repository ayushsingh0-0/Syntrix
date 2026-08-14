import { Request, Response } from 'express';
import {
  createOrganizationInvitation,
  listOrganizationInvitations,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
  getInvitationPreview,
  acceptOrganizationInvitation,
} from '../services/invitation.service';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export const createInvite = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const orgId = getParam(req.params.id || req.params.orgId);
  const { email, role } = req.body;

  const result = await createOrganizationInvitation(orgId, userId, email, role);

  res.status(201).json({
    success: true,
    data: result.invitation,
    ...(result.debugToken && { debugToken: result.debugToken }),
  });
};

export const listInvites = async (req: Request, res: Response): Promise<void> => {
  const orgId = getParam(req.params.id || req.params.orgId);

  const invitations = await listOrganizationInvitations(orgId);

  res.status(200).json({
    success: true,
    data: invitations,
  });
};

export const resendInvite = async (req: Request, res: Response): Promise<void> => {
  const orgId = getParam(req.params.id || req.params.orgId);
  const invitationId = getParam(req.params.invitationId);

  const result = await resendOrganizationInvitation(orgId, invitationId);

  res.status(200).json({
    success: true,
    ...result,
  });
};

export const revokeInvite = async (req: Request, res: Response): Promise<void> => {
  const orgId = getParam(req.params.id || req.params.orgId);
  const invitationId = getParam(req.params.invitationId);

  await revokeOrganizationInvitation(orgId, invitationId);

  res.status(200).json({
    success: true,
    message: 'Invitation revoked successfully',
  });
};

export const previewInvite = async (req: Request, res: Response): Promise<void> => {
  const token = getParam(req.params.token);

  const preview = await getInvitationPreview(token);

  res.status(200).json({
    success: true,
    data: preview,
  });
};

export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
  const { userId, email } = res.locals.user;
  const { token } = req.body;

  const result = await acceptOrganizationInvitation(userId, email, token);

  res.status(200).json({
    success: true,
    message: 'Invitation accepted successfully',
    data: result,
  });
};
