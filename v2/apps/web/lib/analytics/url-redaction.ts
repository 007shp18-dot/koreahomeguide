import type {BeforeSendEvent} from '@vercel/analytics/next';

export function redactAnalyticsLocation(value: string): string | null {
 try {
  const url=new URL(value);
  if(!['https:','http:'].includes(url.protocol)) return null;
  return `${url.origin}${url.pathname}`;
 } catch {return null;}
}

export function redactAnalyticsUrl(event:BeforeSendEvent):BeforeSendEvent|null {
 const url=redactAnalyticsLocation(event.url);
 return url===null?null:{...event,url};
}
