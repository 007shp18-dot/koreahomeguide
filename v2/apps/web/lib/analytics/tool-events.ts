export const TOOL_EVENTS = ['tools_hub_open','tool_start','tool_complete','result_link_copy'] as const;
export type ToolEvent = typeof TOOL_EVENTS[number];
export type ToolMarket = 'global'|'kr-seoul'|'sg-singapore'|'ae-dubai'|'jp-tokyo';
export type ToolSurface = 'tools-hub'|'standalone-tool'|'property-detail'|'check-result';
export type ToolId = 'tools-hub'|'passport'|'single-quote'|'offer-compare'|'rent-check'|'property-scenario'|'singapore-check'|'dubai-check'|'tokyo-budget';
export type ToolDimensions = Readonly<{market:ToolMarket;surface:ToolSurface;tool:ToolId}>;
export function createToolEvent(event: ToolEvent,input: ToolDimensions & Readonly<Record<string,unknown>>) {
 if(!TOOL_EVENTS.includes(event) || !['global','kr-seoul','sg-singapore','ae-dubai','jp-tokyo'].includes(input.market)
 || !['tools-hub','standalone-tool','property-detail','check-result'].includes(input.surface)
 || !['tools-hub','passport','single-quote','offer-compare','rent-check','property-scenario','singapore-check','dubai-check','tokyo-budget'].includes(input.tool)) throw new TypeError('Invalid tool event');
 return Object.freeze({event,market:input.market,surface:input.surface,tool:input.tool});
}
