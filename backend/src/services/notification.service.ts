import { NotificationRepository } from '../repositories/notification.repository';
import { queueManager } from '../queues/queue.manager';
import { NotificationJobType } from '../types/queue.types';

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

  // --- Trigger Dispatchers (Async via Queue) ---

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

    await queueManager.addNotificationJob({
      type: NotificationJobType.TASK_ASSIGNED,
      assigneeId,
      actorId,
      orgId,
      projectId,
      taskId,
      taskKey,
      taskTitle,
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

    await queueManager.addNotificationJob({
      type: NotificationJobType.COMMENT_MENTION,
      mentionedUserIds: recipients,
      authorId,
      authorName,
      orgId,
      projectId,
      taskId,
      taskKey,
      commentContent,
    });
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

    await queueManager.addNotificationJob({
      type: NotificationJobType.TASK_STATUS_CHANGED,
      recipients: targetRecipients,
      actorId,
      actorName,
      orgId,
      projectId,
      taskId,
      taskKey,
      fromStatus,
      toStatus,
    });
  }
}

export const globalNotificationService = new NotificationService();

