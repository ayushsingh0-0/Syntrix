import prisma from '../config/prisma';
import { OrganizationRole } from '../generated/prisma/client';

export type CreateOrgData = {
  name: string;
  slug: string;
  logoUrl?: string | null;
};

export type UpdateOrgData = {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  isArchived?: boolean;
};

export const createOrgWithFirstMember = async (data: CreateOrgData, ownerId: string) => {
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
      },
    });

    const member = await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: ownerId,
        role: OrganizationRole.OWNER,
      },
    });

    return { organization, member };
  });
};

export const findOrgById = async (id: string) => {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });
};

export const findOrgBySlug = async (slug: string) => {
  return prisma.organization.findUnique({
    where: { slug },
  });
};

export const findUserOrganizations = async (userId: string) => {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return memberships.map((m) => ({
    ...m.organization,
    myRole: m.role,
    memberCount: m.organization._count.members,
  }));
};

export const updateOrg = async (id: string, data: UpdateOrgData) => {
  return prisma.organization.update({
    where: { id },
    data,
  });
};

export const deleteOrg = async (id: string) => {
  return prisma.organization.delete({
    where: { id },
  });
};

export const findOrgMember = async (organizationId: string, userId: string) => {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      user: {
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

export const findOrgMembers = async (organizationId: string) => {
  return prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
};

export const addOrgMember = async (
  organizationId: string,
  userId: string,
  role: OrganizationRole = OrganizationRole.MEMBER
) => {
  return prisma.organizationMember.create({
    data: {
      organizationId,
      userId,
      role,
    },
    include: {
      user: {
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

export const updateOrgMemberRole = async (
  organizationId: string,
  userId: string,
  role: OrganizationRole
) => {
  return prisma.organizationMember.update({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    data: { role },
  });
};

export const removeOrgMember = async (organizationId: string, userId: string) => {
  return prisma.organizationMember.delete({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });
};

export const countOrgOwners = async (organizationId: string) => {
  return prisma.organizationMember.count({
    where: {
      organizationId,
      role: OrganizationRole.OWNER,
    },
  });
};

export const transferOrgOwnership = async (
  organizationId: string,
  currentOwnerId: string,
  newOwnerId: string
) => {
  return prisma.$transaction(async (tx) => {
    // Demote current owner to ADMIN
    await tx.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId: currentOwnerId,
        },
      },
      data: { role: OrganizationRole.ADMIN },
    });

    // Promote new owner to OWNER
    const newOwnerMember = await tx.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId: newOwnerId,
        },
      },
      data: { role: OrganizationRole.OWNER },
    });

    return newOwnerMember;
  });
};
