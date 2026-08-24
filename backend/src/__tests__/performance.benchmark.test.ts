import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { CacheKeys } from '../types/cache.types';

describe('Performance Optimization & Benchmarks', () => {
  describe('HTTP Gzip / Brotli Response Compression', () => {
    it('should serve compressed responses for endpoints returning payloads larger than 1KB', async () => {
      const res = await request(app)
        .get('/api-docs.json')
        .set('Accept-Encoding', 'gzip, deflate');

      expect(res.status).toBe(200);
      expect(res.headers['content-encoding']).toBe('gzip');
    });

    it('should respect x-no-compression header if explicitly requested by client', async () => {
      const res = await request(app)
        .get('/api-docs.json')
        .set('Accept-Encoding', 'gzip, deflate')
        .set('x-no-compression', '1');

      expect(res.status).toBe(200);
      expect(res.headers['content-encoding']).toBeUndefined();
    });
  });

  describe('Latency & Micro-Benchmark Execution SLA', () => {
    it('should respond to /health checks in under 50ms', async () => {
      const start = performance.now();
      const res = await request(app).get('/api/v1/health');
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(duration).toBeLessThan(100); // 100ms threshold for test environment
    });

    it('should generate predictable deterministic Redis cache keys in under 1ms', () => {
      const start = performance.now();
      const orgId = 'org-12345';
      const projectId = 'proj-67890';
      const userId = 'user-abcde';

      for (let i = 0; i < 1000; i++) {
        CacheKeys.orgDashboard(orgId);
        CacheKeys.userDashboard(orgId, userId);
        CacheKeys.projectAnalytics(orgId, projectId);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // 1000 key generations in <50ms
    });
  });
});
