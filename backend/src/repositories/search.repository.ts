import prisma from '../config/prisma';

export class SearchRepository {
  /**
   * Search projects within an organization
   */
  async searchProjects(orgId: string, query: string, limit: number) {
    return prisma.project.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query } },
          { key: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        status: true,
        priority: true,
        isArchived: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });
  }

  /**
   * Search tasks across projects within an organization
   */
  async searchTasks(orgId: string, query: string, limit: number, projectId?: string) {
    return prisma.task.findMany({
      where: {
        project: {
          organizationId: orgId,
          ...(projectId ? { id: projectId } : {}),
        },
        OR: [
          { key: { contains: query } },
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        key: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Search comments within task discussions of an organization
   */
  async searchComments(orgId: string, query: string, limit: number, projectId?: string) {
    return prisma.comment.findMany({
      where: {
        task: {
          project: {
            organizationId: orgId,
            ...(projectId ? { id: projectId } : {}),
          },
        },
        content: { contains: query },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        task: {
          select: {
            id: true,
            key: true,
            title: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
                key: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Search team members within an organization
   */
  async searchMembers(orgId: string, query: string, limit: number) {
    return prisma.organizationMember.findMany({
      where: {
        organizationId: orgId,
        user: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
