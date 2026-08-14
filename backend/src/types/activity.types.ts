export type ActivityActionType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'SPRINT_CHANGED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_DELETED';


export interface CreateActivityDTO {
  organizationId: string;
  projectId?: string | null;
  taskId?: string | null;
  userId: string;
  action: ActivityActionType;
  details?: Record<string, unknown> | null;
}

export interface ActivityUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface ActivityLogResponse {
  id: string;
  organizationId: string;
  projectId?: string | null;
  taskId?: string | null;
  userId: string;
  action: ActivityActionType;
  details?: Record<string, unknown> | null;
  user: ActivityUser;
  createdAt: Date;
}
