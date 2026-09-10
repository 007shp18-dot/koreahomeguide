import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({ publicContentDatabase: () => ({ query }) }));
import index from '../data/singapore-explore-index.json';
import { loadPublishedSingaporeExplore, parseSingaporeExplorePublication, SINGAPORE_EXPLORE_PUBLICATION_VERSION } from '../lib/singapore/explore-publication.server';
const releaseId = 'sg-publication:test';
const serialized = JSON.stringify({ version: SINGAPORE_EXPLORE_PUBLICATION_VERSION, releaseId, snapshotDigest: 'a'.repeat(64), model: index.model });
const digest = createHash('sha256').update(serialized).digest('hex');
const row = { release_id: releaseId, explore_json: serialized, explore_sha256: digest, rights_allowed: true };
beforeEach(() => { query.mockReset(); vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'true'); vi.stubEnv('SIGNEDPRICE_SINGAPORE_PUBLICATION_DISABLED', 'false'); });
describe('published Singapore compact index', () => {
 it('reads the approved summary without requesting the transaction bundle', async () => {
  query.mockResolvedValue([row]);
  const result = await loadPublishedSingaporeExplore();
  expect(result.status).toBe('ready');
  if (result.status === 'ready' && result.model.status === 'ready') expect(result.model.segments).toHaveLength(3);
  expect(query.mock.calls[0]![0]).not.toContain('payload_gzip_base64');
 });
 it('never serves a cached summary after rights revocation or database failure', async () => {
  query.mockResolvedValueOnce([row]).mockResolvedValueOnce([{ ...row, rights_allowed: false }]).mockRejectedValueOnce(new Error('timeout'));
  expect((await loadPublishedSingaporeExplore()).status).toBe('ready');
  expect((await loadPublishedSingaporeExplore()).status).toBe('unavailable');
  expect((await loadPublishedSingaporeExplore()).status).toBe('unavailable');
 });
 it('distinguishes missing compact data from an absent active release', async () => {
  query.mockResolvedValueOnce([{...row, explore_sha256:null}]).mockResolvedValueOnce([]);
  expect((await loadPublishedSingaporeExplore()).status).toBe('unavailable');
  expect((await loadPublishedSingaporeExplore()).status).toBe('absent');
 });
 it('rejects tampering and summary from a different release', () => {
  expect(() => parseSingaporeExplorePublication(serialized+' ',digest,releaseId)).toThrow('digest');
  expect(() => parseSingaporeExplorePublication(serialized,digest,'sg-publication:other')).toThrow('invalid');
 });
});
