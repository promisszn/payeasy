/**
 * Performance Metrics Collector
 * Collects browser performance metrics and sends them to the analytics endpoint
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  firstInputDelay: number;
  documentReadyTime: number;
  resourceCount: number;
  errorCount: number;
  pageUrl: string;
  timestamp: number;
}

export interface AnalyticsEvent {
  type: 'page_load' | 'api_call' | 'error' | 'resource';
  url: string;
  duration: number;
  status?: number;
  error?: string;
  timestamp: number;
  resourceType?: string;
}

let metricsQueue: AnalyticsEvent[] = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

/**
 * Collect Web Vitals from PerformanceObserver API
 */
export async function collectWebVitals(): Promise<Partial<PerformanceMetrics>> {
  if (typeof window === 'undefined') return {};

  const metrics: Partial<PerformanceMetrics> = {};

  try {
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      metrics.documentReadyTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    }

    // Get paint entries
    const paint = performance.getEntriesByType('paint');
    paint.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Get largest contentful paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.largestContentfulPaint = lastEntry.startTime;
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    // Get layout shift
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
    metrics.cumulativeLayoutShift = cls;

    // Get resource count
    metrics.resourceCount = performance.getEntriesByType('resource').length;

    // Error count from current session
    metrics.errorCount = 0;

    metrics.pageUrl = window.location.href;
    metrics.timestamp = Date.now();

    return metrics;
  } catch (error) {
    console.error('Error collecting WebVitals:', error);
    return {};
  }
}

/**
 * Track API calls and network requests
 */
export function trackAPICall(url: string, duration: number, status: number): void {
  const event: AnalyticsEvent = {
    type: 'api_call',
    url,
    duration,
    status,
    timestamp: Date.now(),
  };
  metricsQueue.push(event);

  if (metricsQueue.length >= BATCH_SIZE) {
    flushMetrics();
  }
}

/**
 * Track resource loads
 */
export function trackResource(
  url: string,
  duration: number,
  resourceType: string
): void {
  const event: AnalyticsEvent = {
    type: 'resource',
    url,
    duration,
    resourceType,
    timestamp: Date.now(),
  };
  metricsQueue.push(event);
}

/**
 * Track errors
 */
export function trackError(error: Error, context: string): void {
  const event: AnalyticsEvent = {
    type: 'error',
    url: typeof window !== 'undefined' ? window.location.href : '',
    duration: 0,
    error: `${context}: ${error.message}`,
    timestamp: Date.now(),
  };
  metricsQueue.push(event);
}

/**
 * Flush metrics to server
 */
export async function flushMetrics(): Promise<void> {
  if (metricsQueue.length === 0) return;

  const batch = metricsQueue.splice(0, BATCH_SIZE);
  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  } catch (error) {
    console.error('Failed to flush metrics:', error);
    // Re-queue failed items
    metricsQueue.unshift(...batch);
  }
}

/**
 * Initialize metrics collection
 */
export function initializeMetricsCollection(): void {
  if (typeof window === 'undefined') return;

  // Flush metrics periodically
  const flushInterval = setInterval(flushMetrics, FLUSH_INTERVAL);

  // Flush on page unload
  const handleBeforeUnload = () => {
    clearInterval(flushInterval);
    flushMetrics();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
}
