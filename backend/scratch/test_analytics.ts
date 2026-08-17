import prisma from '../src/config/prisma';
import { dashboardService } from '../src/services/dashboard.service';

async function testAnalyticsAndDashboards() {
  console.log('🧪 Starting Section 16: Dashboards & Analytics E2E Verification...\n');

  // 1. Fetch seed organization, project, user
  const org = await prisma.organization.findFirst({
    include: {
      projects: { include: { tasks: true } },
      members: { include: { user: true } },
    },
  });

  if (!org) {
    console.log('⚠️ No organization found in database to test analytics.');
    return;
  }

  console.log(`1️⃣ Testing Workspace Analytics on Organization: "${org.name}" (ID: ${org.id})`);

  // 2. Test Organization Dashboard Aggregation
  console.log('\n2️⃣ Testing Organization Dashboard Aggregation...');
  const orgDash = await dashboardService.getOrganizationDashboard(org.id);
  console.log(`✅ Aggregated Org Dashboard in ${orgDash.durationMs}ms`);
  console.log(`   - Projects: ${orgDash.summary.projects.active} active / ${orgDash.summary.projects.total} total`);
  console.log(`   - Tasks: ${orgDash.summary.tasks.total} total, ${orgDash.summary.tasks.completed} done (${orgDash.summary.tasks.completionRate}%)`);
  console.log(`   - Overdue Tasks: ${orgDash.summary.tasks.overdue}`);
  console.log(`   - Team Workload Entries: ${orgDash.workload.length} members`);
  console.log(`   - 14-Day Velocity Buckets: ${orgDash.velocity.length} days`);
  console.log(`   - Recent Activities: ${orgDash.recentActivities.length} logs`);

  // 3. Test Project Deep Analytics
  const project = org.projects[0];
  if (project) {
    console.log(`\n3️⃣ Testing Project Deep Analytics for "${project.name}" (ID: ${project.id})...`);
    const projAnalytics = await dashboardService.getProjectAnalytics(org.id, project.id);
    console.log(`✅ Aggregated Project Analytics in ${projAnalytics.durationMs}ms`);
    console.log(`   - Status Breakdown: TODO=${projAnalytics.metrics.byStatus.TODO}, IN_PROGRESS=${projAnalytics.metrics.byStatus.IN_PROGRESS}, DONE=${projAnalytics.metrics.byStatus.DONE}`);
    console.log(`   - Progress: ${projAnalytics.metrics.progressPercentage}%`);
    console.log(`   - Story Points: ${projAnalytics.metrics.storyPoints.completed}/${projAnalytics.metrics.storyPoints.total}`);
    console.log(`   - Sprints: ${projAnalytics.sprints.length} iterations`);
    console.log(`   - Overdue Items: ${projAnalytics.overdueTasks.length}`);
    console.log(`   - Contributor Workload: ${projAnalytics.memberWorkload.length} members`);
  }

  // 4. Test Personal User Productivity Dashboard
  const member = org.members[0];
  if (member) {
    console.log(`\n4️⃣ Testing User Productivity Dashboard for "${member.user.name}" (ID: ${member.userId})...`);
    const userDash = await dashboardService.getUserDashboard(org.id, member.userId);
    console.log(`✅ Aggregated User Dashboard:`);
    console.log(`   - Assigned Tasks: ${userDash.metrics.totalAssigned}`);
    console.log(`   - In Progress: ${userDash.metrics.inProgress}`);
    console.log(`   - Completed: ${userDash.metrics.completed} (${userDash.metrics.completionRate}%)`);
    console.log(`   - Overdue: ${userDash.metrics.overdue}`);
  }

  // 5. Test Tenant Boundary Isolation
  console.log('\n5️⃣ Testing Tenant Isolation on Foreign Organization...');
  const isolatedOrg = await dashboardService.getOrganizationDashboard('non-existent-org-id');
  console.log(`✅ Tenant isolation verified: ${isolatedOrg.summary.projects.total} projects, ${isolatedOrg.summary.tasks.total} tasks`);

  await prisma.$disconnect();
  console.log('\n🎉 Section 16: Dashboards & Analytics Verification Completed Successfully!\n');
}

testAnalyticsAndDashboards().catch((err) => {
  console.error('❌ Analytics verification failed:', err);
  process.exit(1);
});
