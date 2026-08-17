import type { User } from './index';

export interface VelocityDataPoint {
  date: string;
  label: string;
  created: number;
  completed: number;
}

export interface MemberWorkload {
  id: string;
  role: string;
  user: User;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

export interface OrgDashboardSummary {
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  teamsCount: number;
  membersCount: number;
  tasks: {
    total: number;
    completed: number;
    active: number;
    overdue: number;
    completionRate: number;
    byStatus: {
      TODO: number;
      IN_PROGRESS: number;
      REVIEW: number;
      DONE: number;
      CANCELLED: number;
    };
    byPriority: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      URGENT: number;
    };
    storyPoints: {
      total: number;
      completed: number;
    };
  };
}

export interface OrgDashboardData {
  durationMs: number;
  summary: OrgDashboardSummary;
  workload: MemberWorkload[];
  velocity: VelocityDataPoint[];
  recentActivities: Array<{
    id: string;
    action: string;
    details?: Record<string, unknown> | null;
    createdAt: string;
    user: { id: string; name: string; avatarUrl?: string | null };
    project?: { id: string; name: string; key: string } | null;
    task?: { id: string; key: string; title: string } | null;
  }>;
}

export interface ProjectAnalyticsData {
  durationMs: number;
  project: {
    id: string;
    name: string;
    key: string;
    description?: string | null;
    status: string;
    priority: string;
    startDate?: string | null;
    targetDate?: string | null;
    team?: { id: string; name: string } | null;
    memberCount: number;
  };
  metrics: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    overdueCount: number;
    progressPercentage: number;
    byStatus: {
      TODO: number;
      IN_PROGRESS: number;
      REVIEW: number;
      DONE: number;
      CANCELLED: number;
    };
    byPriority: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      URGENT: number;
    };
    storyPoints: {
      total: number;
      completed: number;
    };
  };
  sprints: Array<{
    id: string;
    name: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
    taskCount: number;
  }>;
  overdueTasks: Array<{
    id: string;
    key: string;
    title: string;
    dueDate?: string | null;
    status: string;
    priority: string;
    assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  }>;
  memberWorkload: Array<{
    user: { id: string; name: string; email: string; avatarUrl?: string | null };
    role: string;
    assignedTasks: number;
  }>;
  velocity: VelocityDataPoint[];
  recentActivities: Array<{
    id: string;
    action: string;
    details?: Record<string, unknown> | null;
    createdAt: string;
    user: { id: string; name: string; avatarUrl?: string | null };
    project?: { id: string; name: string; key: string } | null;
    task?: { id: string; key: string; title: string } | null;
  }>;
}

export interface UserDashboardData {
  metrics: {
    totalAssigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionRate: number;
    byStatus: {
      TODO: number;
      IN_PROGRESS: number;
      REVIEW: number;
      DONE: number;
      CANCELLED: number;
    };
  };
  assignedTasks: Array<{
    id: string;
    key: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
    projectId: string;
    project: { id: string; name: string; key: string };
  }>;
  recentActivities: Array<{
    id: string;
    createdAt: string;
    project?: { id: string; name: string; key: string } | null;
    task?: { id: string; key: string; title: string } | null;
  }>;
}
