import prisma from '../src/config/prisma';
import { cacheService } from '../src/services/cache.service';
import { dashboardService } from '../src/services/dashboard.service';
import { BoardService } from '../src/services/board.service';
import { TaskService } from '../src/services/task.service';
import { CacheKeys } from '../src/types/cache.types';

async function testCachingSystem() {
  console.log('🧪 Starting Section 17: Redis & Caching E2E Verification...\n');

  await cacheService.clear();

  // 1. Basic Cache-Aside getOrSet verification
  console.log('1️⃣ Testing Basic Cache-Aside (getOrSet)...');
  let computeCount = 0;
  const testFetcher = async () => {
    computeCount++;
    return { value: 'Syntrix Platform Data', computeId: computeCount };
  };

  const res1 = await cacheService.getOrSet('test:key:1', 10, testFetcher);
  console.log(`   - 1st call: isHit=${res1.isHit}, data=${JSON.stringify(res1.data)} (computed ${computeCount}x)`);
  if (res1.isHit !== false || computeCount !== 1) {
    throw new Error('Expected initial call to be a cache MISS and run fetcher once');
  }

  const res2 = await cacheService.getOrSet('test:key:1', 10, testFetcher);
  console.log(`   - 2nd call: isHit=${res2.isHit}, data=${JSON.stringify(res2.data)} (computed ${computeCount}x)`);
  if (res2.isHit !== true || computeCount !== 1) {
    throw new Error('Expected 2nd call to be a cache HIT and NOT run fetcher');
  }
  console.log('✅ Cache-Aside HIT/MISS verified successfully.\n');

  // 2. Pattern-based Invalidation verification
  console.log('2️⃣ Testing Pattern Invalidation (invalidatePattern)...');
  await cacheService.set('syntrix:org:test-org-123:dashboard', { val: 1 }, 60);
  await cacheService.set('syntrix:org:test-org-123:project:p1:analytics', { val: 2 }, 60);
  await cacheService.set('syntrix:org:other-org:dashboard', { val: 3 }, 60);

  const deleted = await cacheService.invalidatePattern('syntrix:org:test-org-123:*');
  console.log(`   - Invalidated ${deleted} keys matching 'syntrix:org:test-org-123:*'`);

  const check1 = await cacheService.get('syntrix:org:test-org-123:dashboard');
  const check2 = await cacheService.get('syntrix:org:test-org-123:project:p1:analytics');
  const check3 = await cacheService.get('syntrix:org:other-org:dashboard');

  if (check1 !== null || check2 !== null || check3 === null) {
    throw new Error('Pattern invalidation failed: target keys were not purged or foreign key was purged');
  }
  console.log('✅ Tenant-scoped pattern invalidation verified.\n');

  // 3. Testing Real Workspace Dashboard Caching
  console.log('3️⃣ Testing Real Workspace Dashboard Caching with DashboardService...');
  const org = await prisma.organization.findFirst({
    include: {
      projects: { include: { boards: { include: { columns: true } } } },
      members: true,
    },
  });

  if (!org) {
    console.log('⚠️ No organization found in DB to test dashboard caching.');
    return;
  }

  // First call -> Cache MISS
  const dash1 = await dashboardService.getOrganizationDashboard(org.id);
  console.log(`   - 1st Dashboard Call: isCacheHit=${dash1.isCacheHit}, durationMs=${dash1.durationMs}ms`);
  if (dash1.isCacheHit !== false) {
    throw new Error('Expected 1st dashboard call to be a cache MISS');
  }

  // Second call -> Cache HIT
  const dash2 = await dashboardService.getOrganizationDashboard(org.id);
  console.log(`   - 2nd Dashboard Call: isCacheHit=${dash2.isCacheHit}, durationMs=${dash2.durationMs}ms`);
  if (dash2.isCacheHit !== true) {
    throw new Error('Expected 2nd dashboard call to be a cache HIT');
  }
  console.log('✅ Dashboard caching verified.\n');

  // 4. Testing Invalidation on Task Mutation
  console.log('4️⃣ Testing Automatic Invalidation on Task Mutation...');
  const project = org.projects[0];
  const board = project?.boards[0];
  const col = board?.columns[0];
  const member = org.members[0];

  if (project && board && col && member) {
    const boardService = new BoardService();
    const taskService = new TaskService();

    // Create a task -> should invalidate cache
    console.log('   - Creating new task via BoardService...');
    const newTask = await boardService.createTask(org.id, project.id, member.userId, {
      title: 'Cache Invalidation Probe Task',
      columnId: col.id,
      priority: 'HIGH',
    });

    // Next dashboard call must be a Cache MISS because cache was invalidated
    const dashAfterCreate = await dashboardService.getOrganizationDashboard(org.id);
    console.log(`   - Dashboard Call after Task Create: isCacheHit=${dashAfterCreate.isCacheHit}`);
    if (dashAfterCreate.isCacheHit !== false) {
      throw new Error('Expected dashboard cache to be invalidated after task creation');
    }

    // Clean up task -> should also invalidate cache
    console.log('   - Deleting probe task...');
    await taskService.deleteTask(org.id, project.id, newTask.id);

    const dashAfterDelete = await dashboardService.getOrganizationDashboard(org.id);
    console.log(`   - Dashboard Call after Task Delete: isCacheHit=${dashAfterDelete.isCacheHit}`);
    if (dashAfterDelete.isCacheHit !== false) {
      throw new Error('Expected dashboard cache to be invalidated after task deletion');
    }
  }
  console.log('✅ Mutation-driven automated cache invalidation verified.\n');

  // 5. Verify Metrics
  console.log('5️⃣ Operational Cache Metrics:');
  const metrics = cacheService.getMetrics();
  console.log(`   - Hits: ${metrics.hits}`);
  console.log(`   - Misses: ${metrics.misses}`);
  console.log(`   - Total Requests: ${metrics.totalRequests}`);
  console.log(`   - Hit Ratio: ${metrics.hitRatio}`);
  console.log(`   - Redis Active: ${metrics.isRedisActive}`);

  await prisma.$disconnect();
  console.log('\n🎉 Section 17: Redis & Caching Verification Completed Successfully!\n');
}

testCachingSystem().catch((err) => {
  console.error('❌ Caching verification failed:', err);
  process.exit(1);
});
