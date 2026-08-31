import 'server-only';

import { createHmac, randomBytes } from 'node:crypto';

export const COMMUNITY_RESPONDENT_COOKIE = 'signedprice_community' as const;

type RandomBytes = (size: number) => Uint8Array;

export type CommunityRespondentIdentity = Readonly<{
  cookieValue: string;
  respondentKey: string;
  setCookie: string | null;
}>;

export class CommunityIdentityUnavailableError extends Error {
  readonly code = 'community_identity_unavailable' as const;

  constructor() {
    super('Community identity is unavailable.');
    this.name = 'CommunityIdentityUnavailableError';
  }
}

const OPAQUE_COOKIE = /^[0-9a-f]{64}$/;

function unavailable(): never {
  throw new CommunityIdentityUnavailableError();
}

function assertSecret(secret: string): void {
  if (typeof secret !== 'string' || secret.length < 32 || secret.length > 512) unavailable();
}

export function createOpaqueRespondentCookie(
  random: RandomBytes = (size) => randomBytes(size),
): string {
  try {
    const bytes = random(32);
    if (bytes.byteLength !== 32) unavailable();
    return Buffer.from(bytes).toString('hex');
  } catch {
    unavailable();
  }
}

function derive(value: string, secret: string, namespace: string): string {
  try {
    assertSecret(secret);
    if (value.length === 0 || value.length > 512) unavailable();
    return createHmac('sha256', secret).update(`${namespace}\0${value}`).digest('hex');
  } catch {
    unavailable();
  }
}

export function deriveRespondentKey(cookieValue: string, secret: string): string {
  if (!OPAQUE_COOKIE.test(cookieValue)) unavailable();
  return derive(cookieValue, secret, 'respondent-v1');
}

export function deriveNetworkKey(networkAddress: string, secret: string): string {
  if (
    typeof networkAddress !== 'string' ||
    networkAddress.length === 0 ||
    networkAddress.length > 128 ||
    /[\u0000-\u001f\u007f]/.test(networkAddress)
  ) {
    unavailable();
  }
  return derive(networkAddress, secret, 'network-v1');
}

export function serializeRespondentCookie(cookieValue: string): string {
  if (!OPAQUE_COOKIE.test(cookieValue)) unavailable();
  return `${COMMUNITY_RESPONDENT_COOKIE}=${cookieValue}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;
}

export function resolveRespondentIdentity(
  existingCookie: string | null,
  secret: string,
  random?: RandomBytes,
): CommunityRespondentIdentity {
  try {
    assertSecret(secret);
    const isExisting = existingCookie !== null && OPAQUE_COOKIE.test(existingCookie);
    const cookieValue = isExisting
      ? existingCookie
      : createOpaqueRespondentCookie(random);
    return Object.freeze({
      cookieValue,
      respondentKey: deriveRespondentKey(cookieValue, secret),
      setCookie: isExisting ? null : serializeRespondentCookie(cookieValue),
    });
  } catch {
    unavailable();
  }
}
