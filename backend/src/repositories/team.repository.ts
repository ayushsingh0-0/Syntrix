import prisma from '../config/prisma';
import { TeamRole } from '../generated/prisma/client';
import { UpdateTeamInput } from '../types/team.types';

export const createTeamWithLead = async (
  organizationId: string,
  creatorUserId: string,
  name: string,
  description?: string | null
) => {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        organizationId,
        name,
        description: description || null,
        members: {
          create: {
            userId: creatorUserId,
            role: TeamRole.LEAD,
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return team;
  });
};

export const findTeamById = async (teamId: string) => {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });
};

export const findTeamsByOrgId = async (organizationId: string) => {
  return prisma.team.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { members: true },
      },
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const updateTeam = async (teamId: string, data: UpdateTeamInput) => {
  return prisma.team.update({
    where: { id: teamId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });
};

export const deleteTeam = async (teamId: string) => {
  return prisma.team.delete({
    where: { id: teamId },
  });
};

export const findTeamMember = async (teamId: string, userId: string) => {
  return prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
};

export const findTeamMembers = async (teamId: string) => {
  return prisma.teamMember.findMany({
    where: { teamId },
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
    orderBy: { createdAt: 'asc' },
  });
};

export const addTeamMember = async (teamId: string, userId: string, role: TeamRole = TeamRole.MEMBER) => {
  return prisma.teamMember.create({
    data: {
      teamId,
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

export const updateTeamMemberRole = async (teamId: string, userId: string, role: TeamRole) => {
  return prisma.teamMember.update({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    data: { role },
  });
};

export const removeTeamMember = async (teamId: string, userId: string) => {
  return prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
};

export const countTeamLeads = async (teamId: string) => {
  return prisma.teamMember.count({
    where: {
      teamId,
      role: TeamRole.LEAD,
    },
  });
};
