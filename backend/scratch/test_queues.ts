import { workerManager } from '../src/workers/worker.manager';
import { queueManager } from '../src/queues/queue.manager';
import {
  EmailJobType,
  NotificationJobType,
  CleanupJobType,
} from '../src/types/queue.types';
import { getHealthStatus } from '../src/services/health.service';
import { closeRedisConnection } from '../src/config/redis.config';
import prisma from '../src/config/prisma';

async function testQueuesAndWorkers() {
  console.log('🧪 Starting Section 14: Background Jobs & Queues E2E Verification...\n');

  // 1. Initialize Worker & Queue System
  console.log('1️⃣ Initializing Worker Manager & Queues...');
  workerManager.initialize();

  // 2. Dispatch Email Jobs
  console.log('\n2️⃣ Testing Email Queue Dispatches...');
  const verifyJobId = await queueManager.addEmailJob({
    type: EmailJobType.VERIFY_EMAIL,
    email: 'alex.developer@example.com',
    name: 'Alex Developer',
    token: 'opaque-verification-token-12345',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  console.log(`✅ Dispatched VERIFY_EMAIL job (ID: ${verifyJobId})`);

  const resetJobId = await queueManager.addEmailJob({
    type: EmailJobType.RESET_PASSWORD,
    email: 'sarah.engineer@example.com',
    name: 'Sarah Engineer',
    token: 'opaque-reset-token-67890',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  console.log(`✅ Dispatched RESET_PASSWORD job (ID: ${resetJobId})`);

  const inviteJobId = await queueManager.addEmailJob({
    type: EmailJobType.INVITATION_EMAIL,
    email: 'new.member@example.com',
    inviterName: 'Lead Architect',
    orgName: 'Acme Corp',
    token: 'opaque-invite-token-99999',
  });
  console.log(`✅ Dispatched INVITATION_EMAIL job (ID: ${inviteJobId})`);

  // 3. Dispatch Notification Jobs
  console.log('\n3️⃣ Testing Notification Queue Dispatches...');
  // Find or create test entities if available
  const user = await prisma.user.findFirst();
  const org = await prisma.organization.findFirst();
  const project = await prisma.project.findFirst();

  if (user && org && project) {
    const notifJobId = await queueManager.addNotificationJob({
      type: NotificationJobType.TASK_ASSIGNED,
      assigneeId: user.id,
      actorId: user.id, // For test verification
      orgId: org.id,
      projectId: project.id,
      taskId: 'test-task-id',
      taskKey: 'TEST-101',
      taskTitle: 'Implement BullMQ Architecture',
    });
    console.log(`✅ Dispatched TASK_ASSIGNED notification job (ID: ${notifJobId})`);
  } else {
    console.log('ℹ️ Skipping DB notification insert test (no seed user/org found in DB)');
  }

  // 4. Dispatch Cleanup Job
  console.log('\n4️⃣ Testing Background Cleanup Queue...');
  const cleanupJobId = await queueManager.addCleanupJob({
    type: CleanupJobType.PURGE_EXPIRED_TOKENS,
  });
  console.log(`✅ Dispatched PURGE_EXPIRED_TOKENS cleanup job (ID: ${cleanupJobId})`);

  // 5. Test Health & Queue Metrics
  console.log('\n5️⃣ Testing Health Endpoint Metrics...');
  const health = await getHealthStatus();
  console.log('Health Output:', JSON.stringify(health, null, 2));

  // 6. Test Graceful Shutdown
  console.log('\n6️⃣ Testing Graceful Worker Shutdown...');
  await workerManager.shutdown();
  await closeRedisConnection();
  await prisma.$disconnect();
  console.log('✅ Worker Manager, Redis, and Prisma disconnected cleanly.');

  console.log('\n🎉 Section 14: Background Jobs & Queues Verification Completed Successfully!\n');
  process.exit(0);
}

testQueuesAndWorkers().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
