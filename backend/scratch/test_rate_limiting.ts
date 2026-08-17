import { createRateLimiter } from '../src/middleware/rateLimit.middleware';
import { loginUser, registerUser } from '../src/services/auth.service';
import { cacheService } from '../src/services/cache.service';
import prisma from '../src/config/prisma';

// Mock Express Request / Response helpers
function createMockReq(ip = '127.0.0.1', userId?: string) {
  return {
    ip,
    headers: {},
    socket: { remoteAddress: ip },
    user: userId ? { id: userId } : undefined,
  } as any;
}

function createMockRes() {
  const headers: Record<string, any> = {};
  let statusCode = 200;
  let responseBody: any = null;

  return {
    headers,
    setHeader(name: string, value: any) {
      headers[name.toLowerCase()] = value;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: any) {
      responseBody = body;
      return this;
    },
    getStatusCode: () => statusCode,
    getBody: () => responseBody,
  };
}

async function testRateLimiting() {
  console.log('🧪 Starting Section 18: Rate Limiting & Protection E2E Verification...\n');

  await cacheService.clear();

  // 1. Test Custom Sliding-Window Rate Limiter Middleware
  console.log('1️⃣ Testing Sliding-Window Rate Limiter Middleware...');
  const testLimiter = createRateLimiter({
    windowMs: 5000, // 5s window
    maxRequests: 3,
    tierName: 'TEST_TIER',
  });

  const req = createMockReq('192.168.1.100');

  // Request 1 -> OK (remaining: 2)
  const res1 = createMockRes();
  let nextCalled1 = false;
  await testLimiter(req, res1 as any, () => { nextCalled1 = true; });
  console.log(`   - Req 1: NextCalled=${nextCalled1}, Remaining=${res1.headers['ratelimit-remaining']}, Status=${res1.getStatusCode()}`);

  // Request 2 -> OK (remaining: 1)
  const res2 = createMockRes();
  let nextCalled2 = false;
  await testLimiter(req, res2 as any, () => { nextCalled2 = true; });
  console.log(`   - Req 2: NextCalled=${nextCalled2}, Remaining=${res2.headers['ratelimit-remaining']}, Status=${res2.getStatusCode()}`);

  // Request 3 -> OK (remaining: 0)
  const res3 = createMockRes();
  let nextCalled3 = false;
  await testLimiter(req, res3 as any, () => { nextCalled3 = true; });
  console.log(`   - Req 3: NextCalled=${nextCalled3}, Remaining=${res3.headers['ratelimit-remaining']}, Status=${res3.getStatusCode()}`);

  // Request 4 -> RATE LIMITED (429)
  const res4 = createMockRes();
  let nextCalled4 = false;
  await testLimiter(req, res4 as any, () => { nextCalled4 = true; });
  console.log(`   - Req 4: NextCalled=${nextCalled4}, Remaining=${res4.headers['ratelimit-remaining']}, Status=${res4.getStatusCode()}`);
  console.log(`   - 429 Envelope: ${JSON.stringify(res4.getBody())}`);

  if (nextCalled4 || res4.getStatusCode() !== 429 || res4.getBody()?.error?.code !== 'RATE_LIMIT_EXCEEDED') {
    throw new Error('Expected 4th request to be blocked with 429 RATE_LIMIT_EXCEEDED');
  }
  console.log('✅ Sliding-window limiter & standard 429 envelope verified.\n');

  // 2. Test Brute-Force Login Lockout Protection
  console.log('2️⃣ Testing Brute-Force Login Lockout Protection...');
  const probeEmail = `probe.lockout.${Date.now()}@syntrix.io`;
  const correctPassword = 'Password123!';

  // Create test user
  await registerUser('Lockout Probe', probeEmail, correctPassword);
  console.log(`   - Registered probe account: ${probeEmail}`);

  // Execute 4 failed login attempts -> Should reject with 401 and countdown
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await loginUser(probeEmail, 'WrongPassword!');
      throw new Error(`Attempt ${attempt} was expected to fail`);
    } catch (err: any) {
      console.log(`   - Attempt ${attempt}: Status=${err.statusCode}, Message="${err.message}"`);
      if (err.statusCode !== 401) {
        throw new Error(`Expected 401 on attempt ${attempt}, got ${err.statusCode}`);
      }
    }
  }

  // 5th failed attempt -> Should trigger 429 account lockout
  try {
    await loginUser(probeEmail, 'WrongPassword!');
    throw new Error('5th attempt was expected to trigger account lockout');
  } catch (err: any) {
    console.log(`   - Attempt 5 (Lockout Trigger): Status=${err.statusCode}, Message="${err.message}"`);
    if (err.statusCode !== 429) {
      throw new Error(`Expected 429 account lockout on attempt 5, got ${err.statusCode}`);
    }
  }

  // 6th attempt with CORRECT password -> Must still be BLOCKED (429) due to active lockout
  try {
    await loginUser(probeEmail, correctPassword);
    throw new Error('Login with correct password should have been blocked while locked');
  } catch (err: any) {
    console.log(`   - Attempt 6 with CORRECT Password (During Lockout): Status=${err.statusCode}, Message="${err.message}"`);
    if (err.statusCode !== 429) {
      throw new Error(`Expected 429 lockout check, got ${err.statusCode}`);
    }
  }
  console.log('✅ Brute-force account lockout verified.\n');

  // 3. Clean up probe user
  await prisma.user.deleteMany({ where: { email: probeEmail } });
  await cacheService.clear();

  await prisma.$disconnect();
  console.log('🎉 Section 18: Rate Limiting & Protection Verification Completed Successfully!\n');
}

testRateLimiting().catch((err) => {
  console.error('❌ Rate limiting verification failed:', err);
  process.exit(1);
});
