import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createPoolHandlers, createSessionHandlers } from '../lib/evidence-pool/handlers.server';
import { issueSession, SESSION_COOKIE } from '../lib/evidence-pool/auth.server';
const secret = 'test-only-operator-secret-at-least-32-chars';
const url = 'https://www.signedprice.com/api/internal/evidence-pool/';
function req(payload: unknown, origin = 'https://www.signedprice.com') {
  return new Request(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: `${SESSION_COOKIE}=${issueSession(secret)}` }, body: JSON.stringify(payload) });
}
describe('evidence pool route boundaries', () => {
  it('rejects unauthenticated reads before constructing a repository', async () => {
    const repository = vi.fn(() => { throw new Error('must not run'); });
    const response = await createPoolHandlers(repository, () => secret).GET(new Request(url));
    expect(response.status).toBe(401); expect(repository).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('rejects cross-origin writes and unknown input before persistence', async () => {
    const repository = vi.fn(() => { throw new Error('must not run'); });
    const api = createPoolHandlers(repository, () => secret);
    expect((await api.POST(req({}, 'https://evil.example'))).status).toBe(403);
    expect((await api.POST(req({ action: 'publish-all' }))).status).toBe(400);
    expect(repository).not.toHaveBeenCalled();
  });
  it('does not disclose storage failures', async () => {
    const response = await createPoolHandlers(() => { throw new Error('postgres://secret@host'); }, () => secret).GET(new Request(url, { headers: { Cookie: `${SESSION_COOKIE}=${issueSession(secret)}` } }));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('secret@host');
  });
  it('rejects oversized bodies and invalid list filters before storage', async () => {
    const repository = vi.fn(() => { throw new Error('must not run'); });
    const handlers = createPoolHandlers(repository, () => secret);
    expect((await handlers.POST(req({ padding: '가'.repeat(6000) }))).status).toBe(413);
    expect((await handlers.GET(new Request(`${url}?page=-1`, { headers: { Cookie: `${SESSION_COOKIE}=${issueSession(secret)}` } }))).status).toBe(400);
    expect(repository).not.toHaveBeenCalled();
  });
  it('sends only a parsed command and a server-derived session actor to storage', async () => {
    let received: unknown;
    let actor = '';
    const handlers = createPoolHandlers(() => ({
      list: async () => { throw new Error('unexpected list'); },
      history: async () => [],
      mutate: async (command, operator) => { received = command; actor = operator; return { id: 'result', version: 1 }; },
    }), () => secret);
    const command = { action: 'create-source', input: { name: 'DLD', url: 'https://example.com', kind: 'official' } };
    const response = await handlers.POST(req(command));
    expect(response.status).toBe(200); expect(received).toEqual(command); expect(actor).toMatch(/^operator-[a-f0-9]{12}$/);
    expect(await response.json()).toEqual({ id: 'result', version: 1 });
  });
  it('issues a protected cookie only after a correct login', async () => {
    const api = createSessionHandlers(() => secret);
    expect((await api.POST(req({ secret: 'wrong' }))).status).toBe(401);
    const response = await api.POST(req({ secret }));
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Strict; Max-Age=28800; Secure/);
    expect(await response.text()).not.toContain(secret);
    expect((await api.DELETE(req({}))).headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
