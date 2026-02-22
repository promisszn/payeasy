/**
 * Performance Analytics Utilities
 * Utilities for processing and analyzing performance metrics
 */

export interface PerformanceSummary {
  totalPageLoads: number;
  averageLoadTime: number;
  medianLoadTime: number;
  p95LoadTime: number;
  p99LoadTime: number;
  slowestPageUrl: string;
  fastestPageUrl: string;
}

export interface CoreWebVitalsSummary {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
}

export interface APIAnalytics {
  totalCalls: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  failureRate: number;
  slowestEndpoint: string;
}

export interface HealthMetrics {
  uptime: number;
  errorRate: number;
  criticalErrors: number;
  warningCount: number;
}

/**
 * Calculate percentile value from array
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((sorted.length * p) / 100) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get performance summary statistics
 */
export function getPerformanceSummary(
  metrics: Array<{ loadTime: number; pageUrl: string }>
): PerformanceSummary {
  const loadTimes = metrics.map((m) => m.loadTime);
  const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length || 0;

  return {
    totalPageLoads: metrics.length,
    averageLoadTime: Math.round(avgLoadTime),
    medianLoadTime: Math.round(percentile(loadTimes, 50)),
    p95LoadTime: Math.round(percentile(loadTimes, 95)),
    p99LoadTime: Math.round(percentile(loadTimes, 99)),
    slowestPageUrl: metrics.reduce((max, m) => (m.loadTime > max.loadTime ? m : max)).pageUrl,
    fastestPageUrl: metrics.reduce((min, m) => (m.loadTime < min.loadTime ? m : min)).pageUrl,
  };
}

/**
 * Identify slow pages
 */
export function getSlowPages(
  metrics: Array<{ pageUrl: string; loadTime: number }>,
  threshold = 3000
): Array<{ url: string; avgLoadTime: number; count: number }> {
  const grouped = new Map<string, number[]>();

  for (const metric of metrics) {
    if (!grouped.has(metric.pageUrl)) {
      grouped.set(metric.pageUrl, []);
    }
    grouped.get(metric.pageUrl)!.push(metric.loadTime);
  }

  return Array.from(grouped.entries())
    .map(([url, times]) => ({
      url,
      avgLoadTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      count: times.length,
    }))
    .filter((p) => p.avgLoadTime > threshold)
    .sort((a, b) => b.avgLoadTime - a.avgLoadTime);
}

/**
 * Get Core Web Vitals summary
 */
export function getCoreWebVitalsSummary(
  metrics: Array<{ fcp: number; lcp: number; cls: number; fid?: number }>
): CoreWebVitalsSummary {
  const fcps = metrics.map((m) => m.fcp);
  const lcps = metrics.map((m) => m.lcp);
  const clss = metrics.map((m) => m.cls);
  const fids = metrics.map((m) => m.fid || 0);

  return {
    fcp: Math.round(fcps.reduce((a, b) => a + b, 0) / fcps.length || 0),
    lcp: Math.round(lcps.reduce((a, b) => a + b, 0) / lcps.length || 0),
    cls: Math.round((clss.reduce((a, b) => a + b, 0) / clss.length || 0) * 100) / 100,
    fid: Math.round(fids.reduce((a, b) => a + b, 0) / fids.length || 0),
  };
}

/**
 * Analyze API performance
 */
export function analyzeAPIPerformance(
  metrics: Array<{ url: string; duration: number; status: number }>
): APIAnalytics {
  const durations = metrics.map((m) => m.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length || 0;
  const failures = metrics.filter((m) => m.status >= 400).length;

  const slowestEndpoint = metrics.reduce((max, m) => (m.duration > max.duration ? m : max)).url;

  return {
    totalCalls: metrics.length,
    averageResponseTime: Math.round(avgDuration),
    medianResponseTime: Math.round(percentile(durations, 50)),
    p95ResponseTime: Math.round(percentile(durations, 95)),
    failureRate: Math.round((failures / metrics.length) * 10000) / 100,
    slowestEndpoint,
  };
}

/**
 * Calculate health metrics
 */
export function calculateHealthMetrics(
  metrics: Array<{ errorCount: number; uptime: number }>
): HealthMetrics {
  const errorCounts = metrics.map((m) => m.errorCount);
  const uptimes = metrics.map((m) => m.uptime);

  const totalErrors = errorCounts.reduce((a, b) => a + b, 0);
  const avgUptime = uptimes.reduce((a, b) => a + b, 0) / uptimes.length || 100;
  const errorRate = Math.round((totalErrors / metrics.length) * 100) / 100;

  return {
    uptime: Math.round(avgUptime * 100) / 100,
    errorRate,
    criticalErrors: errorCounts.filter((c) => c > 10).length,
    warningCount: errorCounts.filter((c) => c > 5 && c <= 10).length,
  };
}

/**
 * Detect performance anomalies
 */
export function detectAnomalies(
  metrics: Array<{ loadTime: number; timestamp: number }>,
  threshold = 2
): Array<{ timestamp: number; loadTime: number; deviation: number }> {
  if (metrics.length < 2) return [];

  const avg = metrics.reduce((a, m) => a + m.loadTime, 0) / metrics.length;
  const variance =
    metrics.reduce((sum, m) => sum + Math.pow(m.loadTime - avg, 2), 0) / metrics.length;
  const stdDev = Math.sqrt(variance);

  return metrics
    .filter((m) => Math.abs(m.loadTime - avg) > threshold * stdDev)
    .map((m) => ({
      timestamp: m.timestamp,
      loadTime: m.loadTime,
      deviation: Math.round(((m.loadTime - avg) / stdDev) * 100) / 100,
    }));
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(
  metrics: Array<{
    pageUrl: string;
    loadTime: number;
    fcp: number;
    lcp: number;
    cls: number;
    errorCount: number;
    uptime: number;
    duration?: number;
    status?: number;
  }>
) {
  if (metrics.length === 0) {
    return {
      summary: null,
      webVitals: null,
      slowPages: [],
      anomalies: [],
      health: null,
    };
  }

  const summary = getPerformanceSummary(metrics);
  const webVitals = getCoreWebVitalsSummary(metrics);
  const slowPages = getSlowPages(metrics);
  const anomalies = detectAnomalies(
    metrics.map((m) => ({ loadTime: m.loadTime, timestamp: 0 }))
  );
  const health = calculateHealthMetrics(
    metrics.map((m) => ({
      errorCount: m.errorCount,
      uptime: m.uptime,
    }))
  );

  return {
    summary,
    webVitals,
    slowPages,
    anomalies,
    health,
  };
}
