export enum QueueName {
  EMAIL = 'email-queue',
  NOTIFICATION = 'notification-queue',
  CLEANUP = 'cleanup-queue',
}

export enum EmailJobType {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  RESET_PASSWORD = 'RESET_PASSWORD',
  INVITATION_EMAIL = 'INVITATION_EMAIL',
  TASK_NOTIFICATION_EMAIL = 'TASK_NOTIFICATION_EMAIL',
}

export interface VerifyEmailJobData {
  type: EmailJobType.VERIFY_EMAIL;
  email: string;
  name: string;
  token: string;
  expiresAt: string | Date;
}

export interface ResetPasswordJobData {
  type: EmailJobType.RESET_PASSWORD;
  email: string;
  name: string;
  token: string;
  expiresAt: string | Date;
}

export interface InvitationEmailJobData {
  type: EmailJobType.INVITATION_EMAIL;
  email: string;
  inviterName: string;
  orgName: string;
  token: string;
}

export interface TaskNotificationEmailJobData {
  type: EmailJobType.TASK_NOTIFICATION_EMAIL;
  email: string;
  title: string;
  message: string;
  taskKey: string;
  actionUrl?: string;
}

export type EmailJobData =
  | VerifyEmailJobData
  | ResetPasswordJobData
  | InvitationEmailJobData
  | TaskNotificationEmailJobData;

export enum NotificationJobType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  COMMENT_MENTION = 'COMMENT_MENTION',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
}

export interface TaskAssignedJobData {
  type: NotificationJobType.TASK_ASSIGNED;
  assigneeId: string;
  actorId: string;
  orgId: string;
  projectId: string;
  taskId: string;
  taskKey: string;
  taskTitle: string;
}

export interface CommentMentionJobData {
  type: NotificationJobType.COMMENT_MENTION;
  mentionedUserIds: string[];
  authorId: string;
  authorName: string;
  orgId: string;
  projectId: string;
  taskId: string;
  taskKey: string;
  commentContent: string;
}

export interface TaskStatusChangedJobData {
  type: NotificationJobType.TASK_STATUS_CHANGED;
  recipients: string[];
  actorId: string;
  actorName: string;
  orgId: string;
  projectId: string;
  taskId: string;
  taskKey: string;
  fromStatus: string;
  toStatus: string;
}

export type NotificationJobData =
  | TaskAssignedJobData
  | CommentMentionJobData
  | TaskStatusChangedJobData;

export enum CleanupJobType {
  PURGE_EXPIRED_TOKENS = 'PURGE_EXPIRED_TOKENS',
  PURGE_ORPHANED_ATTACHMENTS = 'PURGE_ORPHANED_ATTACHMENTS',
}

export interface CleanupTokensJobData {
  type: CleanupJobType.PURGE_EXPIRED_TOKENS;
  maxAgeDays?: number;
}

export interface CleanupAttachmentsJobData {
  type: CleanupJobType.PURGE_ORPHANED_ATTACHMENTS;
  dryRun?: boolean;
}

export type CleanupJobData = CleanupTokensJobData | CleanupAttachmentsJobData;

export interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}
