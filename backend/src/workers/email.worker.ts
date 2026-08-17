import { Job, Worker } from 'bullmq';
import { getRedisClient, isRedisReady } from '../config/redis.config';
import { QueueName, EmailJobData, EmailJobType } from '../types/queue.types';

/**
 * Core business processor for Email Jobs
 * Used both by BullMQ Worker and the offline direct fallback
 */
export const processEmailJob = async (data: EmailJobData): Promise<void> => {
  switch (data.type) {
    case EmailJobType.VERIFY_EMAIL: {
      const verifyUrl = `http://localhost:5173/verify-email?token=${data.token}`;
      console.log(`\n=============================================================`);
      console.log(`✉️  [EMAIL WORKER] To: ${data.email} (${data.name})`);
      console.log(`📌  Subject: Verify your Syntrix Account`);
      console.log(`🔗  Verification Link: ${verifyUrl}`);
      console.log(`⏰  Expires At: ${data.expiresAt}`);
      console.log(`=============================================================\n`);
      break;
    }

    case EmailJobType.RESET_PASSWORD: {
      const resetUrl = `http://localhost:5173/reset-password?token=${data.token}`;
      console.log(`\n=============================================================`);
      console.log(`✉️  [EMAIL WORKER] To: ${data.email} (${data.name})`);
      console.log(`📌  Subject: Reset your Syntrix Password`);
      console.log(`🔗  Reset Link: ${resetUrl}`);
      console.log(`⏰  Expires At: ${data.expiresAt}`);
      console.log(`=============================================================\n`);
      break;
    }

    case EmailJobType.INVITATION_EMAIL: {
      const inviteUrl = `http://localhost:5173/invite/${data.token}`;
      console.log(`\n=============================================================`);
      console.log(`✉️  [EMAIL WORKER] To: ${data.email}`);
      console.log(`📌  Subject: ${data.inviterName} invited you to join ${data.orgName} on Syntrix`);
      console.log(`🔗  Accept Invitation: ${inviteUrl}`);
      console.log(`=============================================================\n`);
      break;
    }

    case EmailJobType.TASK_NOTIFICATION_EMAIL: {
      console.log(`\n=============================================================`);
      console.log(`✉️  [EMAIL WORKER] To: ${data.email}`);
      console.log(`📌  Subject: [${data.taskKey}] ${data.title}`);
      console.log(`📝  Message: ${data.message}`);
      if (data.actionUrl) console.log(`🔗  View Task: ${data.actionUrl}`);
      console.log(`=============================================================\n`);
      break;
    }

    default:
      console.warn('[EMAIL WORKER] Unrecognized email job data:', data);
  }
};

/**
 * Creates and registers the BullMQ Email Worker
 */
export const createEmailWorker = (): Worker<EmailJobData> | null => {
  const redis = getRedisClient();
  if (!redis || !isRedisReady()) {
    return null;
  }

  const worker = new Worker<EmailJobData>(
    QueueName.EMAIL,
    async (job: Job<EmailJobData>) => {
      console.log(`[Email Worker] Processing Job ID: ${job.id} (${job.data.type})`);
      await processEmailJob(job.data);
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Email Worker] Completed Job ID: ${job.id} for ${job.data.email}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Email Worker] Failed Job ID: ${job?.id}:`, err.message);
  });

  return worker;
};
