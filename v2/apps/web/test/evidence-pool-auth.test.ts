import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { issueSession, verifySession, authorized, sameOrigin, SESSION_COOKIE } from '../lib/evidence-pool/auth.server';

const secret = 'test-only-secret-with-at-least-32-characters';
const now = 1800000000000;
describe('internal evidence authentication', () => {
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
