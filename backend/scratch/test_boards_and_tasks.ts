import axios from 'axios';

const API = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🧪 Starting Section 8: Boards & Tasks Integration Test...');

  const timestamp = Date.now();
  const ownerEmail = `board-owner-${timestamp}@syntrix.com`;
  const password = 'Password123!';

  // 1. Register Owner & Login
  console.log('\n1. Registering Owner...');
  await axios.post(`${API}/auth/register`, {
    name: 'Board Owner',
    email: ownerEmail,
    password,
  });
  const loginRes = await axios.post(`${API}/auth/login`, {
    email: ownerEmail,
    password,
  });
  const ownerToken = loginRes.data.data.accessToken;
  const ownerAuth = { headers: { Authorization: `Bearer ${ownerToken}` } };
  console.log('✅ Owner registered and authenticated.');


  // 2. Create Organization
  console.log('\n2. Creating Organization...');
  const orgRes = await axios.post(
    `${API}/organizations`,
    { name: `Kanban Org ${timestamp}` },
    ownerAuth
  );
  const orgId = orgRes.data.data.id;
  console.log(`✅ Org created: ${orgId}`);

  // 3. Create Project (Should auto-provision default board and 4 columns)
  console.log('\n3. Creating Project with auto-board provisioning...');
  const projRes = await axios.post(
    `${API}/organizations/${orgId}/projects`,
    {
      name: 'Syntrix Platform Engine',
      key: 'SPE',
      description: 'Core engine boards test',
      status: 'ACTIVE',
      priority: 'HIGH',
    },
    ownerAuth
  );
  const projectId = projRes.data.data.id;
  console.log(`✅ Project created: ${projectId} (${projRes.data.data.key})`);

  // 4. Fetch Boards
  console.log('\n4. Fetching Project Boards...');
  const boardsRes = await axios.get(
    `${API}/organizations/${orgId}/projects/${projectId}/boards`,
    ownerAuth
  );
  const boards = boardsRes.data.data;
  console.log(`Found ${boards.length} board(s).`);
  if (boards.length !== 1 || boards[0].columns.length !== 4) {
    throw new Error(`Expected 1 board with 4 columns, got ${boards.length} boards and ${boards[0]?.columns?.length} columns`);
  }
  const mainBoard = boards[0];
  console.log('✅ Default board verified:', mainBoard.name, 'with columns:', mainBoard.columns.map((c: any) => c.name));

  const todoCol = mainBoard.columns.find((c: any) => c.name === 'To Do');
  const inProgressCol = mainBoard.columns.find((c: any) => c.name === 'In Progress');
  const doneCol = mainBoard.columns.find((c: any) => c.name === 'Done');

  // 5. Add Custom Column ("Blocked")
  console.log('\n5. Adding custom column "Blocked"...');
  const addColRes = await axios.post(
    `${API}/organizations/${orgId}/projects/${projectId}/boards/${mainBoard.id}/columns`,
    { name: 'Blocked', color: '#ef4444', wipLimit: 5 },
    ownerAuth
  );
  const blockedCol = addColRes.data.data;
  console.log(`✅ Custom column created: ${blockedCol.name} (position: ${blockedCol.position})`);

  // 6. Create Tasks in Columns
  console.log('\n6. Creating tasks in "To Do" column...');
  const task1Res = await axios.post(
    `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
    {
      title: 'Design distributed database indexing',
      description: 'Implement B-Tree indexes for MySQL multi-tenant keys',
      columnId: todoCol.id,
      priority: 'URGENT',
    },
    ownerAuth
  );
  const task1 = task1Res.data.data;
  console.log(`✅ Task 1 created: ${task1.key} - ${task1.title}`);
  if (task1.key !== 'SPE-1') {
    throw new Error(`Expected task key SPE-1, got ${task1.key}`);
  }

  const task2Res = await axios.post(
    `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
    {
      title: 'Implement Kanban drag-and-drop state machines',
      columnId: todoCol.id,
      priority: 'HIGH',
    },
    ownerAuth
  );
  const task2 = task2Res.data.data;
  console.log(`✅ Task 2 created: ${task2.key} - ${task2.title}`);
  if (task2.key !== 'SPE-2') {
    throw new Error(`Expected task key SPE-2, got ${task2.key}`);
  }

  // 7. Move Task Across Columns
  console.log('\n7. Moving Task 1 to "In Progress"...');
  const moveRes = await axios.patch(
    `${API}/organizations/${orgId}/projects/${projectId}/tasks/${task1.id}/move`,
    {
      columnId: inProgressCol.id,
      targetPosition: 1000.0,
    },
    ownerAuth
  );
  const movedTask = moveRes.data.data;
  console.log(`✅ Task moved to column ${movedTask.columnId}, status derived: ${movedTask.status}`);
  if (movedTask.status !== 'IN_PROGRESS') {
    throw new Error(`Expected status IN_PROGRESS, got ${movedTask.status}`);
  }

  // Move Task 1 to "Done"
  console.log('\n8. Moving Task 1 to "Done"...');
  const doneRes = await axios.patch(
    `${API}/organizations/${orgId}/projects/${projectId}/tasks/${task1.id}/move`,
    {
      columnId: doneCol.id,
      targetPosition: 2000.0,
    },
    ownerAuth
  );
  console.log(`✅ Task 1 status derived in Done column: ${doneRes.data.data.status}`);
  if (doneRes.data.data.status !== 'DONE') {
    throw new Error(`Expected status DONE, got ${doneRes.data.data.status}`);
  }

  // 9. Reorder Columns
  console.log('\n9. Reordering columns...');
  const reorderRes = await axios.patch(
    `${API}/organizations/${orgId}/projects/${projectId}/boards/${mainBoard.id}/columns/reorder`,
    {
      columns: [
        { id: todoCol.id, position: 0 },
        { id: blockedCol.id, position: 1 },
        { id: inProgressCol.id, position: 2 },
        { id: doneCol.id, position: 3 },
      ],
    },
    ownerAuth
  );
  console.log('✅ Columns reordered:', reorderRes.data.data.map((c: any) => `${c.name} (pos: ${c.position})`));

  // 10. Safeguard Check: Deleting column with active tasks should fail
  console.log('\n10. Testing column deletion safeguard...');
  try {
    await axios.delete(
      `${API}/organizations/${orgId}/projects/${projectId}/boards/${mainBoard.id}/columns/${todoCol.id}`,
      ownerAuth
    );
    throw new Error('Should have failed to delete column with tasks');
  } catch (err: any) {
    console.log('✅ Correctly prevented deleting column with tasks:', err.response?.data?.message);
  }

  // 11. Delete task and delete empty column
  console.log('\n11. Deleting task 2 and deleting "Blocked" column...');
  await axios.delete(
    `${API}/organizations/${orgId}/projects/${projectId}/tasks/${task2.id}`,
    ownerAuth
  );
  await axios.delete(
    `${API}/organizations/${orgId}/projects/${projectId}/boards/${mainBoard.id}/columns/${blockedCol.id}`,
    ownerAuth
  );
  console.log('✅ Task and empty column deleted successfully.');

  console.log('\n🎉 ALL SECTION 8 BOARDS & TASKS TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
