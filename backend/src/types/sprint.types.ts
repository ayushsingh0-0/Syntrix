export type SprintStatusType = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface CreateSprintDTO {
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateSprintDTO {
  name?: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface StartSprintDTO {
  startDate: string;
  endDate: string;
  goal?: string | null;
}

export interface CompleteSprintDTO {
  rolloverToSprintId?: string | null; // null = return to backlog
}

export interface AssignTasksToSprintDTO {
  taskIds: string[];
}

export interface BurndownDataPoint {
  date: string;
  idealRemainingPoints: number;
  actualRemainingPoints: number;
  idealRemainingTasks: number;
  actualRemainingTasks: number;
}

export interface BurndownResponse {
  sprint: {
    id: string;
    name: string;
    status: SprintStatusType;
    startDate: string;
    endDate: string;
    totalStoryPoints: number;
    completedStoryPoints: number;
    totalTasks: number;
    completedTasks: number;
  };
  timeline: BurndownDataPoint[];
}
