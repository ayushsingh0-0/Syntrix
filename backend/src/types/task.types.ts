import type { TaskPriorityType, TaskStatusType } from './board.types';

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  assigneeId?: string;
  reporterId?: string;
  labelId?: string;
  columnId?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'number' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLabelDTO {
  name: string;
  color?: string;
  description?: string | null;
}

export interface UpdateLabelDTO {
  name?: string;
  color?: string;
  description?: string | null;
}

export type DependencyTypeEnum = 'BLOCKS' | 'BLOCKED_BY' | 'RELATES_TO';

export interface AddDependencyDTO {
  dependsOnTaskId: string;
  type?: DependencyTypeEnum;
}

export interface UpdateTaskDetailedDTO {
  title?: string;
  description?: string | null;
  columnId?: string | null;
  priority?: TaskPriorityType;
  status?: TaskStatusType;
  assigneeId?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  labelIds?: string[];
}
