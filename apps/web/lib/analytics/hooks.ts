'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent } from './tracking';
import { AnalyticsEventName } from './events';

export const useAnalytics = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
            trackEvent(AnalyticsEventName.PAGE_VIEW, {
                url,
                title: document.title,
                referrer: document.referrer,
            });
        }
    }, [pathname, searchParams]);

    return {
        track: trackEvent,
    };
};
