import 'server-only';

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { PASSPORT_FX, type PassportFxSnapshot } from './fx';

const PROVIDER_URL = 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW,SGD,USD,JPY';
const DAY_MS = 86_400_000;
const MAX_RESPONSE_BYTES = 16_384;

export function parsePassportFxResponse(body: unknown, checkedAt: Date): PassportFxSnapshot {
  if (typeof body !== 'object' || body === null || Array.isArray(body)
    || !Number.isFinite(checkedAt.getTime())) throw new TypeError('passport_fx_invalid');
  const row = body as Record<string, unknown>;
  const rates = row.rates as Record<string, unknown> | undefined;
  const date = typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
    ? new Date(`${row.date}T00:00:00Z`) : new Date(NaN);
  if (row.base !== 'EUR' || row.amount !== 1
    || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== row.date
    || date.getTime() > checkedAt.getTime() || checkedAt.getTime() - date.getTime() > 7 * DAY_MS
    || row.date < PASSPORT_FX.asOf
    || typeof rates !== 'object' || rates === null || Array.isArray(rates)
    || !['KRW', 'SGD', 'USD', 'JPY'].every(code => typeof rates[code] === 'number'
      && Number.isFinite(rates[code]) && rates[code] > 0 && rates[code] < 10_000_000)) {
    throw new TypeError('passport_fx_invalid');
  }
  return Object.freeze({
    asOf: row.date as string, checkedAt: checkedAt.toISOString(),
    eurKrw: rates.KRW as number, eurSgd: rates.SGD as number, eurUsd: rates.USD as number, eurJpy: rates.JPY as number,
    usdAed: PASSPORT_FX.usdAed,
    source: 'Frankfurter; AED uses the CBUAE USD peg (1 USD = 3.6725 AED)',
    availability: 'reference',
  });
}

export async function fetchPassportFxSnapshot(dependencies: Readonly<{ fetchResponse?: typeof fetch; now?: () => Date }> = {}): Promise<PassportFxSnapshot> {
  const response = await (dependencies.fetchResponse ?? fetch)(PROVIDER_URL, {
    headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'error',
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok || response.body === null) throw new Error('passport_fx_unavailable');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = '';
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('passport_fx_response_too_large');
      }
      body += decoder.decode(part.value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  return parsePassportFxResponse(JSON.parse(body), (dependencies.now ?? (() => new Date()))());
}

export function createPassportFxLoader(dependencies: Readonly<{ readSnapshot: () => Promise<PassportFxSnapshot>; now?: () => Date }>): () => Promise<PassportFxSnapshot> {
  let lastGood = PASSPORT_FX;
  return async () => {
    try {
      const snapshot = await dependencies.readSnapshot();
      if (snapshot.asOf < lastGood.asOf) throw new Error('passport_fx_older_snapshot');
      lastGood = snapshot;
      const now = (dependencies.now ?? (() => new Date()))().getTime();
      const stale = snapshot.checkedAt === null || now - Date.parse(snapshot.checkedAt) > DAY_MS
        || now - Date.parse(`${snapshot.asOf}T00:00:00Z`) > 7 * DAY_MS;
      return stale ? Object.freeze({ ...snapshot, availability: 'stale' as const }) : snapshot;
    } catch {
      return lastGood.checkedAt === null ? PASSPORT_FX
        : Object.freeze({ ...lastGood, availability: 'stale' as const });
    }
  };
}

// This application does not enable Cache Components. Its existing Next Data
// Cache retains the prior result when revalidation throws (including validation
// failures). Never catch inside this callback and cache a fallback as success.
const readCachedSnapshot = unstable_cache(
  () => fetchPassportFxSnapshot(), ['signedprice-passport-fx-v2-jpy'], { revalidate: 86_400 },
);

export const loadPassportFx = cache(createPassportFxLoader({ readSnapshot: readCachedSnapshot }));
