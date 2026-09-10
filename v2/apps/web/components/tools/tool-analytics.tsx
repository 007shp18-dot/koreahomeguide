'use client';
import { ExploreLink } from '../market-ui/explore-link';
import { useEffect, useRef, type ReactNode } from 'react';
import { track } from '@vercel/analytics/react';
import { sendGoogleEvent } from '../../lib/analytics/google-events';
import { createToolEvent, type ToolDimensions, type ToolEvent } from '../../lib/analytics/tool-events';
export function sendToolEvent(event:ToolEvent,input:ToolDimensions) {
 try {const {event:name,...dimensions}=createToolEvent(event,input);sendGoogleEvent(name,dimensions);track(name,dimensions);} catch { /* Analytics never blocks a reader action. */ }
}
export function ToolEventOnMount({event,...input}:ToolDimensions & {event:'tools_hub_open'|'tool_complete'}) {
 const sent=useRef(false);
 useEffect(()=>{if(!sent.current){sent.current=true;sendToolEvent(event,input);}},[event,input]);
 return null;
}
export function TrackedToolLink({href,children,...input}:ToolDimensions & {href:string;children:ReactNode}) {
 return <ExploreLink href={href} onClick={()=>sendToolEvent('tool_start',input)}>{children}</ExploreLink>;
}
