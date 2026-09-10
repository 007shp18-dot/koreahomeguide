import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { fetchSource, MAX_SOURCE_BYTES } from '../lib/data-operations/fetch.server';
import { COLLECTION_SOURCES } from '../lib/data-operations/registry';
import { createCollectionRepository } from '../lib/data-operations/repository.server';
const source = COLLECTION_SOURCES.find((s)=>s.id==='sg-iras-bsd')!;
const html = `<html><body>${'Official rate conditions '.repeat(20)}</body></html>`;
const responder = (body = html) => vi.fn<typeof fetch>().mockResolvedValue(new Response(body,{headers:{'content-type':'text/html'}}));
describe('bounded official source monitoring', () => {
 it('rejects an unregistered destination before network access',async () => {
  const fetcher=responder(); await expect(fetchSource({...source,url:'http://169.254.169.254/latest'},fetcher)).rejects.toThrow('source_not_allowed'); expect(fetcher).not.toHaveBeenCalled();
 });
 it('does not follow redirects or accept oversized/unsupported responses',async () => {
  const fetcher=vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null,{status:302,headers:{location:'http://localhost/'}})).mockResolvedValueOnce(new Response(html,{headers:{'content-type':'text/html','content-length':String(MAX_SOURCE_BYTES+1)}})).mockResolvedValueOnce(new Response(html,{headers:{'content-type':'application/pdf'}}));
  await expect(fetchSource(source,fetcher)).rejects.toThrow('http_302');
  expect(fetcher.mock.calls[0]![1]?.redirect).toBe('manual');
  await expect(fetchSource(source,fetcher)).rejects.toThrow('response_too_large');
  await expect(fetchSource(source,fetcher)).rejects.toThrow('unsupported_content_type');
 });
 it('limits streamed bytes without trusting content length',async () => {
  await expect(fetchSource(source,responder('a'.repeat(MAX_SOURCE_BYTES+1)))).rejects.toThrow('response_too_large');
 });
 it('ignores executable page noise but detects rate changes',async () => {
  const a=await fetchSource(source,responder(html+'<script>nonce=1</script>'));
  const b=await fetchSource(source,responder(html+'<script>nonce=2</script>'));
  const c=await fetchSource(source,responder(html+'Price 40'));
  expect(a.hash).toBe(b.hash);expect(c.hash).not.toBe(a.hash);
 });
 it('does not fetch when another runner holds the lease or source is not due',async () => {
  const query=vi.fn().mockResolvedValue([]); const fetcher=responder();
  const result=await createCollectionRepository({query}).collect(source,false,fetcher);
  expect(result.status).toBe('not_due_or_busy');expect(fetcher).not.toHaveBeenCalled();
 });
 it('retains prior snapshots and completes success only under its lease',async () => {
  const query=vi.fn().mockResolvedValue([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{last_hash:'old',last_bytes:5000}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{id:'run'}]);
  const result=await createCollectionRepository({query}).collect(source,false,responder());
  expect(result).toMatchObject({status:'changed',anomaly:'content_size_drop_over_50_percent'});
  const [sql,values]=query.mock.calls[3]!;expect(sql).toContain('previous_snapshot_id');expect(sql).toContain('lease_until>now()');expect(values[7]).toBe('changed');
  expect(sql).not.toContain('property_pool_evidence');
 });
 it('records only a safe error code and schedules retry on provider failure',async () => {
  const query=vi.fn().mockResolvedValue([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{last_hash:null}]);
  const fetcher=vi.fn<typeof fetch>().mockRejectedValue(new Error('secret=do-not-log'));
  const result=await createCollectionRepository({query}).collect(source,false,fetcher);
  expect(result).toMatchObject({status:'failed',error:'transport_or_storage_failure'});
  expect(JSON.stringify(query.mock.calls)).not.toContain('do-not-log');expect(query.mock.calls.at(-1)?.[0]).toContain("interval '1 hour'");
 });
});
