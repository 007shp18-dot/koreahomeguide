import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

export const RESEARCH_OWNER_COOKIE = 'signedprice_tool_research' as const;

const OPAQUE_OWNER = /^[0-9a-f]{64}$/;
type RandomBytes = (size: number) => Uint8Array;

function invalid(): never {
  throw new TypeError('Invalid tool research owner.');
}

export function createResearchOwnerCookie(
  random: RandomBytes = (size) => randomBytes(size),
): string {
  try {
    const bytes = random(32);
    if (bytes.byteLength !== 32) invalid();
    return Buffer.from(bytes).toString('hex');
  } catch {
    invalid();
  }
}

export function researchOwnerHash(cookieValue: string): string {
  if (!OPAQUE_OWNER.test(cookieValue)) invalid();
  return createHash('sha256')
    .update(`tool-research-owner-v1\0${cookieValue}`)
    .digest('hex');
}

export function serializeResearchOwnerCookie(cookieValue: string): string {
  if (!OPAQUE_OWNER.test(cookieValue)) invalid();
  return `${RESEARCH_OWNER_COOKIE}=${cookieValue}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;
}

export function validResearchOwnerCookie(value: string | null): string | null {
  return value !== null && OPAQUE_OWNER.test(value) ? value : null;
}
