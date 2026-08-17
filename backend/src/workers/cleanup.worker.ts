import { Job, Worker } from 'bullmq';
import { getRedisClient, isRedisReady } from '../config/redis.config';
import { QueueName, CleanupJobData, CleanupJobType } from '../types/queue.types';
import prisma from '../config/prisma';
import fs from 'fs/promises';
import path from 'path';

/**
 * Core business processor for Cleanup Jobs
 */
export const processCleanupJob = async (data: CleanupJobData): Promise<void> => {
  const now = new Date();

  switch (data.type) {
    case CleanupJobType.PURGE_EXPIRED_TOKENS: {
      console.log(`[Cleanup Worker] Starting expired tokens purge at ${now.toISOString()}...`);

      // 1. Delete expired email verification tokens
      const emailResult = await prisma.emailVerificationToken.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      // 2. Delete expired password reset tokens
      const passwordResult = await prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      // 3. Delete revoked refresh tokens older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const refreshResult = await prisma.refreshToken.deleteMany({
        where: {
          isRevoked: true,
          createdAt: { lt: thirtyDaysAgo },
        },
      });

      // 4. Mark expired pending invitations as EXPIRED
      const inviteResult = await prisma.invitation.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: now },
        },
        data: { status: 'EXPIRED' },
      });

      console.log(
        `[Cleanup Worker] Purged ${emailResult.count} email tokens, ${passwordResult.count} reset tokens, ` +
          `${refreshResult.count} old revoked sessions, expired ${inviteResult.count} pending invitations.`
      );
      break;
    }

    case CleanupJobType.PURGE_ORPHANED_ATTACHMENTS: {
      console.log(`[Cleanup Worker] Starting orphaned attachments check...`);
      const uploadsDir = path.resolve(process.cwd(), 'uploads');

      try {
        await fs.access(uploadsDir);
        const filesOnDisk = await fs.readdir(uploadsDir);
        if (filesOnDisk.length === 0) return;

        // Query active attachment paths
        const activeAttachments = await prisma.attachment.findMany({
          select: { path: true },
        });
        const activeFileNames = new Set(
          activeAttachments.map((a: { path: string }) => path.basename(a.path))
        );

        let deletedCount = 0;
        for (const file of filesOnDisk) {
          if (!activeFileNames.has(file)) {
            if (!data.dryRun) {
              await fs.unlink(path.join(uploadsDir, file)).catch(() => {});
            }
            deletedCount++;
          }
        }

        console.log(
          `[Cleanup Worker] Orphaned attachment check completed. Deleted/Flagged: ${deletedCount} files.`
        );
      } catch (err: unknown) {
        console.warn(`[Cleanup Worker] Uploads directory inspection notice:`, err);
      }
      break;
    }

    default:
      console.warn('[Cleanup Worker] Unknown cleanup job data:', data);
  }
};

/**
 * Creates and registers the BullMQ Cleanup Worker
 */
export const createCleanupWorker = (): Worker<CleanupJobData> | null => {
  const redis = getRedisClient();
  if (!redis || !isRedisReady()) {
    return null;
  }

  const worker = new Worker<CleanupJobData>(
    QueueName.CLEANUP,
    async (job: Job<CleanupJobData>) => {
      console.log(`[Cleanup Worker] Processing Job ID: ${job.id} (${job.data.type})`);
      await processCleanupJob(job.data);
    },
    {
      connection: redis,
      concurrency: 1, // Run cleanups sequentially
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Cleanup Worker] Completed Job ID: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Cleanup Worker] Failed Job ID: ${job?.id}:`, err.message);
  });

  return worker;
};
