import { Job, Worker } from 'bullmq';
import { getRedisClient, isRedisReady } from '../config/redis.config';
import { QueueName, NotificationJobData, NotificationJobType } from '../types/queue.types';
import { NotificationRepository } from '../repositories/notification.repository';
import type { CreateNotificationDTO } from '../types/notification.types';

const notificationRepo = new NotificationRepository();

/**
 * Core business processor for Notification Jobs
 * Used both by BullMQ Worker and the offline direct fallback
 */
export const processNotificationJob = async (data: NotificationJobData): Promise<void> => {
  switch (data.type) {
    case NotificationJobType.TASK_ASSIGNED: {
      if (!data.assigneeId || data.assigneeId === data.actorId) return;

      await notificationRepo.createNotification({
        userId: data.assigneeId,
        actorId: data.actorId,
        organizationId: data.orgId,
        projectId: data.projectId,
        taskId: data.taskId,
        type: 'TASK_ASSIGNED',
        title: `Assigned to ${data.taskKey}`,
        message: `You were assigned to task ${data.taskKey}: ${data.taskTitle}`,
        data: { taskKey: data.taskKey, taskTitle: data.taskTitle },
      });
      break;
    }

    case NotificationJobType.COMMENT_MENTION: {
      const recipients = Array.from(new Set(data.mentionedUserIds)).filter(
        (id) => id && id !== data.authorId
      );
      if (recipients.length === 0) return;

      const truncated =
        data.commentContent.length > 80
          ? `${data.commentContent.substring(0, 80)}...`
          : data.commentContent;

      const notifications: CreateNotificationDTO[] = recipients.map((userId) => ({
        userId,
        actorId: data.authorId,
        organizationId: data.orgId,
        projectId: data.projectId,
        taskId: data.taskId,
        type: 'COMMENT_MENTIONED',
        title: `Mentioned by ${data.authorName} in ${data.taskKey}`,
        message: `${data.authorName} mentioned you: "${truncated}"`,
        data: { taskKey: data.taskKey, taskId: data.taskId },
      }));

      await notificationRepo.createMany(notifications);
      break;
    }

    case NotificationJobType.TASK_STATUS_CHANGED: {
      const targetRecipients = Array.from(new Set(data.recipients)).filter(
        (id) => id && id !== data.actorId
      );
      if (targetRecipients.length === 0) return;

      const notifications: CreateNotificationDTO[] = targetRecipients.map((userId) => ({
        userId,
        actorId: data.actorId,
        organizationId: data.orgId,
        projectId: data.projectId,
        taskId: data.taskId,
        type: 'TASK_STATUS_CHANGED',
        title: `Status Updated on ${data.taskKey}`,
        message: `${data.actorName} moved ${data.taskKey} from ${data.fromStatus} to ${data.toStatus}`,
        data: { taskKey: data.taskKey, fromStatus: data.fromStatus, toStatus: data.toStatus },
      }));

      await notificationRepo.createMany(notifications);
      break;
    }

    default:
      console.warn('[Notification Worker] Unknown notification job data:', data);
  }
};

/**
 * Creates and registers the BullMQ Notification Worker
 */
export const createNotificationWorker = (): Worker<NotificationJobData> | null => {
  const redis = getRedisClient();
  if (!redis || !isRedisReady()) {
    return null;
  }

  const worker = new Worker<NotificationJobData>(
    QueueName.NOTIFICATION,
    async (job: Job<NotificationJobData>) => {
      console.log(`[Notification Worker] Processing Job ID: ${job.id} (${job.data.type})`);
      await processNotificationJob(job.data);
    },
    {
      connection: redis,
      concurrency: 10,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Notification Worker] Completed Job ID: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Notification Worker] Failed Job ID: ${job?.id}:`, err.message);
  });

  return worker;
};
