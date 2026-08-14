import { ApiError } from '../utils/ApiError';
import {
  createInvitation,
  updateInvitationToken,
  findInvitationById,
  findInvitationByTokenHash,
  findPendingInvitationByOrgAndEmail,
  findOrgInvitations,
  updateInvitationStatus,
  acceptInvitationTransaction,
} from '../repositories/invitation.repository';
import { findUserByEmail, findUserById } from '../repositories/user.repository';
import { findOrgMember, findOrgById } from '../repositories/organization.repository';
import { generateOpaqueToken, hashToken } from '../utils/token';
import { InvitationStatus, OrganizationRole } from '../generated/prisma/client';
import { canAssignRole } from '../config/permissions';
import { SafeInvitation, InvitationPreview } from '../types/invitation.types';

export const createOrganizationInvitation = async (
  orgId: string,
  invitedById: string,
  email: string,
  role: OrganizationRole = OrganizationRole.MEMBER
) => {
  const [org, actingMember] = await Promise.all([
    findOrgById(orgId),
    findOrgMember(orgId, invitedById),
  ]);

  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }

  if (!actingMember) {
    throw new ApiError(403, 'Actor is not a member of this organization');
  }

  // Privilege escalation check
  if (!canAssignRole(actingMember.role, role)) {
    throw new ApiError(
      403,
      `Forbidden: Your role (${actingMember.role}) cannot invite a member with role ${role}`
    );
  }

  // 1. Check if the email is already an active member of this organization
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const existingMember = await findOrgMember(orgId, existingUser.id);
    if (existingMember) {
      throw new ApiError(409, 'User is already a member of this organization');
    }
  }


  // 2. Generate 7-day token
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // 3. Check for existing pending invitation to refresh
  const existingPending = await findPendingInvitationByOrgAndEmail(orgId, email);

  let invitation;
  if (existingPending) {
    invitation = await updateInvitationToken(existingPending.id, tokenHash, expiresAt);
  } else {
    invitation = await createInvitation({
      organizationId: orgId,
      email,
      role,
      invitedById,
      tokenHash,
      expiresAt,
    });
  }

  console.log(`[INVITATION] Token generated for ${email} to join ${org.name}: ${rawToken}`);

  const safeInvitation: SafeInvitation = {
    id: invitation.id,
    organizationId: invitation.organizationId,
    email: invitation.email,
    role: invitation.role,
    invitedById: invitation.invitedById,
    expiresAt: invitation.expiresAt,
    status: invitation.status,
    createdAt: invitation.createdAt,
    invitedBy: invitation.invitedBy,
  };

  return {
    invitation: safeInvitation,
    ...(process.env.NODE_ENV !== 'production' && { debugToken: rawToken }),
  };
};

export const listOrganizationInvitations = async (orgId: string): Promise<SafeInvitation[]> => {
  const invitations = await findOrgInvitations(orgId);

  return invitations.map((inv) => ({
    id: inv.id,
    organizationId: inv.organizationId,
    email: inv.email,
    role: inv.role,
    invitedById: inv.invitedById,
    expiresAt: inv.expiresAt,
    status: inv.status,
    createdAt: inv.createdAt,
    invitedBy: inv.invitedBy,
  }));
};

export const resendOrganizationInvitation = async (orgId: string, invitationId: string) => {
  const invitation = await findInvitationById(invitationId);

  if (!invitation || invitation.organizationId !== orgId) {
    throw new ApiError(404, 'Invitation not found in this organization');
  }

  if (invitation.status === InvitationStatus.ACCEPTED) {
    throw new ApiError(400, 'Cannot resend an invitation that has already been accepted');
  }

  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await updateInvitationToken(invitation.id, tokenHash, expiresAt);

  console.log(`[INVITATION] Resent token for ${invitation.email}: ${rawToken}`);

  return {
    message: 'Invitation resent successfully',
    ...(process.env.NODE_ENV !== 'production' && { debugToken: rawToken }),
  };
};

export const revokeOrganizationInvitation = async (orgId: string, invitationId: string) => {
  const invitation = await findInvitationById(invitationId);

  if (!invitation || invitation.organizationId !== orgId) {
    throw new ApiError(404, 'Invitation not found in this organization');
  }

  if (invitation.status === InvitationStatus.ACCEPTED) {
    throw new ApiError(400, 'Cannot revoke an invitation that has already been accepted');
  }

  await updateInvitationStatus(invitation.id, InvitationStatus.REVOKED);
};

export const getInvitationPreview = async (rawToken: string): Promise<InvitationPreview> => {
  const tokenHash = hashToken(rawToken);
  const invitation = await findInvitationByTokenHash(tokenHash);

  if (!invitation) {
    throw new ApiError(404, 'Invitation not found');
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new ApiError(400, `Invitation is no longer valid (${invitation.status.toLowerCase()})`);
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    await updateInvitationStatus(invitation.id, InvitationStatus.EXPIRED);
    throw new ApiError(400, 'Invitation has expired');
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    organization: invitation.organization,
    invitedBy: invitation.invitedBy,
  };
};

export const acceptOrganizationInvitation = async (
  userId: string,
  userEmail: string,
  rawToken: string
) => {
  const tokenHash = hashToken(rawToken);
  const invitation = await findInvitationByTokenHash(tokenHash);

  if (!invitation) {
    throw new ApiError(404, 'Invalid invitation token');
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new ApiError(400, `Invitation is no longer valid (${invitation.status.toLowerCase()})`);
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    await updateInvitationStatus(invitation.id, InvitationStatus.EXPIRED);
    throw new ApiError(400, 'Invitation has expired');
  }

  // Check if user is already a member
  const existingMember = await findOrgMember(invitation.organizationId, userId);
  if (existingMember) {
    await updateInvitationStatus(invitation.id, InvitationStatus.ACCEPTED);
    throw new ApiError(409, 'You are already a member of this organization');
  }

  const member = await acceptInvitationTransaction(
    invitation.id,
    invitation.organizationId,
    userId,
    invitation.role
  );

  return {
    organization: member.organization,
    role: member.role,
  };
};
