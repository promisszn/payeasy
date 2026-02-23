import {
  getPerformanceSummary,
  getSlowPages,
  getCoreWebVitalsSummary,
  analyzeAPIPerformance,
  calculateHealthMetrics,
  detectAnomalies,
  generatePerformanceReport,
} from '@/lib/performance/analytics';

describe('Performance Analytics', () => {
  describe('getPerformanceSummary', () => {
    it('should calculate performance metrics correctly', () => {
      const metrics = [
        { loadTime: 1000, pageUrl: '/page1' },
        { loadTime: 2000, pageUrl: '/page2' },
        { loadTime: 3000, pageUrl: '/page3' },
      ];

      const result = getPerformanceSummary(metrics);

      expect(result.totalPageLoads).toBe(3);
      expect(result.averageLoadTime).toBe(2000);
      expect(result.medianLoadTime).toBe(2000);
      expect(result.slowestPageUrl).toBe('/page3');
      expect(result.fastestPageUrl).toBe('/page1');
    });

    it('should handle empty metrics', () => {
      const metrics: Array<{ loadTime: number; pageUrl: string }> = [];
      const result = getPerformanceSummary(metrics);

      expect(result.totalPageLoads).toBe(0);
      expect(result.averageLoadTime).toBe(0);
    });
  });

  describe('getSlowPages', () => {
    it('should identify slow pages', () => {
      const metrics = [
        { pageUrl: '/page1', loadTime: 1000 },
        { pageUrl: '/page1', loadTime: 1500 },
        { pageUrl: '/page2', loadTime: 5000 },
        { pageUrl: '/page3', loadTime: 2000 },
      ];

      const result = getSlowPages(metrics, 3000);

      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('/page2');
      expect(result[0].avgLoadTime).toBe(5000);
    });

    it('should return empty array if no slow pages', () => {
      const metrics = [
        { pageUrl: '/page1', loadTime: 1000 },
        { pageUrl: '/page2', loadTime: 2000 },
      ];

      const result = getSlowPages(metrics, 3000);

      expect(result).toHaveLength(0);
    });
  });

  describe('getCoreWebVitalsSummary', () => {
    it('should calculate Core Web Vitals', () => {
      const metrics = [
        { fcp: 1000, lcp: 2000, cls: 0.1, fid: 50 },
        { fcp: 1200, lcp: 2500, cls: 0.15, fid: 60 },
      ];

      const result = getCoreWebVitalsSummary(metrics);

      expect(result.fcp).toBe(1100);
      expect(result.lcp).toBe(2250);
      expect(result.cls).toBeCloseTo(0.12, 1);
      expect(result.fid).toBe(55);
    });
  });

  describe('analyzeAPIPerformance', () => {
    it('should analyze API performance', () => {
      const metrics = [
        { url: '/api/users', duration: 100, status: 200 },
        { url: '/api/users', duration: 150, status: 200 },
        { url: '/api/posts', duration: 300, status: 500 },
      ];

      const result = analyzeAPIPerformance(metrics);

      expect(result.totalCalls).toBe(3);
      expect(result.failureRate).toBeCloseTo(33.33, 1);
      expect(result.slowestEndpoint).toBe('/api/posts');
    });
  });

  describe('calculateHealthMetrics', () => {
    it('should calculate health metrics', () => {
      const metrics = [
        { errorCount: 5, uptime: 99.9 },
        { errorCount: 3, uptime: 99.8 },
      ];

      const result = calculateHealthMetrics(metrics);

      expect(result.uptime).toBe(99.85);
      expect(result.errorRate).toBe(4);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect performance anomalies', () => {
      const metrics = [
        { loadTime: 1000, timestamp: 0 },
        { loadTime: 1100, timestamp: 1000 },
        { loadTime: 1050, timestamp: 2000 },
        { loadTime: 5000, timestamp: 3000 }, // Anomaly
      ];

      const result = detectAnomalies(metrics, 2);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((a) => a.loadTime === 5000)).toBe(true);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate complete performance report', () => {
      const metrics = [
        {
          pageUrl: '/page1',
          loadTime: 1000,
          fcp: 800,
          lcp: 1500,
          cls: 0.1,
          errorCount: 0,
          uptime: 99.9,
        },
        {
          pageUrl: '/page2',
          loadTime: 2000,
          fcp: 1000,
          lcp: 2000,
          cls: 0.15,
          errorCount: 1,
          uptime: 99.8,
        },
      ];

      const result = generatePerformanceReport(metrics);

      expect(result.summary).toBeDefined();
      expect(result.webVitals).toBeDefined();
      expect(result.health).toBeDefined();
      expect(result.summary?.averageLoadTime).toBe(1500);
    });

    it('should handle empty metrics in report generation', () => {
      const result = generatePerformanceReport([]);

      expect(result.summary).toBeNull();
      expect(result.slowPages).toHaveLength(0);
    });
  });
});
