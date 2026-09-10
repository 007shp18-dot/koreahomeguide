import 'server-only';
export function json(value: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', ...extra } });
}
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('unsupported_media_type');
  const reader = request.body?.getReader(); if (!reader) throw new Error('invalid_payload');
  let length = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      length += next.value.byteLength;
      if (length > 16384) { await reader.cancel(); throw new Error('payload_too_large'); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('invalid_payload'); }
}
export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const known: Record<string, number> = { invalid_payload: 400, unsupported_media_type: 415, payload_too_large: 413, conflict: 409, invalid_source: 422, database_not_configured: 503 };
  return json({ error: Object.hasOwn(known, message) ? message : 'storage_unavailable' }, known[message] ?? 503);
}
