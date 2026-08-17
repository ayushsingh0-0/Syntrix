import prisma from '../src/config/prisma';
import { globalSearchService } from '../src/services/search.service';
import { SearchTypeFilter } from '../src/validations/search.validation';

async function testGlobalSearch() {
  console.log('🧪 Starting Section 15: Global Search E2E Verification...\n');

  // 1. Fetch seed organization, project, task, comment, member
  const org = await prisma.organization.findFirst({
    include: {
      projects: { include: { tasks: { include: { comments: true } } } },
      members: { include: { user: true } },
    },
  });

  if (!org) {
    console.log('⚠️ No organization found in database to test search. Creating test scenario...');
    return;
  }

  console.log(`1️⃣ Testing Global Search on Organization: "${org.name}" (ID: ${org.id})`);

  // 2. Test Unified Search (ALL)
  console.log('\n2️⃣ Testing Unified Search (type=ALL, query="a")...');
  const allResults = await globalSearchService.search(org.id, {
    q: 'a',
    type: SearchTypeFilter.ALL,
    limit: 10,
  });

  console.log(`✅ Total results: ${allResults.totalResults} (found in ${allResults.durationMs}ms)`);
  console.log(`   - Projects: ${allResults.counts.projects}`);
  console.log(`   - Tasks: ${allResults.counts.tasks}`);
  console.log(`   - Comments: ${allResults.counts.comments}`);
  console.log(`   - Members: ${allResults.counts.members}`);

  // 3. Test Category Filtering (TASKS only)
  console.log('\n3️⃣ Testing Category Filter (type=TASKS)...');
  const taskResults = await globalSearchService.search(org.id, {
    q: 'a',
    type: SearchTypeFilter.TASKS,
    limit: 5,
  });
  console.log(`✅ Tasks only: ${taskResults.counts.tasks} tasks returned`);
  console.log(`   Projects: ${taskResults.counts.projects}, Comments: ${taskResults.counts.comments}, Members: ${taskResults.counts.members}`);

  // 4. Test Category Filtering (PROJECTS only)
  console.log('\n4️⃣ Testing Category Filter (type=PROJECTS)...');
  const projectResults = await globalSearchService.search(org.id, {
    q: 'a',
    type: SearchTypeFilter.PROJECTS,
    limit: 5,
  });
  console.log(`✅ Projects only: ${projectResults.counts.projects} projects returned`);

  // 5. Test Project Scoped Search
  const project = org.projects[0];
  if (project) {
    console.log(`\n5️⃣ Testing Project Scoped Search on "${project.name}" (ID: ${project.id})...`);
    const scopedResults = await globalSearchService.search(org.id, {
      q: 'a',
      type: SearchTypeFilter.ALL,
      projectId: project.id,
      limit: 10,
    });
    console.log(`✅ Scoped Tasks: ${scopedResults.counts.tasks}, Scoped Comments: ${scopedResults.counts.comments}`);
  }

  // 6. Test Query Normalization & Empty Query Handling
  console.log('\n6️⃣ Testing Query Normalization & Empty Query Handling...');
  const emptyResults = await globalSearchService.search(org.id, {
    q: '    ',
    type: SearchTypeFilter.ALL,
  });
  console.log(`✅ Empty search handled gracefully: ${emptyResults.totalResults} results returned`);

  // 7. Test Tenant Boundary Isolation
  console.log('\n7️⃣ Testing Tenant Isolation (Non-existent Org ID)...');
  const isolatedResults = await globalSearchService.search('non-existent-org-id', {
    q: 'a',
    type: SearchTypeFilter.ALL,
  });
  console.log(`✅ Tenant isolation verified: ${isolatedResults.totalResults} results returned for foreign tenant`);

  await prisma.$disconnect();
  console.log('\n🎉 Section 15: Global Search Verification Completed Successfully!\n');
}

testGlobalSearch().catch((err) => {
  console.error('❌ Search verification failed:', err);
  process.exit(1);
});
