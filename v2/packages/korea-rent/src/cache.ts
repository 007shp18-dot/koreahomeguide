import {
  isDerivedCacheEntry,
  isSourceManifest,
  isSourcePage,
  type DerivedRentCheckCacheEntry,
  type DerivedRentCheckCachePayload,
  type SourceManifestEntry,
  type SourcePageEntry,
} from './cache-validation';
import type { KoreaRentRecord, RentCheckQuote, SourceHousingType } from './input';
import { MolitSourceError, type MolitRentalMonth } from './xml';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  RENT_CHECK_METHODOLOGY_CACHE_VERSION,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
  SOURCE_MANIFEST_CACHE_KIND,
  SOURCE_PAGE_CACHE_KIND,
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

export function sourceCacheNamespace(input: {
  readonly sourceHousingType: SourceHousingType;
  readonly lawdCd: string;
  readonly dealYmd: string;
  readonly pageSize: number;
}): string {
  return [
    'kr-seoul-rent-check:source',
    'market=kr-seoul',
    `endpoint=${MOLIT_ENDPOINT_VERSION}`,
    `type=${input.sourceHousingType}`,
    `lawd=${input.lawdCd}`,
    `month=${input.dealYmd}`,
    `pageSize=${input.pageSize}`,
    `parser=${MOLIT_PARSER_VERSION}`,
    `rights=${MOLIT_RIGHTS_POLICY_ID}`,
  ].join(':');
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

async function sourceGeneration(
  month: MolitRentalMonth,
  deadlineSignal?: AbortSignal,
): Promise<string> {
  const content = JSON.stringify({
    sourceHousingType: month.sourceHousingType,
    lawdCd: month.lawdCd,
    dealYmd: month.dealYmd,
    pageSize: month.pageSize,
    totalCount: month.totalCount,
    pages: month.pages,
    records: month.records,
    retrievedAt: month.retrievedAt,
  });
  const digest = await withDeadline(
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(content)),
    deadlineSignal,
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
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

function reconstructRecords(
  chunks: readonly SourcePageEntry[],
): readonly KoreaRentRecord[] | null {
  const records: KoreaRentRecord[] = [];
  const stableRecords = new Map<string, string>();
  const priorAnonymousRecords = new Set<string>();
  for (const chunk of chunks) {
    const anonymousOnPage: string[] = [];
    for (let index = 0; index < chunk.rows.length; index += 1) {
      const record = chunk.rows[index]!;
      const fingerprintDigest = chunk.rowFingerprintDigests[index]!;
      if (record.sourceRecordId !== undefined) {
        const prior = stableRecords.get(record.sourceRecordId);
        if (prior !== undefined) {
          if (prior !== fingerprintDigest) return null;
          continue;
        }
        stableRecords.set(record.sourceRecordId, fingerprintDigest);
      } else {
        if (priorAnonymousRecords.has(fingerprintDigest)) return null;
        anonymousOnPage.push(fingerprintDigest);
      }
      records.push(record);
    }
    anonymousOnPage.forEach((digest) => priorAnonymousRecords.add(digest));
  }
  return Object.freeze(records);
}

export async function readSourceMonthCache(
  cache: RuntimeCachePort,
  input: {
    readonly sourceHousingType: SourceHousingType;
    readonly lawdCd: string;
    readonly dealYmd: string;
    readonly pageSize: number;
  },
  deadlineSignal?: AbortSignal,
): Promise<MolitRentalMonth | null> {
  const namespace = sourceCacheNamespace(input);
  const manifest = await safeGet<unknown>(cache, `${namespace}:manifest`, deadlineSignal);
  if (manifest === null) return null;
  if (!isSourceManifest(manifest, namespace)) {
    return invalidateCorruptCache(cache, deadlineSignal);
  }
  if (
    manifest.sourceHousingType !== input.sourceHousingType ||
    manifest.lawdCd !== input.lawdCd ||
    manifest.dealYmd !== input.dealYmd ||
    manifest.pageSize !== input.pageSize
  ) {
    return invalidateCorruptCache(cache, deadlineSignal);
  }

  const chunks: SourcePageEntry[] = [];
  for (let index = 0; index < manifest.chunkKeys.length; index += 1) {
    const chunk = await safeGet<unknown>(cache, manifest.chunkKeys[index]!, deadlineSignal);
    if (!isSourcePage(chunk, index + 1, manifest)) {
      return invalidateCorruptCache(cache, deadlineSignal);
    }
    chunks.push(chunk);
  }
  const records = reconstructRecords(chunks);
  if (records === null) return invalidateCorruptCache(cache, deadlineSignal);
  const month: MolitRentalMonth = Object.freeze({
    sourceHousingType: manifest.sourceHousingType,
    lawdCd: manifest.lawdCd,
    dealYmd: manifest.dealYmd,
    pageSize: manifest.pageSize,
    totalCount: manifest.totalCount,
    pages: Object.freeze(chunks.map((chunk) => Object.freeze({
      pageNo: chunk.pageNo,
      rows: chunk.rows,
      rowFingerprintDigests: chunk.rowFingerprintDigests,
    }))),
    records,
    retrievedAt: manifest.retrievedAt,
  });
  if (await sourceGeneration(month, deadlineSignal) !== manifest.generation) {
    return invalidateCorruptCache(cache, deadlineSignal);
  }
  return month;
}

export async function writeSourceMonthCache(
  cache: RuntimeCachePort,
  month: MolitRentalMonth,
  beforeWrite?: () => void,
  deadlineSignal?: AbortSignal,
): Promise<void> {
  const namespace = sourceCacheNamespace(month);
  const generation = await sourceGeneration(month, deadlineSignal);
  const chunkKeys = month.pages.map(
    (page) => `${namespace}:generation=${generation}:page=${page.pageNo}`,
  );
  for (let index = 0; index < month.pages.length; index += 1) {
    const page = month.pages[index]!;
    const entry: SourcePageEntry = Object.freeze({
      kind: SOURCE_PAGE_CACHE_KIND,
      parserVersion: MOLIT_PARSER_VERSION,
      rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
      pageNo: page.pageNo,
      rows: page.rows,
      rowFingerprintDigests: page.rowFingerprintDigests,
    });
    beforeWrite?.();
    try {
      await withDeadline(
        Promise.resolve().then(() => cache.set(chunkKeys[index]!, entry, {
          ttlSeconds: SOURCE_CACHE_TTL_SECONDS,
          tags: RENT_CHECK_CACHE_TAGS,
        })),
        deadlineSignal,
      );
    } catch (error) {
      if (isDeadlineError(error)) throw error;
      return;
    }
  }

  const manifest: SourceManifestEntry = Object.freeze({
    kind: SOURCE_MANIFEST_CACHE_KIND,
    parserVersion: MOLIT_PARSER_VERSION,
    rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
    sourceHousingType: month.sourceHousingType,
    lawdCd: month.lawdCd,
    dealYmd: month.dealYmd,
    pageSize: month.pageSize,
    totalCount: month.totalCount,
    retrievedAt: month.retrievedAt,
    generation,
    chunkKeys: Object.freeze(chunkKeys),
  });
  beforeWrite?.();
  try {
    await withDeadline(
      Promise.resolve().then(() => cache.set(`${namespace}:manifest`, manifest, {
        ttlSeconds: SOURCE_CACHE_TTL_SECONDS,
        tags: RENT_CHECK_CACHE_TAGS,
      })),
      deadlineSignal,
    );
  } catch (error) {
    if (isDeadlineError(error)) throw error;
    // A missing manifest makes any partially written chunks unreachable.
  }
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
