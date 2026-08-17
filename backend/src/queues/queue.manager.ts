import { Queue, JobsOptions } from 'bullmq';
import { getRedisClient, isRedisReady } from '../config/redis.config';
import {
  QueueName,
  EmailJobData,
  NotificationJobData,
  CleanupJobData,
  QueueMetrics,
} from '../types/queue.types';

export const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: {
    count: 100,
    age: 24 * 3600, // 24 hours
  },
  removeOnFail: {
    count: 500,
    age: 7 * 24 * 3600, // 7 days
  },
};

type DirectProcessor<T> = (data: T) => Promise<void>;

class QueueManager {
  private emailQueue: Queue<EmailJobData> | null = null;
  private notificationQueue: Queue<NotificationJobData> | null = null;
  private cleanupQueue: Queue<CleanupJobData> | null = null;

  // In-memory fallback handlers when Redis is unreachable
  private emailFallbackHandler: DirectProcessor<EmailJobData> | null = null;
  private notificationFallbackHandler: DirectProcessor<NotificationJobData> | null = null;
  private cleanupFallbackHandler: DirectProcessor<CleanupJobData> | null = null;

  /**
   * Register direct handlers for graceful offline execution
   */
  public registerFallbackProcessors(
    emailHandler: DirectProcessor<EmailJobData>,
    notificationHandler: DirectProcessor<NotificationJobData>,
    cleanupHandler: DirectProcessor<CleanupJobData>
  ) {
    this.emailFallbackHandler = emailHandler;
    this.notificationFallbackHandler = notificationHandler;
    this.cleanupFallbackHandler = cleanupHandler;
  }

  /**
   * Initialize BullMQ queues if Redis is configured and connected
   */
  public initializeQueues() {
    if (!isRedisReady()) {
      return;
    }

    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      this.emailQueue = new Queue<EmailJobData>(QueueName.EMAIL, {
        connection: redis,
        defaultJobOptions,
      });

      this.notificationQueue = new Queue<NotificationJobData>(QueueName.NOTIFICATION, {
        connection: redis,
        defaultJobOptions,
      });

      this.cleanupQueue = new Queue<CleanupJobData>(QueueName.CLEANUP, {
        connection: redis,
        defaultJobOptions,
      });

      console.log('[QueueManager] Initialized BullMQ queues: Email, Notification, Cleanup');
    } catch (err: unknown) {
      console.warn('[QueueManager] BullMQ queue initialization notice:', err);
    }
  }

  public getEmailQueue(): Queue<EmailJobData> | null {
    return this.emailQueue;
  }

  public getNotificationQueue(): Queue<NotificationJobData> | null {
    return this.notificationQueue;
  }

  public getCleanupQueue(): Queue<CleanupJobData> | null {
    return this.cleanupQueue;
  }

  /**
   * Enqueue an email job with idempotency support and offline fallback
   */
  public async addEmailJob(data: EmailJobData, customJobId?: string): Promise<string> {
    if (this.emailQueue && isRedisReady()) {
      try {
        const job = await this.emailQueue.add(data.type, data, {
          jobId: customJobId,
        });
        return job.id || `queued-${Date.now()}`;
      } catch (err) {
        console.warn('[QueueManager] Redis enqueue failed, falling back to direct handler:', err);
      }
    }

    // Direct synchronous/async fallback
    if (this.emailFallbackHandler) {
      await this.emailFallbackHandler(data);
    } else {
      console.log(`[QueueManager Fallback] Email Job (${data.type}) dispatched to ${data.email}`);
    }
    return `fallback-${Date.now()}`;
  }

  /**
   * Enqueue a notification job with offline fallback
   */
  public async addNotificationJob(data: NotificationJobData, customJobId?: string): Promise<string> {
    if (this.notificationQueue && isRedisReady()) {
      try {
        const job = await this.notificationQueue.add(data.type, data, {
          jobId: customJobId,
        });
        return job.id || `queued-${Date.now()}`;
      } catch (err) {
        console.warn('[QueueManager] Redis enqueue failed, falling back to direct handler:', err);
      }
    }

    // Direct fallback
    if (this.notificationFallbackHandler) {
      await this.notificationFallbackHandler(data);
    } else {
      console.log(`[QueueManager Fallback] Notification Job (${data.type}) dispatched`);
    }
    return `fallback-${Date.now()}`;
  }

  /**
   * Enqueue a background cleanup job
   */
  public async addCleanupJob(data: CleanupJobData, customJobId?: string): Promise<string> {
    if (this.cleanupQueue && isRedisReady()) {
      try {
        const job = await this.cleanupQueue.add(data.type, data, {
          jobId: customJobId,
        });
        return job.id || `queued-${Date.now()}`;
      } catch (err) {
        console.warn('[QueueManager] Redis enqueue failed, falling back to direct handler:', err);
      }
    }

    if (this.cleanupFallbackHandler) {
      await this.cleanupFallbackHandler(data);
    } else {
      console.log(`[QueueManager Fallback] Cleanup Job (${data.type}) executed`);
    }
    return `fallback-${Date.now()}`;
  }

  /**
   * Collect metrics across all initialized queues
   */
  public async getMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = [];
    const queues = [
      { name: QueueName.EMAIL, queue: this.emailQueue },
      { name: QueueName.NOTIFICATION, queue: this.notificationQueue },
      { name: QueueName.CLEANUP, queue: this.cleanupQueue },
    ];

    for (const item of queues) {
      if (item.queue && isRedisReady()) {
        try {
          const counts = await item.queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
          const isPaused = await item.queue.isPaused();
          metrics.push({
            name: item.name,
            waiting: counts.waiting || 0,
            active: counts.active || 0,
            completed: counts.completed || 0,
            failed: counts.failed || 0,
            delayed: counts.delayed || 0,
            paused: isPaused,
          });
        } catch {
          metrics.push({
            name: item.name,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: false,
          });
        }
      } else {
        metrics.push({
          name: item.name,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false,
        });
      }
    }

    return metrics;
  }

  /**
   * Close all queue connections cleanly
   */
  public async closeAll(): Promise<void> {
    if (this.emailQueue) await this.emailQueue.close();
    if (this.notificationQueue) await this.notificationQueue.close();
    if (this.cleanupQueue) await this.cleanupQueue.close();
    this.emailQueue = null;
    this.notificationQueue = null;
    this.cleanupQueue = null;
  }
}

export const queueManager = new QueueManager();
