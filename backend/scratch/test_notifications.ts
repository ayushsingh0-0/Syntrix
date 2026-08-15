import axios from 'axios';

const API = 'http://localhost:5000/api/v1';

async function runSection13Tests() {
  console.log('🧪 Starting Section 13: Notifications Integration Test...\n');
  const timestamp = Date.now();
  const aliceEmail = `alice-notif-${timestamp}@syntrix.com`;
  const bobEmail = `bob-notif-${timestamp}@syntrix.com`;
  const password = 'Password123!';

  try {
    // 1. Register Alice & Bob
    console.log('1. Registering Alice & Bob...');
    await axios.post(`${API}/auth/register`, {
      name: 'Alice Smith',
      email: aliceEmail,
      password,
    });
    const aliceLogin = await axios.post(`${API}/auth/login`, {
      email: aliceEmail,
      password,
    });
    const aliceToken = aliceLogin.data.data.accessToken;
    const aliceHeaders = { headers: { Authorization: `Bearer ${aliceToken}` } };

    await axios.post(`${API}/auth/register`, {
      name: 'Bob Jones',
      email: bobEmail,
      password,
    });
    const bobLogin = await axios.post(`${API}/auth/login`, {
      email: bobEmail,
      password,
    });
    const bobToken = bobLogin.data.data.accessToken;
    const bobUser = bobLogin.data.data.user;
    const bobHeaders = { headers: { Authorization: `Bearer ${bobToken}` } };
    console.log('✅ Alice and Bob registered & authenticated.');

    // 2. Create Org & Invite Bob
    console.log('\n2. Creating Organization & Adding Bob...');
    const orgRes = await axios.post(
      `${API}/organizations`,
      { name: `Notif Org ${timestamp}`, slug: `notif-org-${timestamp}` },
      aliceHeaders
    );
    const orgId = orgRes.data.data.id;

    const inviteRes = await axios.post(
      `${API}/organizations/${orgId}/invitations`,
      { email: bobEmail, role: 'MEMBER' },
      aliceHeaders
    );
    const inviteToken = inviteRes.data.debugToken || inviteRes.data.data?.token;
    await axios.post(`${API}/invitations/accept`, { token: inviteToken }, bobHeaders);
    console.log('✅ Bob joined organization.');

    // 3. Create Project & Task
    console.log('\n3. Creating Project & Task...');
    const projRes = await axios.post(
      `${API}/organizations/${orgId}/projects`,
      { name: 'Notification Engine', key: 'NOTIF' },
      aliceHeaders
    );
    const projectId = projRes.data.data.id;

    const taskRes = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
      { title: 'Test Task with Notifications', priority: 'HIGH' },
      aliceHeaders
    );
    const taskId = taskRes.data.data.id;
    console.log(`✅ Created task ${taskId} (NOTIF-1)`);

    // 4. Alice assigns task to Bob
    console.log('\n4. Alice assigning task to Bob...');
    await axios.put(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
      {
        title: 'Test Task with Notifications',
        assigneeId: bobUser.id,
      },
      aliceHeaders
    );
    console.log('✅ Task assigned to Bob.');

    // 5. Alice mentions Bob in comment
    console.log('\n5. Alice mentioning Bob in comment...');
    await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments`,
      {
        content: `Hey @${bobEmail}, please verify the alert triggers.`,
      },
      aliceHeaders
    );
    console.log('✅ Comment posted with mention.');

    // 6. Alice changes task status
    console.log('\n6. Alice changing task status to IN_PROGRESS...');
    await axios.put(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
      {
        title: 'Test Task with Notifications',
        status: 'IN_PROGRESS',
      },
      aliceHeaders
    );
    console.log('✅ Task status updated.');

    // 7. Verify Bob's unread notification count
    console.log('\n7. Checking Bob’s unread notification count...');
    const countRes = await axios.get(`${API}/notifications/unread-count`, bobHeaders);
    const unreadCount = countRes.data.data.unreadCount;
    console.log(`✅ Bob unread count: ${unreadCount}`);
    if (unreadCount < 3) {
      throw new Error(`Expected at least 3 notifications, received ${unreadCount}`);
    }

    // 8. Fetch Bob's notifications list
    console.log('\n8. Fetching Bob’s notifications list...');
    const listRes = await axios.get(`${API}/notifications`, bobHeaders);
    const notifications = listRes.data.data.notifications;
    console.log(`✅ Retrieved ${notifications.length} notification(s):`);
    notifications.forEach((n: any) => {
      console.log(`   • [${n.type}] ${n.title} — "${n.message}" (isRead: ${n.isRead})`);
    });

    // 9. Bob marks first notification as read
    console.log('\n9. Bob marking first notification as read...');
    const firstNotifId = notifications[0].id;
    await axios.patch(`${API}/notifications/${firstNotifId}/read`, {}, bobHeaders);
    const countRes2 = await axios.get(`${API}/notifications/unread-count`, bobHeaders);
    console.log(`✅ Unread count after 1 read: ${countRes2.data.data.unreadCount}`);

    // 10. Bob marks all notifications as read
    console.log('\n10. Bob marking all notifications as read...');
    await axios.post(`${API}/notifications/read-all`, {}, bobHeaders);
    const countRes3 = await axios.get(`${API}/notifications/unread-count`, bobHeaders);
    console.log(`✅ Unread count after mark-all-read: ${countRes3.data.data.unreadCount}`);
    if (countRes3.data.data.unreadCount !== 0) {
      throw new Error('Unread count is not 0 after mark-all-read');
    }

    console.log('\n🎉 ALL SECTION 13 NOTIFICATIONS TESTS PASSED PERFECTLY!\n');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runSection13Tests();
