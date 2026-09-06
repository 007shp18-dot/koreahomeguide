import type {BeforeSendEvent} from '@vercel/analytics/next';

export function redactAnalyticsUrl(event:BeforeSendEvent):BeforeSendEvent|null {
 try {
  const url=new URL(event.url);
  if(!['https:','http:'].includes(url.protocol)) return null;
  return {...event,url:`${url.origin}${url.pathname}`};
 } catch {return null;}
}
