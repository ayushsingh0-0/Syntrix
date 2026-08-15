export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_MENTIONED'
  | 'COMMENT_MENTIONED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DUE_SOON'
  | 'INVITATION_RECEIVED';

export interface CreateNotificationDTO {
  userId: string;
  actorId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
}

export interface NotificationActor {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  actorId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  actor?: NotificationActor | null;
}
