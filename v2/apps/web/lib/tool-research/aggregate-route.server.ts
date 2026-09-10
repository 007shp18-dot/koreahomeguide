import { RESEARCH_TOOL_IDS } from './contract';

type Counter = (tool: string, market: string) => Promise<void>;
const markets = ['global', 'kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo'];

export function createToolUsageHandler(count: Counter) {
  return async (request: Request): Promise<Response> => {
    const reply = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
    if (request.headers.get('sec-gpc') === '1' || request.headers.get('dnt') === '1') return reply(204);
    if (request.headers.get('origin') !== new URL(request.url).origin) return reply(403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415);
    if (Number(request.headers.get('content-length') ?? 0) > 256) return reply(413);
    try {
      // Streaming limit also bounds chunked requests, without retaining request metadata.
      const reader = request.body?.getReader();
      if (!reader) return reply(400);
      let body = ''; let bytes = 0;
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 256) { await reader.cancel(); return reply(413); }
        body += decoder.decode(value, { stream: true });
      }
      const input: unknown = JSON.parse(body + decoder.decode());
      if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400);
      const fields = input as Record<string, unknown>;
      if (Object.keys(fields).sort().join(',') !== 'market,tool'
        || !RESEARCH_TOOL_IDS.some((tool) => tool === fields.tool)
        || !markets.some((market) => market === fields.market)) return reply(400);
      await count(fields.tool as string, fields.market as string);
      return reply(204);
    } catch { return reply(503); }
  };
}
