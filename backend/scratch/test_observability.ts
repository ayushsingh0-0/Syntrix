import { logger, securityLogger, logSecurityEvent } from '../src/utils/logger';
import { requestContextStorage, getCorrelationId } from '../src/middleware/correlationId.middleware';
import { metricsService, recordHttpRequestMetric } from '../src/services/metrics.service';
import fs from 'fs';
import path from 'path';

async function testObservabilitySystem() {
  console.log('🧪 Starting Section 19: Logging & Observability E2E Verification...\n');

  // 1. Test AsyncLocalStorage Correlation ID Propagation
  console.log('1️⃣ Testing AsyncLocalStorage Correlation ID Propagation...');
  const testTraceId = 'trace-synth-998877';

  await requestContextStorage.run({ correlationId: testTraceId }, async () => {
    const insideTrace = getCorrelationId();
    console.log(`   - Root Context Correlation ID: ${insideTrace}`);

    if (insideTrace !== testTraceId) {
      throw new Error(`Expected correlation ID ${testTraceId}, got ${insideTrace}`);
    }

    // Nested asynchronous task simulation
    await new Promise((resolve) => setTimeout(resolve, 50));
    const nestedTrace = getCorrelationId();
    console.log(`   - Nested Async Context Correlation ID: ${nestedTrace}`);
    if (nestedTrace !== testTraceId) {
      throw new Error(`Expected correlation ID ${testTraceId} to survive async hops, got ${nestedTrace}`);
    }

    logger.info('Observability probe inside correlation context', { testTag: 'probe-1' });
    logger.warn('Warning test probe with correlation ID', { warnCode: 'W_TEST' });
    logger.error('Error test probe with simulated stack', { error: new Error('Simulated observability error') });
  });

  const outsideTrace = getCorrelationId();
  console.log(`   - Context Outside Storage: ${outsideTrace}`);
  console.log('✅ Correlation ID propagation verified.\n');

  // 2. Test Security Audit Logging
  console.log('2️⃣ Testing Dedicated Security Audit Logging...');
  logSecurityEvent('UNAUTHORIZED_ACCESS_PROBE', {
    userId: 'usr-fake-999',
    email: 'hacker@syntrix.io',
    action: 'TRANSFER_ORG_OWNERSHIP',
    status: 'DENIED',
    ipAddress: '198.51.100.4',
    metadata: { attemptedRole: 'OWNER', reason: 'Insufficient RBAC permissions' },
  });
  console.log('✅ Security audit event dispatched.\n');

  // 3. Test Prometheus & Structured Metrics
  console.log('3️⃣ Testing Prometheus & Observability Metrics...');
  recordHttpRequestMetric('GET', '/api/v1/organizations', 200, 42);
  recordHttpRequestMetric('POST', '/api/v1/auth/login', 401, 88);
  recordHttpRequestMetric('GET', '/api/v1/projects', 500, 120);

  const prometheusText = await metricsService.getPrometheusMetrics();
  console.log('   --- Sample Prometheus Output ---');
  console.log(prometheusText.split('\n').slice(0, 15).join('\n'));
  console.log('   --------------------------------');

  const metricsJson = metricsService.getMetricsJson();
  console.log(`   - Total HTTP Requests Tracked: ${metricsJson.http.totalRequests}`);
  console.log(`   - Average Latency: ${metricsJson.http.averageDurationMs}ms`);
  console.log(`   - Memory Heap Used: ${Math.round(metricsJson.memory.heapUsedBytes / 1024 / 1024)}MB`);

  if (!prometheusText.includes('syntrix_http_requests_total') || metricsJson.http.totalRequests < 3) {
    throw new Error('Prometheus metrics failed to capture recorded HTTP metrics');
  }
  console.log('✅ Prometheus metrics generation verified.\n');

  // 4. Verify Log Files Creation in `logs/` directory
  console.log('4️⃣ Verifying Physical Log Files on Disk...');
  const logsDir = path.resolve(process.cwd(), 'logs');
  const files = fs.readdirSync(logsDir);
  console.log(`   - Log files found in ${logsDir}:`, files);

  const hasAppLog = files.some((f) => f.startsWith('app-'));
  const hasErrorLog = files.some((f) => f.startsWith('error-'));
  const hasSecurityLog = files.some((f) => f.startsWith('security-'));

  console.log(`   - app-*.log exists: ${hasAppLog}`);
  console.log(`   - error-*.log exists: ${hasErrorLog}`);
  console.log(`   - security-*.log exists: ${hasSecurityLog}`);

  if (!hasAppLog || !hasErrorLog || !hasSecurityLog) {
    throw new Error('Expected app, error, and security log rotation files to exist');
  }
  console.log('✅ Physical log files and rotation transports verified.\n');

  console.log('🎉 Section 19: Logging & Observability Verification Completed Successfully!\n');
}

testObservabilitySystem().catch((err) => {
  console.error('❌ Observability verification failed:', err);
  process.exit(1);
});
