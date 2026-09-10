import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { issueSession, verifySession, authorized, sameOrigin, SESSION_COOKIE } from '../lib/evidence-pool/auth.server';
import { createSessionHandlers } from '../lib/evidence-pool/handlers.server';

const secret = 'test-only-secret-with-at-least-32-characters';
const now = 1800000000000;
describe('internal evidence authentication', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('accepts only the dedicated password and rejects legacy-key sessions', async () => {
    const legacy = 'legacy-content-secret-not-for-evidence-login';
    vi.stubEnv('CONTENT_ADMIN_SECRET', legacy);
    vi.stubEnv('EVIDENCE_ADMIN_SECRET', secret);
    const login = (value: string) => createSessionHandlers().POST(new Request('https://www.signedprice.com/api/internal/evidence-session/', {
      method: 'POST', headers: { Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: value }),
    }));
    expect((await login(legacy)).status).toBe(401);
    const response = await login(secret);
    expect(response.status).toBe(200);
    expect(authorized(new Request('https://www.signedprice.com', { headers: { Cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' } }))).toBe(true);
    expect(authorized(new Request('https://www.signedprice.com', { headers: { Cookie: `${SESSION_COOKIE}=${issueSession(legacy)}` } }))).toBe(false);
    expect(process.env.CONTENT_ADMIN_SECRET).toBe(legacy);
  });
  it.each([undefined, '', 'too-short'])('fails closed when dedicated password is %s even if the legacy key exists', async (value) => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', secret);
    vi.stubEnv('EVIDENCE_ADMIN_SECRET', value);
    const response = await createSessionHandlers().POST(new Request('https://www.signedprice.com/api/internal/evidence-session/', {
      method: 'POST', headers: { Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ secret }),
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'admin_not_configured' });
  });
  it('accepts a signed session but rejects tampering, expiry and secret rotation', () => {
    const token = issueSession(secret, now);
    expect(verifySession(token, secret, now)).toBe(true);
    expect(verifySession(`${token}x`, secret, now)).toBe(false);
    expect(verifySession(token, secret, now + 8 * 3600000)).toBe(false);
    expect(verifySession(token, `${secret}new`, now)).toBe(false);
    expect(verifySession(token, secret, now - 1000)).toBe(false);
  });
  it('fails closed without a strong configured secret', () => {
    expect(() => issueSession('short', now)).toThrow();
    expect(verifySession('', '', now)).toBe(false);
  });
  it('requires a valid cookie and independently enforces origin for mutations', () => {
    const token = issueSession(secret, now);
    const request = new Request('https://www.signedprice.com/api/internal/evidence-pool/', {
      headers: { Cookie: `${SESSION_COOKIE}=${token}`, Origin: 'https://evil.example' },
    });
    expect(authorized(request, secret, now)).toBe(true);
    expect(sameOrigin(request)).toBe(false);
    expect(authorized(new Request(request.url), secret, now)).toBe(false);
    expect(sameOrigin(new Request(request.url, { headers: { Origin: 'https://www.signedprice.com' } }))).toBe(true);
  });
});
