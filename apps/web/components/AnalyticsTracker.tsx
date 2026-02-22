'use client';

import { useAnalytics } from '@/lib/analytics/hooks';
import { Suspense } from 'react';

function Tracker() {
    useAnalytics();
    return null;
}

export function AnalyticsTracker() {
    return (
        <Suspense fallback={null}>
            <Tracker />
        </Suspense>
    );
}
