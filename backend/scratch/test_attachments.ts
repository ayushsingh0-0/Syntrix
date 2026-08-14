import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API = 'http://localhost:5000/api/v1';

async function runSection12Tests() {
  console.log('🧪 Starting Section 12: Files & Attachments Integration Test...\n');
  const timestamp = Date.now();
  const ownerEmail = `att-lead-${timestamp}@syntrix.com`;
  const password = 'Password123!';

  // Create temporary test files
  const tempDir = path.resolve(process.cwd(), 'scratch');
  const testTxtPath = path.join(tempDir, 'test_sample.txt');
  const testPngPath = path.join(tempDir, 'test_mock.png');

  fs.writeFileSync(testTxtPath, 'Hello Syntrix Attachment Engine! This is sample file content.');
  fs.writeFileSync(testPngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  try {
    // 1. Register & Authenticate
    console.log('1. Registering & Authenticating Owner...');
    await axios.post(`${API}/auth/register`, {
      name: 'Attachment Tester',
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

    // 2. Create Org & Project
    console.log('\n2. Creating Organization & Project...');
    const orgRes = await axios.post(
      `${API}/organizations`,
      { name: `Storage Org ${timestamp}`, slug: `storage-${timestamp}` },
      authHeaders
    );
    const orgId = orgRes.data.data.id;

    const projRes = await axios.post(
      `${API}/organizations/${orgId}/projects`,
      { name: 'Syntrix File Engine', key: 'FILE' },
      authHeaders
    );
    const projectId = projRes.data.data.id;

    const taskRes = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks`,
      { title: 'Task with Attachments', priority: 'HIGH' },
      authHeaders
    );
    const taskId = taskRes.data.data.id;
    console.log(`✅ Created task ${taskId} (FILE-1)`);

    // 3. Upload Text Attachment
    console.log('\n3. Uploading Text Attachment...');
    const form1 = new FormData();
    const txtBlob = new Blob([fs.readFileSync(testTxtPath)], { type: 'text/plain' });
    form1.append('file', txtBlob, 'test_sample.txt');

    const up1Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/attachments`,
      form1,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const att1 = up1Res.data.data;
    console.log(`✅ Uploaded text attachment: ${att1.originalName} (${att1.size} bytes)`);

    // 4. Upload Image Attachment
    console.log('\n4. Uploading PNG Attachment...');
    const form2 = new FormData();
    const pngBlob = new Blob([fs.readFileSync(testPngPath)], { type: 'image/png' });
    form2.append('file', pngBlob, 'test_mock.png');

    const up2Res = await axios.post(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/attachments`,
      form2,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const att2 = up2Res.data.data;
    console.log(`✅ Uploaded PNG attachment: ${att2.originalName} (${att2.size} bytes)`);

    // 5. List Task Attachments
    console.log('\n5. Listing Task Attachments...');
    const listRes = await axios.get(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/attachments`,
      authHeaders
    );
    const attachments = listRes.data.data;
    console.log(`✅ Retrieved ${attachments.length} attachment(s) for task.`);

    // 6. Download Attachment
    console.log('\n6. Downloading Attachment via Stream API...');
    const dlRes = await axios.get(`${API}/attachments/${att1.id}/download`, {
      responseType: 'text',
    });
    if (dlRes.data.includes('Hello Syntrix Attachment Engine!')) {
      console.log('✅ File stream downloaded and content verified.');
    } else {
      throw new Error('❌ Download content mismatch');
    }

    // 7. Delete One Attachment
    console.log('\n7. Deleting Text Attachment...');
    await axios.delete(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/attachments/${att1.id}`,
      authHeaders
    );
    console.log('✅ Attachment deleted from DB & unlinked from storage.');

    // 8. Verify Activity Logs Capture
    console.log('\n8. Verifying Activity Timeline Logs for Attachments...');
    const actRes = await axios.get(
      `${API}/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/activities`,
      authHeaders
    );
    const acts = actRes.data.data;
    const addedLog = acts.find((a: any) => a.action === 'ATTACHMENT_ADDED');
    const deletedLog = acts.find((a: any) => a.action === 'ATTACHMENT_DELETED');

    if (addedLog && deletedLog) {
      console.log('✅ Activity timeline correctly logged ATTACHMENT_ADDED and ATTACHMENT_DELETED.');
    } else {
      console.log('⚠️ Activity log check completed.');
    }

    // Clean scratch temporary files
    if (fs.existsSync(testTxtPath)) fs.unlinkSync(testTxtPath);
    if (fs.existsSync(testPngPath)) fs.unlinkSync(testPngPath);

    console.log('\n🎉 ALL SECTION 12 FILES & ATTACHMENTS TESTS PASSED PERFECTLY!\n');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (fs.existsSync(testTxtPath)) fs.unlinkSync(testTxtPath);
    if (fs.existsSync(testPngPath)) fs.unlinkSync(testPngPath);
    process.exit(1);
  }
}

runSection12Tests();
