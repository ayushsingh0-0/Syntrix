import axios from 'axios';

const API = 'http://localhost:5000/api/v1';

async function runSection9Tests() {
  console.log('🧪 Starting Section 9: Advanced Tasks, Labels & Dependencies Integration Test...\n');
  const timestamp = Date.now();
  const ownerEmail = `task-owner-${timestamp}@syntrix.com`;
  const password = 'Password123!';

  try {
    // 1. Register & Authenticate Owner
    console.log('1. Registering & Authenticating Owner...');
    await axios.post(`${API}/auth/register`, {
      name: 'Task Master',
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
      { name: `Syntrix Task Org ${timestamp}`, slug: `task-org-${timestamp}` },
      authHeaders
    );
    const orgId = orgRes.data.data.id;
    console.log(`✅ Org created: ${orgId}`);

    // 3. Create Project
    console.log('\n3. Creating Project...');
    const projRes = await axios.post(
      `${API}/organizations/${orgId}/projects`,
      { name: 'Core Engine', key: 'ENG', description: 'Core engine tasks' },
      authHeaders
    );
    const projectId = projRes.data.data.id;
    console.log(`✅ Project created: ${projectId} (ENG)`);

    // 4. Create Organization Labels
    console.log('\n4. Creating Organization Labels...');
    const bugLabelRes = await axios.post(
      `${API}/organizations/${orgId}/labels`,
      { name: 'Bug', color: '#ef4444', description: 'High priority defect' },
      authHeaders
    );
    const featureLabelRes = await axios.post(
      `${API}/organizations/${orgId}/labels`,
      { name: 'Feature', color: '#3b82f6', description: 'New capability' },
      authHeaders
    );
    const bugLabel = bugLabelRes.data.data;
    const featureLabel = featureLabelRes.data.data;
    console.log(`✅ Labels created: "${bugLabel.name}" (${bugLabel.color}) & "${featureLabel.name}" (${featureLabel.color})`);

    // 5. Create 3 Tasks
    console.log('\n5. Creating 3 Tasks in Project...');
    const t1Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
      { title: 'Task A: Database Migrations', priority: 'HIGH' },
      authHeaders
    );
    const t2Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
      { title: 'Task B: Service Layer Implementation', priority: 'MEDIUM' },
      authHeaders
    );
    const t3Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
      { title: 'Task C: REST Endpoint Exposure', priority: 'LOW' },
      authHeaders
    );
    const taskA = t1Res.data.data;
    const taskB = t2Res.data.data;
    const taskC = t3Res.data.data;
    console.log(`✅ Tasks created: ${taskA.key}, ${taskB.key}, ${taskC.key}`);

    // 6. Update Task A with Labels, Due Date, and Estimated Hours
    console.log('\n6. Updating Task A with Labels & Metadata...');
    const updateRes = await axios.put(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskA.id}`,
      {
        description: 'Implement MariaDB table migrations with Prisma schema',
        estimatedHours: 8,
        labelIds: [bugLabel.id, featureLabel.id],
      },
      authHeaders
    );
    console.log(`✅ Task A updated with ${updateRes.data.data.labels.length} labels.`);

    // 7. Paginated Task Query with Filters
    console.log('\n7. Testing Paginated Task Queries...');
    const listRes = await axios.get(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks?labelId=${bugLabel.id}&limit=10`,
      authHeaders
    );
    console.log(`✅ Found ${listRes.data.data.length} task(s) matching label filter. Total in project: ${listRes.data.meta.total}`);

    // 8. Watcher Subscription Toggle
    console.log('\n8. Testing Task Watcher Toggle...');
    const watch1 = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskA.id}/watch`,
      {},
      authHeaders
    );
    console.log(`✅ Subscribed to watcher: isWatching = ${watch1.data.data.isWatching}`);

    // 9. Task Dependencies Linking (Task A BLOCKS Task B -> Task B depends on Task A)
    console.log('\n9. Linking Task Dependencies...');
    const dep1Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskB.id}/dependencies`,
      { dependsOnTaskId: taskA.id, type: 'BLOCKS' },
      authHeaders
    );
    console.log(`✅ Linked: ${taskB.key} depends on ${taskA.key}`);

    // Task B BLOCKS Task C -> Task C depends on Task B
    const dep2Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskC.id}/dependencies`,
      { dependsOnTaskId: taskB.id, type: 'BLOCKS' },
      authHeaders
    );
    console.log(`✅ Linked: ${taskC.key} depends on ${taskB.key}`);

    // 10. Testing DAG Cycle Prevention (Task A trying to depend on Task C)
    console.log('\n10. Testing DAG Cycle Prevention (Should reject Task A depending on Task C)...');
    try {
      await axios.post(
        `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskA.id}/dependencies`,
        { dependsOnTaskId: taskC.id, type: 'BLOCKS' },
        authHeaders
      );
      throw new Error('❌ Test Failed: Circular dependency was incorrectly allowed!');
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('Circular dependency')) {
        console.log(`✅ Correctly rejected circular dependency: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 11. Remove Dependency & Delete Task C
    console.log('\n11. Removing Dependency & Deleting Task C...');
    await axios.delete(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskC.id}/dependencies/${dep2Res.data.data.id}`,
      authHeaders
    );
    await axios.delete(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskC.id}`,
      authHeaders
    );
    console.log('✅ Dependency removed and Task C deleted cleanly.');

    console.log('\n🎉 ALL SECTION 9 ADVANCED TASK TESTS PASSED PERFECTLY!\n');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runSection9Tests();
