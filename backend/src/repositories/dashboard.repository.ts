import prisma from '../config/prisma';

export type TaskStatusType = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ProjectStatusType = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export class DashboardRepository {
  /**
   * Aggregate high-level organization KPIs and task status distributions
   */
  async getOrganizationSummary(orgId: string) {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTeams,
      totalMembers,
      allTasks,
      overdueTasksCount,
    ] = await Promise.all([
      prisma.project.count({ where: { organizationId: orgId, isArchived: false } }),
      prisma.project.count({ where: { organizationId: orgId, status: 'ACTIVE', isArchived: false } }),
      prisma.project.count({ where: { organizationId: orgId, status: 'COMPLETED' } }),
      prisma.team.count({ where: { organizationId: orgId } }),
      prisma.organizationMember.count({ where: { organizationId: orgId } }),
      prisma.task.findMany({
        where: { project: { organizationId: orgId, isArchived: false } },
        select: {
          id: true,
          status: true,
          priority: true,
          storyPoints: true,
        },
      }),
      prisma.task.count({
        where: {
          project: { organizationId: orgId, isArchived: false },
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),
    ]);

    // Calculate Status Breakdown
    const statusCounts: Record<TaskStatusType, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
      CANCELLED: 0,
    };

    // Calculate Priority Breakdown
    const priorityCounts: Record<TaskPriorityType, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    let totalStoryPoints = 0;
    let completedStoryPoints = 0;

    for (const task of allTasks) {
      const statusKey = task.status as TaskStatusType;
      const priorityKey = task.priority as TaskPriorityType;

      if (statusCounts[statusKey] !== undefined) {
        statusCounts[statusKey]++;
      }
      if (priorityCounts[priorityKey] !== undefined) {
        priorityCounts[priorityKey]++;
      }
      if (task.storyPoints) {
        totalStoryPoints += task.storyPoints;
        if (task.status === 'DONE') {
          completedStoryPoints += task.storyPoints;
        }
      }
    }

    const totalTasks = allTasks.length;
    const completedTasks = statusCounts.DONE;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },
      teamsCount: totalTeams,
      membersCount: totalMembers,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        active: totalTasks - completedTasks - statusCounts.CANCELLED,
        overdue: overdueTasksCount,
        completionRate,
        byStatus: statusCounts,
        byPriority: priorityCounts,
        storyPoints: {
          total: totalStoryPoints,
          completed: completedStoryPoints,
        },
      },
    };
  }

  /**
   * Aggregate member workload and capacity within an organization
   */
  async getMemberWorkload(orgId: string) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
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

    const userIds = members.map((m) => m.userId);

    const tasks = await prisma.task.findMany({
      where: {
        project: { organizationId: orgId, isArchived: false },
        assigneeId: { in: userIds },
      },
      select: {
        assigneeId: true,
        status: true,
      },
    });

    const workloadMap = new Map<
      string,
      { assigned: number; inProgress: number; completed: number }
    >();

    for (const id of userIds) {
      workloadMap.set(id, { assigned: 0, inProgress: 0, completed: 0 });
    }

    for (const task of tasks) {
      if (task.assigneeId && workloadMap.has(task.assigneeId)) {
        const entry = workloadMap.get(task.assigneeId)!;
        entry.assigned++;
        if (task.status === 'IN_PROGRESS' || task.status === 'REVIEW') {
          entry.inProgress++;
        } else if (task.status === 'DONE') {
          entry.completed++;
        }
      }
    }

    return members.map((m) => {
      const stats = workloadMap.get(m.userId) || { assigned: 0, inProgress: 0, completed: 0 };
      return {
        id: m.id,
        role: m.role,
        user: m.user,
        assignedTasks: stats.assigned,
        inProgressTasks: stats.inProgress,
        completedTasks: stats.completed,
      };
    });
  }

  /**
   * Calculate daily completion velocity timeline (last N days)
   */
  async getCompletionVelocity(orgId: string, days = 14, projectId?: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        project: {
          organizationId: orgId,
          ...(projectId ? { id: projectId } : {}),
        },
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Build day-by-day buckets
    const timeline: Array<{
      date: string;
      label: string;
      created: number;
      completed: number;
    }> = [];

    for (let i = 0; i < days; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      timeline.push({
        date: dateStr,
        label,
        created: 0,
        completed: 0,
      });
    }

    const dayMap = new Map(timeline.map((t) => [t.date, t]));

    for (const t of tasks) {
      const createdDate = t.createdAt.toISOString().split('T')[0];
      if (dayMap.has(createdDate)) {
        dayMap.get(createdDate)!.created++;
      }
      if (t.status === 'DONE') {
        const completedDate = t.updatedAt.toISOString().split('T')[0];
        if (dayMap.has(completedDate)) {
          dayMap.get(completedDate)!.completed++;
        }
      }
    }

    return timeline;
  }

  /**
   * Fetch recent audit / activity stream
   */
  async getRecentActivities(orgId: string, limit = 10, projectId?: string) {
    return prisma.activityLog.findMany({
      where: {
        organizationId: orgId,
        ...(projectId ? { projectId } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, key: true } },
        task: { select: { id: true, key: true, title: true } },
      },
    });
  }

  /**
   * Aggregate deep project-level analytics
   */
  async getProjectAnalytics(orgId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
      include: {
        team: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        sprints: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { tasks: true } },
          },
        },
      },
    });

    if (!project) return null;

    const [tasks, overdueTasks] = await Promise.all([
      prisma.task.findMany({
        where: { projectId },
        select: {
          id: true,
          status: true,
          priority: true,
          storyPoints: true,
          assigneeId: true,
        },
      }),
      prisma.task.findMany({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
        select: {
          id: true,
          key: true,
          title: true,
          dueDate: true,
          status: true,
          priority: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const statusCounts: Record<TaskStatusType, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
      CANCELLED: 0,
    };

    const priorityCounts: Record<TaskPriorityType, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    let totalPoints = 0;
    let completedPoints = 0;

    for (const t of tasks) {
      const statusKey = t.status as TaskStatusType;
      const priorityKey = t.priority as TaskPriorityType;

      if (statusCounts[statusKey] !== undefined) statusCounts[statusKey]++;
      if (priorityCounts[priorityKey] !== undefined) priorityCounts[priorityKey]++;
      if (t.storyPoints) {
        totalPoints += t.storyPoints;
        if (t.status === 'DONE') completedPoints += t.storyPoints;
      }
    }

    const totalTasks = tasks.length;
    const completedTasks = statusCounts.DONE;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Member workload in project
    const memberTaskMap = new Map<string, number>();
    project.members.forEach((m) => memberTaskMap.set(m.userId, 0));
    tasks.forEach((t) => {
      if (t.assigneeId && memberTaskMap.has(t.assigneeId)) {
        memberTaskMap.set(t.assigneeId, memberTaskMap.get(t.assigneeId)! + 1);
      }
    });

    const memberWorkload = project.members.map((m) => ({
      user: m.user,
      role: m.role,
      assignedTasks: memberTaskMap.get(m.userId) || 0,
    }));

    return {
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        targetDate: project.targetDate,
        team: project.team,
        memberCount: project.members.length,
      },
      metrics: {
        totalTasks,
        completedTasks,
        activeTasks: totalTasks - completedTasks - statusCounts.CANCELLED,
        overdueCount: overdueTasks.length,
        progressPercentage,
        byStatus: statusCounts,
        byPriority: priorityCounts,
        storyPoints: {
          total: totalPoints,
          completed: completedPoints,
        },
      },
      sprints: project.sprints.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        taskCount: s._count.tasks,
      })),
      overdueTasks,
      memberWorkload,
    };
  }

  /**
   * Aggregate personal user dashboard metrics within an organization
   */
  async getUserDashboard(orgId: string, userId: string) {
    const [assignedTasks, overdueCount, recentActivities] = await Promise.all([
      prisma.task.findMany({
        where: {
          project: { organizationId: orgId, isArchived: false },
          assigneeId: userId,
        },
        select: {
          id: true,
          key: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          projectId: true,
          project: { select: { id: true, name: true, key: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.task.count({
        where: {
          project: { organizationId: orgId, isArchived: false },
          assigneeId: userId,
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),
      prisma.activityLog.findMany({
        where: { organizationId: orgId, userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true, key: true } },
          task: { select: { id: true, key: true, title: true } },
        },
      }),
    ]);

    const statusCounts: Record<TaskStatusType, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
      CANCELLED: 0,
    };

    for (const t of assignedTasks) {
      const statusKey = t.status as TaskStatusType;
      if (statusCounts[statusKey] !== undefined) statusCounts[statusKey]++;
    }

    const total = assignedTasks.length;
    const completed = statusCounts.DONE;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      metrics: {
        totalAssigned: total,
        inProgress: statusCounts.IN_PROGRESS + statusCounts.REVIEW,
        completed,
        overdue: overdueCount,
        completionRate,
        byStatus: statusCounts,
      },
      assignedTasks: assignedTasks.slice(0, 10),
      recentActivities,
    };
  }
}
