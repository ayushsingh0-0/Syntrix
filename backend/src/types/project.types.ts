import { ProjectPriority, ProjectRole, ProjectStatus } from '../generated/prisma/client';
import { PublicUser } from './user.types';

export type SafeProject = {
  id: string;
  organizationId: string;
  teamId: string | null;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: Date | null;
  targetDate: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  team?: {
    id: string;
    name: string;
  } | null;
  memberCount?: number;
  myRole?: ProjectRole;
};

export type SafeProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: Date;
  updatedAt: Date;
  user: PublicUser;
};

export type CreateProjectInput = {
  name: string;
  key: string;
  description?: string | null;
  teamId?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date | null;
  targetDate?: Date | null;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
  teamId?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date | null;
  targetDate?: Date | null;
};

export type ProjectQueryParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  teamId?: string;
  isArchived?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'targetDate';
  sortOrder?: 'asc' | 'desc';
};
