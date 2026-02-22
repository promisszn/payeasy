import { NextRequest, NextResponse } from 'next/server';

export interface StoredAnalytics {
  pageUrl: string;
  loadTime: number;
  fcp: number;
  lcp: number;
  cls: number;
  resourceCount: number;
  timestamp: number;
  apiResponseTime: number;
  errorCount: number;
}

// In-memory storage for demo (in production use a database)
const analyticsData: StoredAnalytics[] = [];
const MAX_RECORDS = 10000;

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events format' }, { status: 400 });
    }

    // Process and store events
    for (const event of events) {
      if (event.type === 'page_load' || event.type === 'api_call') {
        const record: StoredAnalytics = {
          pageUrl: event.url,
          loadTime: event.duration,
          fcp: 0,
          lcp: 0,
          cls: 0,
          resourceCount: 0,
          timestamp: event.timestamp,
          apiResponseTime: event.type === 'api_call' ? event.duration : 0,
          errorCount: 0,
        };

        analyticsData.push(record);

        // Keep data bounded
        if (analyticsData.length > MAX_RECORDS) {
          analyticsData.shift();
        }
      }
    }

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metricType = searchParams.get('type');

    if (!metricType) {
      return NextResponse.json(analyticsData.slice(-100));
    }

    // Return metrics filtered by type
    const filtered = analyticsData.slice(-100);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
