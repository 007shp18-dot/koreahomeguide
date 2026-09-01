import {
  isSourceManifest,
  isSourcePage,
  type SourceManifestEntry,
  type SourcePageEntry,
} from './cache-validation';
import type { RuntimeCachePort } from './cache';
import type { KoreaRentRecord, SourceHousingType } from './input';
import { MolitSourceError, type MolitRentalMonth } from './xml';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  SOURCE_MANIFEST_CACHE_KIND,
  SOURCE_PAGE_CACHE_KIND,
} from './versions';

export type SourceMonthStorePolicy = Readonly<{
  namespacePrefix: string;
  ttlSeconds: number;
  tags: readonly string[];
  corruptTag: string;
}>;

export type SourceMonthIdentity = Readonly<{
  sourceHousingType: SourceHousingType;
  lawdCd: string;
  dealYmd: string;
  pageSize: number;
}>;

export type SourceMonthStore = Readonly<{
  namespace(input: SourceMonthIdentity): string;
  read(
    cache: RuntimeCachePort,
    input: SourceMonthIdentity,
    signal?: AbortSignal,
  ): Promise<MolitRentalMonth | null>;
  write(
    cache: RuntimeCachePort,
    month: MolitRentalMonth,
    beforeWrite?: () => void,
    signal?: AbortSignal,
  ): Promise<void>;
}>;

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
  signal?: AbortSignal,
): Promise<T | null> {
  try {
    return await withDeadline(Promise.resolve().then(() => cache.get<T>(key)), signal);
  } catch (error) {
    if (isDeadlineError(error)) throw error;
    return null;
  }
}

async function generation(month: MolitRentalMonth, signal?: AbortSignal): Promise<string> {
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
    signal,
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function reconstructRecords(chunks: readonly SourcePageEntry[]): readonly KoreaRentRecord[] | null {
  const records: KoreaRentRecord[] = [];
  const stableRecords = new Map<string, string>();
  for (const chunk of chunks) {
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
        // Redacted contracts can have identical public fingerprints. Preserve
        // their provider row multiplicity when no stable ID is available.
      }
      records.push(record);
    }
  }
  return Object.freeze(records);
}

export function createSourceMonthStore(policy: SourceMonthStorePolicy): SourceMonthStore {
  const namespace = (input: SourceMonthIdentity): string => [
    policy.namespacePrefix,
    'market=kr-seoul',
    `endpoint=${MOLIT_ENDPOINT_VERSION}`,
    `type=${input.sourceHousingType}`,
    `lawd=${input.lawdCd}`,
    `month=${input.dealYmd}`,
    `pageSize=${input.pageSize}`,
    `parser=${MOLIT_PARSER_VERSION}`,
    `rights=${MOLIT_RIGHTS_POLICY_ID}`,
  ].join(':');

  const invalidate = async (
    cache: RuntimeCachePort,
    signal?: AbortSignal,
  ): Promise<null> => {
    try {
      await withDeadline(
        Promise.resolve().then(() => cache.hardDeleteByTag(policy.corruptTag)),
        signal,
      );
    } catch (error) {
      if (isDeadlineError(error)) throw error;
    }
    return null;
  };

  const read: SourceMonthStore['read'] = async (cache, input, signal) => {
    const keyPrefix = namespace(input);
    const manifest = await safeGet<unknown>(cache, `${keyPrefix}:manifest`, signal);
    if (manifest === null) return null;
    if (
      !isSourceManifest(manifest, keyPrefix) ||
      manifest.sourceHousingType !== input.sourceHousingType ||
      manifest.lawdCd !== input.lawdCd ||
      manifest.dealYmd !== input.dealYmd ||
      manifest.pageSize !== input.pageSize
    ) {
      return invalidate(cache, signal);
    }

    const chunks: SourcePageEntry[] = [];
    for (let index = 0; index < manifest.chunkKeys.length; index += 1) {
      const chunk = await safeGet<unknown>(cache, manifest.chunkKeys[index]!, signal);
      if (!isSourcePage(chunk, index + 1, manifest)) return invalidate(cache, signal);
      chunks.push(chunk);
    }
    const records = reconstructRecords(chunks);
    if (records === null) return invalidate(cache, signal);
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
    if (await generation(month, signal) !== manifest.generation) {
      return invalidate(cache, signal);
    }
    return month;
  };

  const write: SourceMonthStore['write'] = async (
    cache,
    month,
    beforeWrite,
    signal,
  ) => {
    const keyPrefix = namespace(month);
    const sourceGeneration = await generation(month, signal);
    const chunkKeys = month.pages.map(
      (page) => `${keyPrefix}:generation=${sourceGeneration}:page=${page.pageNo}`,
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
            ttlSeconds: policy.ttlSeconds,
            tags: policy.tags,
          })),
          signal,
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
      generation: sourceGeneration,
      chunkKeys: Object.freeze(chunkKeys),
    });
    beforeWrite?.();
    try {
      await withDeadline(
        Promise.resolve().then(() => cache.set(`${keyPrefix}:manifest`, manifest, {
          ttlSeconds: policy.ttlSeconds,
          tags: policy.tags,
        })),
        signal,
      );
    } catch (error) {
      if (isDeadlineError(error)) throw error;
    }
  };

  return Object.freeze({ namespace, read, write });
}
