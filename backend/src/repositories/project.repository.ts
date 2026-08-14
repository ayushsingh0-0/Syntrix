import prisma from '../config/prisma';
import { Prisma, ProjectRole } from '../generated/prisma/client';
import { CreateProjectInput, ProjectQueryParams, UpdateProjectInput } from '../types/project.types';

export const createProjectWithLead = async (
  organizationId: string,
  creatorUserId: string,
  data: CreateProjectInput
) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        organizationId,
        teamId: data.teamId || null,
        name: data.name,
        key: data.key.toUpperCase(),
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        startDate: data.startDate || null,
        targetDate: data.targetDate || null,
        members: {
          create: {
            userId: creatorUserId,
            role: ProjectRole.LEAD,
          },
        },
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return project;
  });
};

export const findProjectById = async (projectId: string) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        select: { id: true, name: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });
};

export const findProjectByOrgAndKey = async (organizationId: string, key: string) => {
  return prisma.project.findUnique({
    where: {
      organizationId_key: {
        organizationId,
        key: key.toUpperCase(),
      },
    },
  });
};

export const findPaginatedProjects = async (
  organizationId: string,
  params: ProjectQueryParams
) => {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where: Prisma.ProjectWhereInput = {
    organizationId,
    isArchived: params.isArchived ?? false,
    ...(params.status && { status: params.status }),
    ...(params.priority && { priority: params.priority }),
    ...(params.teamId && { teamId: params.teamId }),
    ...(params.q && {
      OR: [
        { name: { contains: params.q } },
        { key: { contains: params.q } },
      ],
    }),
  };

  const orderBy: Prisma.ProjectOrderByWithRelationInput = {
    [params.sortBy || 'createdAt']: params.sortOrder || 'desc',
  };

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        team: {
          select: { id: true, name: true },
        },
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
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    projects,
  };
};

export const updateProject = async (projectId: string, data: UpdateProjectInput) => {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.teamId !== undefined && { teamId: data.teamId }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
    },
    include: {
      team: {
        select: { id: true, name: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });
};

export const setProjectArchiveStatus = async (projectId: string, isArchived: boolean) => {
  return prisma.project.update({
    where: { id: projectId },
    data: { isArchived },
    include: {
      team: {
        select: { id: true, name: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });
};

export const deleteProject = async (projectId: string) => {
  return prisma.project.delete({
    where: { id: projectId },
  });
};

export const findProjectMember = async (projectId: string, userId: string) => {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
};

export const findProjectMembers = async (projectId: string) => {
  return prisma.projectMember.findMany({
    where: { projectId },
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

export const addProjectMember = async (
  projectId: string,
  userId: string,
  role: ProjectRole = ProjectRole.MEMBER
) => {
  return prisma.projectMember.create({
    data: {
      projectId,
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

export const updateProjectMemberRole = async (
  projectId: string,
  userId: string,
  role: ProjectRole
) => {
  return prisma.projectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    data: { role },
  });
};

export const removeProjectMember = async (projectId: string, userId: string) => {
  return prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
};

export const countProjectLeads = async (projectId: string) => {
  return prisma.projectMember.count({
    where: {
      projectId,
      role: ProjectRole.LEAD,
    },
  });
};
