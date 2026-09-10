import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  COMMUNITY_RESPONDENT_COOKIE,
  createOpaqueRespondentCookie,
  deriveNetworkKey,
  deriveRespondentKey,
  resolveRespondentIdentity,
  serializeRespondentCookie,
} from '../lib/community/community-identity.server';

const secretA = 'a'.repeat(64);
const secretB = 'b'.repeat(64);

describe('Community pseudonymous identity', () => {
  it('creates a 32-byte opaque cookie without embedded identity', () => {
    const value = createOpaqueRespondentCookie(() => Buffer.alloc(32, 0xab));

    expect(value).toMatch(/^[0-9a-f]{64}$/);
    expect(value).toBe('ab'.repeat(32));
  });

  it('derives a deterministic key within one secret rotation', () => {
    const cookie = 'cd'.repeat(32);
    const first = deriveRespondentKey(cookie, secretA);

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(deriveRespondentKey(cookie, secretA)).toBe(first);
    expect(deriveRespondentKey(cookie, secretB)).not.toBe(first);
    expect(first).not.toContain(cookie);
  });

  it('serializes only a secure first-party HttpOnly cookie', () => {
    const value = 'ef'.repeat(32);
    const header = serializeRespondentCookie(value);

    expect(header).toContain(`${COMMUNITY_RESPONDENT_COOKIE}=${value}`);
    expect(header).toContain('Path=/');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Lax');
    expect(header).not.toMatch(/Domain=|SameSite=None/i);
  });

  it('reuses a valid cookie and replaces an invalid value safely', () => {
    const valid = '12'.repeat(32);
    expect(resolveRespondentIdentity(valid, secretA).setCookie).toBeNull();

    const resolved = resolveRespondentIdentity('raw-user-email@example.com', secretA, () => (
      Buffer.alloc(32, 0x34)
    ));
    expect(resolved.cookieValue).toBe('34'.repeat(32));
    expect(resolved.setCookie).toContain('HttpOnly');
    expect(JSON.stringify(resolved)).not.toContain('raw-user-email@example.com');
  });

  it('derives a separate ephemeral network key without retaining the address', () => {
    const key = deriveNetworkKey('203.0.113.4', secretB);

    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain('203.0.113.4');
  });

  it.each(['short', '', 'not-hex'.repeat(20)])(
    'redacts invalid values from identity errors: %s',
    (value) => {
      expect(() => deriveRespondentKey(value, secretA)).toThrow(
        'Community identity is unavailable.',
      );
      try {
        deriveRespondentKey(value, secretA);
      } catch (error) {
        if (value.length > 0) expect(String(error)).not.toContain(value);
      }
    },
  );
});
