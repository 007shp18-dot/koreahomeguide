'use client';
import {Analytics as VercelAnalytics} from '@vercel/analytics/next';
import {redactAnalyticsUrl} from '../lib/analytics/url-redaction';

/** Keep shareable query state out of page-view and custom-event locations. */
export function Analytics() {
 return <VercelAnalytics beforeSend={redactAnalyticsUrl}/>;
}
