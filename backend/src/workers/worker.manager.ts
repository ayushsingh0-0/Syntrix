import { Worker } from 'bullmq';
import { createEmailWorker, processEmailJob } from './email.worker';
import { createNotificationWorker, processNotificationJob } from './notification.worker';
import { createCleanupWorker, processCleanupJob } from './cleanup.worker';
import { queueManager } from '../queues/queue.manager';

class WorkerManager {
  private emailWorker: Worker | null = null;
  private notificationWorker: Worker | null = null;
  private cleanupWorker: Worker | null = null;

  /**
   * Initialize all worker processes and fallback processors
   */
  public initialize() {
    // 1. Always register direct execution fallbacks first
    queueManager.registerFallbackProcessors(
      processEmailJob,
      processNotificationJob,
      processCleanupJob
    );

    // 2. Initialize queues
    queueManager.initializeQueues();

    // 3. Initialize BullMQ workers if Redis is available
    this.emailWorker = createEmailWorker();
    this.notificationWorker = createNotificationWorker();
    this.cleanupWorker = createCleanupWorker();

    if (this.emailWorker || this.notificationWorker || this.cleanupWorker) {
      console.log('[WorkerManager] BullMQ background workers initialized');
    } else {
      console.log('[WorkerManager] Operating with in-process background job handlers');
    }
  }

  /**
   * Graceful shutdown of all active workers
   */
  public async shutdown(): Promise<void> {
    console.log('[WorkerManager] Shutting down workers gracefully...');
    const closing: Promise<void>[] = [];

    if (this.emailWorker) closing.push(this.emailWorker.close());
    if (this.notificationWorker) closing.push(this.notificationWorker.close());
    if (this.cleanupWorker) closing.push(this.cleanupWorker.close());

    await Promise.all(closing);
    await queueManager.closeAll();

    this.emailWorker = null;
    this.notificationWorker = null;
    this.cleanupWorker = null;
    console.log('[WorkerManager] All workers and queues closed successfully');
  }
}

export const workerManager = new WorkerManager();
