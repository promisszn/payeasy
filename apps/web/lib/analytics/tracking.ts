'use client';

import mixpanel from 'mixpanel-browser';
import { AnalyticsEventName, EventPayloads } from './events';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const IS_PROD = process.env.NODE_ENV === 'production';

// Initialize Mixpanel
if (typeof window !== 'undefined' && MIXPANEL_TOKEN) {
    mixpanel.init(MIXPANEL_TOKEN, {
        debug: !IS_PROD,
        track_pageview: false, // We'll handle this manually
        persistence: 'localStorage',
    });
}

export const trackEvent = <T extends AnalyticsEventName>(
    name: T,
    properties: EventPayloads[T]
) => {
    if (typeof window === 'undefined') return;

    if (!MIXPANEL_TOKEN || !IS_PROD) {
        console.log(`[Analytics] Track Event: ${name}`, properties);
        if (!MIXPANEL_TOKEN) return;
    }

    try {
        mixpanel.track(name, properties);
    } catch (error) {
        console.error('[Analytics] Error tracking event:', error);
    }
};

export const identity = (id: string, properties?: Record<string, any>) => {
    if (typeof window === 'undefined' || !MIXPANEL_TOKEN) return;

    try {
        mixpanel.identify(id);
        if (properties) {
            mixpanel.people.set(properties);
        }
    } catch (error) {
        console.error('[Analytics] Error identifying user:', error);
    }
};

export const resetIdentity = () => {
    if (typeof window === 'undefined' || !MIXPANEL_TOKEN) return;
    try {
        mixpanel.reset();
    } catch (error) {
        console.error('[Analytics] Error resetting identity:', error);
    }
};
