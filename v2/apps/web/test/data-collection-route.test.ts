import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const database=vi.hoisted(() => ({get:vi.fn(() => null)}));
vi.mock('../lib/db/postgres.server', () => ({contentDatabase:database.get}));
import { GET, POST } from '../app/api/internal/data-collection/route';
import { issueSession } from '../lib/evidence-pool/auth.server';
afterEach(() => {vi.unstubAllEnvs();vi.clearAllMocks();});
describe('source collection access', () => {
 it('never treats a missing cron secret as authorization',async () => {
  vi.stubEnv('CRON_SECRET','');vi.stubEnv('EVIDENCE_ADMIN_SECRET','');
  expect((await GET(new Request('https://example.com/api/internal/data-collection',{headers:{authorization:'Bearer undefined'}}))).status).toBe(401);
  expect(database.get).not.toHaveBeenCalled();
 });
 it('allows the configured cron credential but fails closed without a database',async () => {
  vi.stubEnv('CRON_SECRET','test-cron-token');
  expect((await GET(new Request('https://example.com/api/internal/data-collection',{headers:{authorization:'Bearer test-cron-token'}}))).status).toBe(503);
 });
 it('requires a same-origin session for mutation, not just the cron credential',async () => {
  vi.stubEnv('CRON_SECRET','test-cron-token');
  expect((await POST(new Request('https://example.com/api/internal/data-collection',{method:'POST',headers:{authorization:'Bearer test-cron-token'}}))).status).toBe(401);
  const secret='s'.repeat(48);vi.stubEnv('EVIDENCE_ADMIN_SECRET',secret);
  expect((await POST(new Request('https://example.com/api/internal/data-collection',{method:'POST',headers:{cookie:`sp_evidence_session=${issueSession(secret)}`,origin:'https://hostile.example'}}))).status).toBe(403);
  expect(database.get).not.toHaveBeenCalled();
 });
});
