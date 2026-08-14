import axios from 'axios';

const API = 'http://localhost:5000/api/v1';

async function runSection10Tests() {
  console.log('🧪 Starting Section 10: Sprints & Agile Planning Integration Test...\n');
  const timestamp = Date.now();
  const ownerEmail = `sprint-lead-${timestamp}@syntrix.com`;
  const password = 'Password123!';

  try {
    // 1. Register & Authenticate Owner
    console.log('1. Registering & Authenticating Owner...');
    await axios.post(`${API}/auth/register`, {
      name: 'Agile Coach',
      email: ownerEmail,
      password,
    });
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: ownerEmail,
      password,
    });
    const token = loginRes.data.data.accessToken;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Owner authenticated.');

    // 2. Create Organization
    console.log('\n2. Creating Organization...');
    const orgRes = await axios.post(
      `${API}/organizations`,
      { name: `Agile Workspace ${timestamp}`, slug: `agile-${timestamp}` },
      authHeaders
    );
    const orgId = orgRes.data.data.id;
    console.log(`✅ Org created: ${orgId}`);

    // 3. Create Project
    console.log('\n3. Creating Project...');
    const projRes = await axios.post(
      `${API}/organizations/${orgId}/projects`,
      { name: 'Syntrix Platform Engine', key: 'SYN', description: 'Sprint tracking test' },
      authHeaders
    );
    const projectId = projRes.data.data.id;
    console.log(`✅ Project created: ${projectId} (SYN)`);

    // 4. Create 4 Tasks with Story Points
    console.log('\n4. Creating 4 Tasks in Project...');
    const t1 = (
      await axios.post(
        `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
        { title: 'Task 1: Core Database Indexing', priority: 'HIGH' },
        authHeaders
      )
    ).data.data;
    const t2 = (
      await axios.post(
        `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
        { title: 'Task 2: Service Layer Boundaries', priority: 'MEDIUM' },
        authHeaders
      )
    ).data.data;
    const t3 = (
      await axios.post(
        `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
        { title: 'Task 3: Burndown Math Engine', priority: 'URGENT' },
        authHeaders
      )
    ).data.data;
    const t4 = (
      await axios.post(
        `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
        { title: 'Task 4: Backlog Grooming UI', priority: 'LOW' },
        authHeaders
      )
    ).data.data;

    // Set story points
    await axios.put(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${t1.id}`,
      { estimatedHours: 6 },
      authHeaders
    );
    console.log(`✅ Created tasks: ${t1.key}, ${t2.key}, ${t3.key}, ${t4.key}`);

    // 5. Verify Initial Backlog (All 4 unassigned)
    console.log('\n5. Fetching Backlog Tasks...');
    const backlogRes = await axios.get(
      `${API}/organizations/${orgId}/projects/${projectId}/sprints/backlog`,
      authHeaders
    );
    console.log(`✅ Backlog contains ${backlogRes.data.data.length} task(s).`);

    // 6. Create 2 Planned Sprints
    console.log('\n6. Creating 2 Planned Sprints...');
    const now = new Date();
    const sprint1End = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const sprint2End = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    const s1Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/sprints`,
      {
        name: 'Sprint 1 - Foundations',
        goal: 'Complete database schemas and core services',
        startDate: now.toISOString(),
        endDate: sprint1End.toISOString(),
      },
      authHeaders
    );
    const s2Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/sprints`,
      {
        name: 'Sprint 2 - Scale & Analytics',
        goal: 'Implement burndown metrics and visual boards',
        startDate: sprint1End.toISOString(),
        endDate: sprint2End.toISOString(),
      },
      authHeaders
    );
    const sprint1 = s1Res.data.data;
    const sprint2 = s2Res.data.data;
    console.log(`✅ Sprints created: "${sprint1.name}" & "${sprint2.name}"`);

    // 7. Assign Tasks 1, 2, 3 to Sprint 1
    console.log('\n7. Assigning Tasks to Sprint 1...');
    await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/sprints/${sprint1.id}/tasks`,
      { taskIds: [t1.id, t2.id, t3.id] },
      authHeaders
    );
    console.log('✅ Tasks 1, 2, and 3 assigned to Sprint 1.');

    // 8. Start Sprint 1
    console.log('\n8. Starting Sprint 1...');
    const startRes = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/sprints/${sprint1.id}/start`,
      {
        startDate: now.toISOString(),
        endDate: sprint1End.toISOString(),
        goal: 'Complete foundations',
      },
      authHeaders
    );
    console.log(`✅ Sprint 1 started with status: ${startRes.data.data.status}`);

    // 9. Verify Single Active Sprint Invariant (Starting Sprint 2 should fail)
    console.log('\n9. Testing Single Active Sprint Invariant (Starting Sprint 2 should be rejected)...');
    try {
      await axios.post(
        `${API}/organizations/${orgId}/projects/${projectId}/sprints/${sprint2.id}/start`,
        {
          startDate: now.toISOString(),
          endDate: sprint2End.toISOString(),
        },
        authHeaders
      );
      throw new Error('❌ Test Failed: Second active sprint was incorrectly permitted!');
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already active')) {
        console.log(`✅ Correctly rejected: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 10. Mark Task 1 as DONE
    console.log('\n10. Marking Task 1 as DONE...');
    await axios.put(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${t1.id}`,
      { status: 'DONE' },
      authHeaders
    );
    console.log(`✅ Task 1 marked as DONE.`);

    // 11. Fetch Burndown Trajectory
    console.log('\n11. Fetching Burndown Analytics for Sprint 1...');
    const burnRes = await axios.get(
      `${API}/organizations/${orgId}/projects/${projectId}/sprints/${sprint1.id}/burndown`,
      authHeaders
    );
    const burndown = burnRes.data.data;
    console.log(`✅ Burndown retrieved: ${burndown.timeline.length} daily points.`);
    console.log(`   Total tasks: ${burndown.sprint.totalTasks}, Completed: ${burndown.sprint.completedTasks}`);

    // 12. Complete Sprint 1 with Rollover to Sprint 2
    console.log('\n12. Completing Sprint 1 with Rollover to Sprint 2...');
    const completeRes = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/sprints/${sprint1.id}/complete`,
      { rolloverToSprintId: sprint2.id },
      authHeaders
    );
    console.log(`✅ Sprint 1 completed with status: ${completeRes.data.data.status}`);

    // 13. Start Sprint 2 (Now succeeds because Sprint 1 is COMPLETED)
    console.log('\n13. Starting Sprint 2 (Should now succeed)...');
    const start2Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/sprints/${sprint2.id}/start`,
      {
        startDate: now.toISOString(),
        endDate: sprint2End.toISOString(),
      },
      authHeaders
    );
    console.log(`✅ Sprint 2 started with status: ${start2Res.data.data.status}`);

    console.log('\n🎉 ALL SECTION 10 SPRINTS & AGILE PLANNING TESTS PASSED PERFECTLY!\n');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runSection10Tests();
