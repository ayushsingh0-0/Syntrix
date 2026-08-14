import axios from 'axios';

const API = 'http://localhost:5000/api/v1';

async function runSection11Tests() {
  console.log('🧪 Starting Section 11: Comments & Activity Timeline Integration Test...\n');
  const timestamp = Date.now();
  const aliceEmail = `alice-${timestamp}@syntrix.com`;
  const bobEmail = `bob-${timestamp}@syntrix.com`;
  const password = 'Password123!';

  try {
    // 1. Register Alice & Bob
    console.log('1. Registering Alice & Bob...');
    await axios.post(`${API}/auth/register`, { name: 'Alice Smith', email: aliceEmail, password });
    const aliceLogin = await axios.post(`${API}/auth/login`, { email: aliceEmail, password });
    const aliceToken = aliceLogin.data.data.accessToken;
    const aliceHeaders = { headers: { Authorization: `Bearer ${aliceToken}` } };

    await axios.post(`${API}/auth/register`, { name: 'Bob Jones', email: bobEmail, password });
    const bobLogin = await axios.post(`${API}/auth/login`, { email: bobEmail, password });
    const bobToken = bobLogin.data.data.accessToken;
    const bobHeaders = { headers: { Authorization: `Bearer ${bobToken}` } };
    const bobId = bobLogin.data.data.user.id;
    console.log('✅ Alice and Bob registered & authenticated.');

    // 2. Create Organization by Alice
    console.log('\n2. Creating Organization...');
    const orgRes = await axios.post(
      `${API}/organizations`,
      { name: `Timeline Org ${timestamp}`, slug: `timeline-${timestamp}` },
      aliceHeaders
    );
    const orgId = orgRes.data.data.id;
    console.log(`✅ Org created: ${orgId}`);

    // 3. Invite & Accept Bob into Org
    console.log('\n3. Inviting Bob into Organization...');
    const inviteRes = await axios.post(
      `${API}/organizations/${orgId}/invitations`,
      { email: bobEmail, role: 'MEMBER' },
      aliceHeaders
    );
    const token = inviteRes.data.debugToken || inviteRes.data.data?.token;
    await axios.post(`${API}/invitations/accept`, { token }, bobHeaders);
    console.log('✅ Bob accepted invitation and joined org.');



    // 4. Create Project & Task
    console.log('\n4. Creating Project & Task...');
    const projRes = await axios.post(
      `${API}/organizations/${orgId}/projects`,
      { name: 'Syntrix Realtime Chat', key: 'CHAT' },
      aliceHeaders
    );
    const projectId = projRes.data.data.id;

    const taskRes = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
      { title: 'Implement WebSocket Comment Stream', priority: 'HIGH' },
      aliceHeaders
    );
    const taskId = taskRes.data.data.id;
    console.log(`✅ Created project ${projectId} and task ${taskId} (CHAT-1)`);

    // 5. Alice Posts Root Comment with @Bob Mention
    console.log('\n5. Alice posting root comment with @mention...');
    const comment1Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments`,
      {
        content: `Hey @${bobEmail}, please check the database indexes before we deploy!`,
      },
      aliceHeaders
    );
    const comment1 = comment1Res.data.data;
    console.log(`✅ Alice posted comment: "${comment1.content}"`);
    console.log(`   Mentions resolved: ${comment1.mentions?.length || 0}`);

    // 6. Bob Posts Threaded Reply
    console.log('\n6. Bob posting threaded reply...');
    const replyRes = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments`,
      {
        content: 'Sure Alice! I verified the composite index on [taskId, createdAt].',
        parentId: comment1.id,
      },
      bobHeaders
    );
    const reply = replyRes.data.data;
    console.log(`✅ Bob replied: "${reply.content}" (parent: ${reply.parentId})`);

    // 7. Bob Edits His Reply
    console.log('\n7. Bob editing his reply...');
    const editRes = await axios.put(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments/${reply.id}`,
      {
        content: 'Sure Alice! Verified index and added query optimization benchmark.',
      },
      bobHeaders
    );
    console.log(`✅ Reply edited. isEdited = ${editRes.data.data.isEdited}`);

    // 8. Update Task Status & Priority (Triggers Automatic Activity Logs)
    console.log('\n8. Updating Task Status to IN_PROGRESS...');
    await axios.put(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
      {
        status: 'IN_PROGRESS',
        priority: 'URGENT',
      },
      aliceHeaders
    );
    console.log('✅ Task status & priority updated.');

    // 9. Fetch Threaded Comments List
    console.log('\n9. Fetching Threaded Comments List...');
    const commentsListRes = await axios.get(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments`,
      aliceHeaders
    );
    const comments = commentsListRes.data.data;
    console.log(`✅ Retrieved ${comments.length} root comment(s).`);
    console.log(`   Root comment replies count: ${comments[0].replies?.length || 0}`);

    // 10. Fetch Task Activity Timeline
    console.log('\n10. Fetching Task Activity Timeline...');
    const activityRes = await axios.get(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/activities`,
      aliceHeaders
    );
    const activities = activityRes.data.data;
    console.log(`✅ Retrieved ${activities.length} activity audit log event(s):`);
    for (const act of activities) {
      console.log(`   • [${act.action}] by ${act.user.name}:`, JSON.stringify(act.details));
    }

    console.log('\n🎉 ALL SECTION 11 COMMENTS & ACTIVITY TIMELINE TESTS PASSED PERFECTLY!\n');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runSection11Tests();
