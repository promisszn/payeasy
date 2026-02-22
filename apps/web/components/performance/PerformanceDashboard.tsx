'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { AlertCircle, TrendingDown, TrendingUp, Activity } from 'lucide-react';

interface MetricData {
  time: string;
  loadTime: number;
  fcp: number;
  lcp: number;
  apiTime: number;
  errorRate: number;
  uptime: number;
  resourceSize: number;
  cls?: number;
}

interface MetricCard {
  label: string;
  value: string;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export function PerformanceDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [summaryCards, setSummaryCards] = useState<MetricCard[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/events?type=all');
        const data = await response.json();

        // Generate mock data for demo (in production, process real data)
        const mockMetrics = generateMockMetrics();
        setMetrics(mockMetrics);
        setSummaryCards(generateSummaryCards(mockMetrics));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  const avgLoadTime =
    metrics.reduce((acc, m) => acc + m.loadTime, 0) / metrics.length || 0;
  const avgApiTime = metrics.reduce((acc, m) => acc + m.apiTime, 0) / metrics.length || 0;
  const avgErrorRate = metrics.reduce((acc, m) => acc + m.errorRate, 0) / metrics.length || 0;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <MetricCardComponent key={card.label} card={card} />
        ))}
      </div>

      {/* Page Load Times */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Page Load Times</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip formatter={(value) => `${(value as number).toFixed(0)}ms`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="loadTime"
              stroke="#3b82f6"
              dot={false}
              name="Load Time (ms)"
              strokeWidth={2}
            />
            <ReferenceLine
              y={avgLoadTime}
              stroke="#10b981"
              strokeDasharray="5 5"
              label={{ value: `Avg: ${avgLoadTime.toFixed(0)}ms`, position: 'right' }}
            />
            <ReferenceLine
              y={3000}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: 'Target: 3000ms', position: 'right' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Core Web Vitals */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Core Web Vitals</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="fcp"
              fill="#8b5cf6"
              name="FCP (ms)"
              opacity={0.7}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="lcp"
              stroke="#06b6d4"
              name="LCP (ms)"
              strokeWidth={2}
            />
            <ReferenceLine
              y={2500}
              stroke="#fbbf24"
              strokeDasharray="5 5"
              label="LCP Target: 2.5s"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* API Response Times */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">API Response Times</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip formatter={(value) => `${(value as number).toFixed(0)}ms`} />
            <Legend />
            <Area
              type="monotone"
              dataKey="apiTime"
              fill="#10b98166"
              stroke="#10b981"
              name="API Response Time (ms)"
              strokeWidth={2}
            />
            <ReferenceLine
              y={avgApiTime}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: `Avg: ${avgApiTime.toFixed(0)}ms`, position: 'right' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Error Rates & Uptime */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Error Rates */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Error Rates (%)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${(value as number).toFixed(2)}%`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="errorRate"
                stroke="#ef4444"
                dot={false}
                name="Error Rate"
                strokeWidth={2}
              />
              <ReferenceLine
                y={avgErrorRate}
                stroke="#f97316"
                strokeDasharray="5 5"
                label={{ value: `Avg: ${avgErrorRate.toFixed(2)}%`, position: 'right' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Uptime */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Uptime Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="uptime" fill="#10b981" name="Uptime (%)" />
              <ReferenceLine
                y={99.9}
                stroke="#06b6d4"
                strokeDasharray="5 5"
                label="Target: 99.9%"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Resource Usage (KB)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip formatter={(value) => `${(value as number).toFixed(2)}KB`} />
            <Legend />
            <Area
              type="monotone"
              dataKey="resourceSize"
              fill="#f59e0b66"
              stroke="#f59e0b"
              name="Total Resources (KB)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      <AlertsSection metrics={metrics} />
    </div>
  );
}

function MetricCardComponent({ card }: { card: MetricCard }) {
  const statusClasses = {
    good: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    critical: 'border-red-200 bg-red-50',
  };

  const textClasses = {
    good: 'text-green-900',
    warning: 'text-yellow-900',
    critical: 'text-red-900',
  };

  return (
    <div className={`rounded-lg border p-4 ${statusClasses[card.status]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${textClasses[card.status]}`}>{card.label}</p>
          <p className={`mt-2 text-2xl font-bold ${textClasses[card.status]}`}>
            {card.value}
            <span className="text-lg font-normal"> {card.unit}</span>
          </p>
        </div>
        <div className={`${textClasses[card.status]} opacity-70`}>{card.icon}</div>
      </div>
    </div>
  );
}

function AlertsSection({ metrics }: { metrics: MetricData[] }) {
  const alerts: Array<{ title: string; message: string; severity: 'critical' | 'warning' }> =
    [];

  if (metrics.length > 0) {
    const lastMetric = metrics[metrics.length - 1];

    if (lastMetric.loadTime > 3000) {
      alerts.push({
        title: 'High Load Time',
        message: `Page load time is ${lastMetric.loadTime.toFixed(0)}ms (target: 3000ms)`,
        severity: 'critical',
      });
    }

    if (lastMetric.errorRate > 1) {
      alerts.push({
        title: 'High Error Rate',
        message: `Error rate is ${lastMetric.errorRate.toFixed(2)}% (threshold: 1%)`,
        severity: 'critical',
      });
    }

    if (lastMetric.lcp > 2500) {
      alerts.push({
        title: 'LCP Threshold Exceeded',
        message: `LCP is ${lastMetric.lcp.toFixed(0)}ms (target: 2500ms)`,
        severity: 'warning',
      });
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start">
          <Activity className="mt-0.5 h-5 w-5 text-green-600" />
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-green-900">All Systems Healthy</h3>
            <p className="mt-1 text-sm text-green-700">All performance metrics are within acceptable ranges.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`rounded-lg border p-4 ${
            alert.severity === 'critical'
              ? 'border-red-200 bg-red-50'
              : 'border-yellow-200 bg-yellow-50'
          }`}
        >
          <div className="flex items-start">
            <AlertCircle
              className={`mt-0.5 h-5 w-5 ${
                alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`}
            />
            <div className="ml-3">
              <h3
                className={`text-sm font-semibold ${
                  alert.severity === 'critical' ? 'text-red-900' : 'text-yellow-900'
                }`}
              >
                {alert.title}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  alert.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'
                }`}
              >
                {alert.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function generateMockMetrics(): MetricData[] {
  const now = Date.now();
  const metrics: MetricData[] = [];

  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 3600000);
    metrics.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      loadTime: Math.floor(1500 + Math.random() * 2000),
      fcp: Math.floor(600 + Math.random() * 1000),
      lcp: Math.floor(1500 + Math.random() * 1500),
      apiTime: Math.floor(200 + Math.random() * 400),
      errorRate: Math.floor(Math.random() * 5 * 100) / 100,
      uptime: Math.floor(9990 + Math.random() * 10) / 100,
      resourceSize: Math.floor(500 + Math.random() * 1500),
      cls: Math.floor(Math.random() * 100) / 100,
    });
  }

  return metrics;
}

function generateSummaryCards(metrics: MetricData[]): MetricCard[] {
  if (metrics.length === 0) {
    return [];
  }

  const lastMetric = metrics[metrics.length - 1];
  const avgLoadTime = metrics.reduce((acc, m) => acc + m.loadTime, 0) / metrics.length;
  const avgApiTime = metrics.reduce((acc, m) => acc + m.apiTime, 0) / metrics.length;
  const avgErrorRate = metrics.reduce((acc, m) => acc + m.errorRate, 0) / metrics.length;

  return [
    {
      label: 'Avg Load Time',
      value: Math.floor(avgLoadTime).toString(),
      unit: 'ms',
      status: avgLoadTime < 3000 ? 'good' : avgLoadTime < 5000 ? 'warning' : 'critical',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: 'Avg API Response',
      value: Math.floor(avgApiTime).toString(),
      unit: 'ms',
      status: avgApiTime < 500 ? 'good' : avgApiTime < 1000 ? 'warning' : 'critical',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      label: 'Error Rate',
      value: avgErrorRate.toFixed(2),
      unit: '%',
      status: avgErrorRate < 0.5 ? 'good' : avgErrorRate < 2 ? 'warning' : 'critical',
      icon: <TrendingDown className="h-5 w-5" />,
    },
    {
      label: 'Current Uptime',
      value: lastMetric.uptime.toFixed(2),
      unit: '%',
      status: lastMetric.uptime > 99.5 ? 'good' : lastMetric.uptime > 95 ? 'warning' : 'critical',
      icon: <Activity className="h-5 w-5" />,
    },
  ];
}
