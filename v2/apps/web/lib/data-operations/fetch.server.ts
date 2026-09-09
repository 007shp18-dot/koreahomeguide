import 'server-only';
import { createHash } from 'node:crypto';
import { COLLECTION_SOURCES, type CollectionSource } from './registry';
export const MAX_SOURCE_BYTES = 2_000_000;
export class CollectionError extends Error { constructor(public code: string) { super(code); } }
export function collectionFailureCode(error: unknown): string {
  if (error instanceof CollectionError) return error.code;
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return 'fetch_timeout';
  const cause = error instanceof Error ? error.cause : null;
  const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
  if (['ENOTFOUND', 'EAI_AGAIN'].includes(code)) return 'dns_failure';
  if (['CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT'].includes(code)) return 'tls_failure';
  if (['ECONNRESET', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)) return 'connection_failure';
  return 'transport_or_storage_failure';
}
export async function fetchSource(source: CollectionSource, fetcher: typeof fetch = fetch) {
  const registered = COLLECTION_SOURCES.find((item) => item.id === source.id);
  if (!registered || registered.mode !== 'page-monitor' || registered.url !== source.url) throw new CollectionError('source_not_allowed');
  // Redirects are rejected, including same-host redirects: a reviewed destination is required.
  const response = await fetcher(registered.url, { redirect: 'manual', signal: AbortSignal.timeout(15_000), cache: 'no-store', headers: { 'User-Agent': 'SignedPrice-SourceMonitor/1.0', Accept: 'text/html,application/json,text/plain' } });
  if (!response.ok) throw new CollectionError(`http_${response.status}`);
  const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (!['text/html', 'application/json', 'text/plain'].includes(contentType)) throw new CollectionError('unsupported_content_type');
  if (Number(response.headers.get('content-length')) > MAX_SOURCE_BYTES) throw new CollectionError('response_too_large');
  if (!response.body) throw new CollectionError('empty_response');
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) { const item = await reader.read(); if (item.done) break; bytes += item.value.byteLength; if (bytes > MAX_SOURCE_BYTES) throw new CollectionError('response_too_large'); chunks.push(item.value); }
  } finally { await reader.cancel(); }
  const content = Buffer.concat(chunks).toString('utf8');
  if (!content.trim() || bytes < 100) throw new CollectionError('empty_or_truncated_response');
  // Ignore executable/style markup and whitespace noise for page-change identity; keep original internally.
  const normalized = contentType === 'text/html' ? content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : content.trim();
  if (!normalized) throw new CollectionError('empty_content');
  return { content, contentType, bytes, hash: createHash('sha256').update(normalized).digest('hex') };
}
