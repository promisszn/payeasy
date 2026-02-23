import { Metadata } from 'next';
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import { initializeMetricsCollection } from '@/lib/performance/metricsCollector';

export const metadata: Metadata = {
  title: 'Performance Dashboard | PayEasy',
  description: 'Monitor application performance metrics, load times, and user experience data.',
};

export default function PerformancePageLayout() {
  // Initialize metrics collection in root layout
  if (typeof window !== 'undefined') {
    initializeMetricsCollection();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor application performance metrics, user experience, and system health in real-time.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Last Updated"
            value={new Date().toLocaleTimeString()}
            icon="🔄"
          />
          <StatCard label="Session Duration" value="Live" icon="⏱️" />
          <StatCard label="Data Points" value="1000+" icon="📊" />
          <StatCard label="Status" value="Healthy" icon="✅" />
        </div>

        {/* Main Dashboard */}
        <PerformanceDashboard />

        {/* Footer Info */}
        <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">About This Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">
            This performance dashboard tracks key metrics including page load times, Core Web Vitals,
            API response times, error rates, and system uptime. Data is collected in real-time and
            updated every 30 seconds. Use the charts to identify performance trends and set alerts
            for critical thresholds.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900">Green Indicators</h3>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• Load time &lt; 3 seconds</li>
                <li>• Error rate &lt; 0.5%</li>
                <li>• Uptime &gt; 99.5%</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Yellow/Red Alerts</h3>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• Load time &gt; 3-5 seconds</li>
                <li>• Error rate &gt; 1-2%</li>
                <li>• Uptime &lt; 95%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
