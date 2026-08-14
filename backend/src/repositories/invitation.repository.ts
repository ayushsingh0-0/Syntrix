import prisma from '../config/prisma';
import { InvitationStatus, OrganizationRole } from '../generated/prisma/client';

export type CreateInvitationData = {
  organizationId: string;
  email: string;
  role: OrganizationRole;
  invitedById: string;
  tokenHash: string;
  expiresAt: Date;
};

export const createInvitation = async (data: CreateInvitationData) => {
  return prisma.invitation.create({
    data: {
      organizationId: data.organizationId,
      email: data.email,
      role: data.role,
      invitedById: data.invitedById,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      status: InvitationStatus.PENDING,
    },
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });
};

export const updateInvitationToken = async (id: string, tokenHash: string, expiresAt: Date) => {
  return prisma.invitation.update({
    where: { id },
    data: {
      tokenHash,
      expiresAt,
      status: InvitationStatus.PENDING,
    },
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });
};

export const findInvitationById = async (id: string) => {
  return prisma.invitation.findUnique({
    where: { id },
    include: {
      organization: true,
      invitedBy: {
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });
};

export const findInvitationByTokenHash = async (tokenHash: string) => {
  return prisma.invitation.findUnique({
    where: { tokenHash },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
};

export const findPendingInvitationByOrgAndEmail = async (organizationId: string, email: string) => {
  return prisma.invitation.findFirst({
    where: {
      organizationId,
      email,
      status: InvitationStatus.PENDING,
    },
  });
};

export const findOrgInvitations = async (organizationId: string) => {
  return prisma.invitation.findMany({
    where: { organizationId },
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateInvitationStatus = async (id: string, status: InvitationStatus) => {
  return prisma.invitation.update({
    where: { id },
    data: { status },
  });
};

export const acceptInvitationTransaction = async (
  invitationId: string,
  organizationId: string,
  userId: string,
  role: OrganizationRole
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Create or ensure membership
    const member = await tx.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
      },
      include: {
        organization: true,
      },
    });

    // 2. Mark invitation accepted
    await tx.invitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.ACCEPTED,
      },
    });

    return member;
  });
};
