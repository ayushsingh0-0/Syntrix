import { cacheService } from './cache.service';

interface RequestMetricCounter {
  [key: string]: number;
}

const requestCounters: RequestMetricCounter = {};
let totalRequestDurationMs = 0;
let totalRequestsCount = 0;

/**
 * Record HTTP Request metrics
 */
export const recordHttpRequestMetric = (
  method: string,
  _route: string,
  statusCode: number,
  durationMs: number
): void => {
  const statusGroup = `${Math.floor(statusCode / 100)}xx`;
  const key = `${method.toUpperCase()}_${statusGroup}`;

  requestCounters[key] = (requestCounters[key] || 0) + 1;
  totalRequestDurationMs += durationMs;
  totalRequestsCount++;
};

export class MetricsService {
  /**
   * Return Prometheus plaintext exposition format
   */
  async getPrometheusMetrics(): Promise<string> {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());
    const cacheMetrics = cacheService.getMetrics();

    let output = '';

    // Process & System Metrics
    output += '# HELP process_uptime_seconds The uptime of the Node.js process.\n';
    output += '# TYPE process_uptime_seconds gauge\n';
    output += `process_uptime_seconds ${uptimeSeconds}\n\n`;

    output += '# HELP process_resident_memory_bytes Resident memory size in bytes.\n';
    output += '# TYPE process_resident_memory_bytes gauge\n';
    output += `process_resident_memory_bytes ${memory.rss}\n\n`;

    output += '# HELP process_heap_used_bytes Process heap memory used in bytes.\n';
    output += '# TYPE process_heap_used_bytes gauge\n';
    output += `process_heap_used_bytes ${memory.heapUsed}\n\n`;

    // HTTP Request Metrics
    output += '# HELP syntrix_http_requests_total Total number of HTTP requests by method and status.\n';
    output += '# TYPE syntrix_http_requests_total counter\n';
    for (const [key, count] of Object.entries(requestCounters)) {
      const [method, status] = key.split('_');
      output += `syntrix_http_requests_total{method="${method}",status="${status}"} ${count}\n`;
    }
    if (Object.keys(requestCounters).length === 0) {
      output += 'syntrix_http_requests_total{method="ALL",status="2xx"} 0\n';
    }
    output += '\n';

    output += '# HELP syntrix_http_request_duration_ms Average HTTP request latency in ms.\n';
    output += '# TYPE syntrix_http_request_duration_ms gauge\n';
    const avgDuration =
      totalRequestsCount > 0 ? (totalRequestDurationMs / totalRequestsCount).toFixed(2) : '0';
    output += `syntrix_http_request_duration_ms ${avgDuration}\n\n`;

    // Cache Metrics
    output += '# HELP syntrix_cache_hits_total Total number of cache hits.\n';
    output += '# TYPE syntrix_cache_hits_total counter\n';
    output += `syntrix_cache_hits_total ${cacheMetrics.hits}\n\n`;

    output += '# HELP syntrix_cache_misses_total Total number of cache misses.\n';
    output += '# TYPE syntrix_cache_misses_total counter\n';
    output += `syntrix_cache_misses_total ${cacheMetrics.misses}\n\n`;

    output += '# HELP syntrix_cache_hit_ratio Efficiency ratio of cache hits.\n';
    output += '# TYPE syntrix_cache_hit_ratio gauge\n';
    output += `syntrix_cache_hit_ratio ${cacheMetrics.hitRatio}\n\n`;

    return output;
  }

  /**
   * Return structured JSON metrics for dashboards
   */
  getMetricsJson() {
    const memory = process.memoryUsage();
    const cacheMetrics = cacheService.getMetrics();

    return {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssBytes: memory.rss,
        heapUsedBytes: memory.heapUsed,
        heapTotalBytes: memory.heapTotal,
      },
      http: {
        totalRequests: totalRequestsCount,
        averageDurationMs:
          totalRequestsCount > 0
            ? Number((totalRequestDurationMs / totalRequestsCount).toFixed(2))
            : 0,
        requestsByStatus: requestCounters,
      },
      cache: cacheMetrics,
    };
  }
}

export const metricsService = new MetricsService();
