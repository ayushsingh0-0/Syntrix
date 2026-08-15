import { NotificationRepository } from '../repositories/notification.repository';
import type { CreateNotificationDTO } from '../types/notification.types';

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  async getUserNotifications(
    userId: string,
    params: { page?: number; limit?: number; unreadOnly?: boolean }
  ) {
    return this.notificationRepo.findByUser(userId, params);
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.getUnreadCount(userId);
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationRepo.markAsRead(notificationId, userId);
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.markAllAsRead(userId);
    return { success: true };
  }

  async deleteNotification(notificationId: string, userId: string) {
    await this.notificationRepo.deleteNotification(notificationId, userId);
    return { success: true };
  }

  // --- Trigger Dispatchers ---

  /**
   * Send notification when task is assigned/reassigned to a user
   */
  async notifyTaskAssigned(
    assigneeId: string,
    actorId: string,
    orgId: string,
    projectId: string,
    taskId: string,
    taskKey: string,
    taskTitle: string
  ) {
    if (!assigneeId || assigneeId === actorId) return;

    await this.notificationRepo.createNotification({
      userId: assigneeId,
      actorId,
      organizationId: orgId,
      projectId,
      taskId,
      type: 'TASK_ASSIGNED',
      title: `Assigned to ${taskKey}`,
      message: `You were assigned to task ${taskKey}: ${taskTitle}`,
      data: { taskKey, taskTitle },
    });
  }

  /**
   * Send notifications when users are @mentioned in a comment
   */
  async notifyMentionInComment(
    mentionedUserIds: string[],
    authorId: string,
    authorName: string,
    orgId: string,
    projectId: string,
    taskId: string,
    taskKey: string,
    commentContent: string
  ) {
    const recipients = Array.from(new Set(mentionedUserIds)).filter((id) => id && id !== authorId);
    if (recipients.length === 0) return;

    const truncated =
      commentContent.length > 80 ? `${commentContent.substring(0, 80)}...` : commentContent;

    const notifications: CreateNotificationDTO[] = recipients.map((userId) => ({
      userId,
      actorId: authorId,
      organizationId: orgId,
      projectId,
      taskId,
      type: 'COMMENT_MENTIONED',
      title: `Mentioned by ${authorName} in ${taskKey}`,
      message: `${authorName} mentioned you: "${truncated}"`,
      data: { taskKey, taskId },
    }));

    await this.notificationRepo.createMany(notifications);
  }

  /**
   * Send notification when task status changes
   */
  async notifyTaskStatusChanged(
    recipients: string[],
    actorId: string,
    actorName: string,
    orgId: string,
    projectId: string,
    taskId: string,
    taskKey: string,
    fromStatus: string,
    toStatus: string
  ) {
    const targetRecipients = Array.from(new Set(recipients)).filter((id) => id && id !== actorId);
    if (targetRecipients.length === 0) return;

    const notifications: CreateNotificationDTO[] = targetRecipients.map((userId) => ({
      userId,
      actorId,
      organizationId: orgId,
      projectId,
      taskId,
      type: 'TASK_STATUS_CHANGED',
      title: `Status Updated on ${taskKey}`,
      message: `${actorName} moved ${taskKey} from ${fromStatus} to ${toStatus}`,
      data: { taskKey, fromStatus, toStatus },
    }));

    await this.notificationRepo.createMany(notifications);
  }
}

export const globalNotificationService = new NotificationService();
