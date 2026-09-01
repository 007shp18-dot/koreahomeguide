import {
  isDerivedCacheEntry,
  type DerivedRentCheckCacheEntry,
  type DerivedRentCheckCachePayload,
} from './cache-validation';
import type { RentCheckQuote } from './input';
import { createSourceMonthStore, type SourceMonthIdentity } from './source-month-store';
import { MolitSourceError, type MolitRentalMonth } from './xml';
import {
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  RENT_CHECK_METHODOLOGY_CACHE_VERSION,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
} from './versions';

export type {
  DerivedRentCheckCacheEntry,
  DerivedRentCheckCachePayload,
} from './cache-validation';

export type RuntimeCacheEntryOptions = {
  readonly ttlSeconds: number;
  readonly tags: readonly string[];
};

/** Portable cache contract; the web package owns the Vercel implementation. */
export interface RuntimeCachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options: RuntimeCacheEntryOptions): Promise<void>;
  /** Irreversibly removes every entry carrying the supplied stable tag. */
  hardDeleteByTag(tag: string): Promise<void>;
}

export const SOURCE_CACHE_TTL_SECONDS = 86_400 as const;
export const DERIVED_FRESH_SECONDS = 15 * 60;
export const DERIVED_STALE_SECONDS = 60 * 60;
export const STABLE_RENT_CHECK_TAG = 'kr-seoul-rent-check' as const;

export const RENT_CHECK_CACHE_TAGS = Object.freeze([
  STABLE_RENT_CHECK_TAG,
  'market:kr-seoul',
  `parser:${MOLIT_PARSER_VERSION}`,
  `methodology:${RENT_CHECK_METHODOLOGY_POLICY_ID}:${RENT_CHECK_METHODOLOGY_VERSION}`,
  `rights:${MOLIT_RIGHTS_POLICY_ID}`,
] as const);

const RENT_CHECK_SOURCE_STORE = createSourceMonthStore({
  namespacePrefix: 'kr-seoul-rent-check:source',
  ttlSeconds: SOURCE_CACHE_TTL_SECONDS,
  tags: RENT_CHECK_CACHE_TAGS,
  corruptTag: STABLE_RENT_CHECK_TAG,
});

export function sourceCacheNamespace(input: SourceMonthIdentity): string {
  return RENT_CHECK_SOURCE_STORE.namespace(input);
}

export function derivedCacheKey(quote: RentCheckQuote, coverageNamespace: string): string {
  return [
    'kr-seoul-rent-check:derived',
    `lawd=${quote.lawdCd}`,
    `requested=${quote.requestedHousingType}`,
    `source=${quote.sourceHousingType}`,
    `deposit=${quote.depositWon}`,
    `rent=${quote.monthlyRentWon}`,
    `area=${String(quote.areaSqm)}`,
    `coverage=${encodeURIComponent(coverageNamespace)}`,
    `parser=${MOLIT_PARSER_VERSION}`,
    `methodology=${RENT_CHECK_METHODOLOGY_POLICY_ID}`,
    `methodologyVersion=${RENT_CHECK_METHODOLOGY_VERSION}`,
    `methodologyCacheVersion=${RENT_CHECK_METHODOLOGY_CACHE_VERSION}`,
    `rights=${MOLIT_RIGHTS_POLICY_ID}`,
  ].join(':');
}

function deadlineError(): MolitSourceError {
  return new MolitSourceError('source_timeout');
}

function withDeadline<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal === undefined) return operation;
  if (signal.aborted) {
    void operation.catch(() => undefined);
    return Promise.reject(deadlineError());
  }
  return new Promise<T>((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort);
      reject(deadlineError());
    };
    signal.addEventListener('abort', abort, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}

function isDeadlineError(error: unknown): boolean {
  return error instanceof MolitSourceError && error.code === 'source_timeout';
}

async function safeGet<T>(
  cache: RuntimeCachePort,
  key: string,
  deadlineSignal?: AbortSignal,
): Promise<T | null> {
  try {
    return await withDeadline(Promise.resolve().then(() => cache.get<T>(key)), deadlineSignal);
  } catch (error) {
    if (isDeadlineError(error)) throw error;
    return null;
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(',')}}`;
}

async function derivedContentDigest(
  payload: DerivedRentCheckCachePayload,
  deadlineSignal?: AbortSignal,
): Promise<string> {
  const digest = await withDeadline(
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(payload))),
    deadlineSignal,
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

async function invalidateCorruptCache(
  cache: RuntimeCachePort,
  deadlineSignal?: AbortSignal,
): Promise<null> {
  try {
    await withDeadline(
      Promise.resolve().then(() => cache.hardDeleteByTag(STABLE_RENT_CHECK_TAG)),
      deadlineSignal,
    );
  } catch (error) {
    if (isDeadlineError(error)) throw error;
    // A corrupt value is never served even when the portable cache cannot delete it.
  }
  return null;
}

export async function readSourceMonthCache(
  cache: RuntimeCachePort,
  input: SourceMonthIdentity,
  deadlineSignal?: AbortSignal,
): Promise<MolitRentalMonth | null> {
  return RENT_CHECK_SOURCE_STORE.read(cache, input, deadlineSignal);
}

export async function writeSourceMonthCache(
  cache: RuntimeCachePort,
  month: MolitRentalMonth,
  beforeWrite?: () => void,
  deadlineSignal?: AbortSignal,
): Promise<void> {
  return RENT_CHECK_SOURCE_STORE.write(cache, month, beforeWrite, deadlineSignal);
}

export async function readDerivedCache(
  cache: RuntimeCachePort,
  key: string,
  coverageNamespace: string,
  quote: RentCheckQuote,
  deadlineSignal?: AbortSignal,
): Promise<DerivedRentCheckCacheEntry | null> {
  const value = await safeGet<unknown>(cache, key, deadlineSignal);
  if (value === null) return null;
  if (!isDerivedCacheEntry(value, quote, coverageNamespace)) {
    return invalidateCorruptCache(cache, deadlineSignal);
  }
  const { contentDigest, ...payload } = value;
  if (await derivedContentDigest(payload, deadlineSignal) !== contentDigest) {
    return invalidateCorruptCache(cache, deadlineSignal);
  }
  return value;
}

export async function writeDerivedCache(
  cache: RuntimeCachePort,
  key: string,
  payload: DerivedRentCheckCachePayload,
  deadlineSignal?: AbortSignal,
): Promise<void> {
  const entry: DerivedRentCheckCacheEntry = Object.freeze({
    ...payload,
    contentDigest: await derivedContentDigest(payload, deadlineSignal),
  });
  try {
    await withDeadline(
      Promise.resolve().then(() => cache.set(key, entry, {
        ttlSeconds: DERIVED_STALE_SECONDS,
        tags: RENT_CHECK_CACHE_TAGS,
      })),
      deadlineSignal,
    );
  } catch (error) {
    if (isDeadlineError(error)) throw error;
    // Cache availability never changes a verified provider result into an error.
  }
}
