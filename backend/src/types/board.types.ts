export interface CreateBoardDTO {
  name: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface UpdateBoardDTO {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface CreateColumnDTO {
  name: string;
  color?: string | null;
  wipLimit?: number | null;
}

export interface UpdateColumnDTO {
  name?: string;
  color?: string | null;
  wipLimit?: number | null;
}

export interface ReorderColumnItem {
  id: string;
  position: number;
}

export interface ReorderColumnsDTO {
  columns: ReorderColumnItem[];
}

export type TaskPriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatusType = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';

export interface CreateTaskDTO {
  title: string;
  description?: string | null;
  columnId?: string | null;
  priority?: TaskPriorityType;
  status?: TaskStatusType;
  assigneeId?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  columnId?: string | null;
  priority?: TaskPriorityType;
  status?: TaskStatusType;
  assigneeId?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
}

export interface MoveTaskDTO {
  columnId: string;
  targetPosition: number; // e.g. index or position in column
  targetStatus?: TaskStatusType;
}
