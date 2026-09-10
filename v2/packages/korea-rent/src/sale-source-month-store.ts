import type { RuntimeCachePort } from './cache';
import type { SourceHousingType } from './input';
import type { KoreaSaleRecord, MolitSaleMonth } from './sale';
import { MolitSourceError, isValidDealYmd } from './xml';
import {
  MOLIT_SALE_ENDPOINT_VERSION,
  MOLIT_SALE_PARSER_VERSION,
  MOLIT_SALE_RIGHTS_POLICY_ID,
  SALE_SOURCE_MANIFEST_CACHE_KIND,
  SALE_SOURCE_PAGE_CACHE_KIND,
} from './versions';

export type SaleSourceMonthStorePolicy = Readonly<{
  namespacePrefix: string;
  ttlSeconds: number;
  tags: readonly string[];
  corruptTag: string;
}>;

export type SaleSourceMonthIdentity = Readonly<{
  sourceHousingType: SourceHousingType;
  lawdCd: string;
  dealYmd: string;
  pageSize: number;
}>;

export type SaleSourceMonthStore = Readonly<{
  namespace(input: SaleSourceMonthIdentity): string;
  read(
    cache: RuntimeCachePort,
    input: SaleSourceMonthIdentity,
    signal?: AbortSignal,
  ): Promise<MolitSaleMonth | null>;
  write(
    cache: RuntimeCachePort,
    month: MolitSaleMonth,
    beforeWrite?: () => void,
    signal?: AbortSignal,
  ): Promise<void>;
}>;

type SaleSourcePageEntry = Readonly<{
  kind: typeof SALE_SOURCE_PAGE_CACHE_KIND;
  parserVersion: typeof MOLIT_SALE_PARSER_VERSION;
  rightsPolicyId: typeof MOLIT_SALE_RIGHTS_POLICY_ID;
  pageNo: number;
  rows: readonly KoreaSaleRecord[];
  rowFingerprintDigests: readonly string[];
}>;

type SaleSourceManifestEntry = Readonly<{
  kind: typeof SALE_SOURCE_MANIFEST_CACHE_KIND;
  parserVersion: typeof MOLIT_SALE_PARSER_VERSION;
  rightsPolicyId: typeof MOLIT_SALE_RIGHTS_POLICY_ID;
  sourceHousingType: SourceHousingType;
  lawdCd: string;
  dealYmd: string;
  pageSize: number;
  totalCount: number;
  retrievedAt: string;
  generation: string;
  chunkKeys: readonly string[];
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

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function hasExactKeys(value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isSourceHousingType(value: unknown): value is SourceHousingType {
  return value === 'apartment' || value === 'officetel' || value === 'villa' || value === 'detached';
}

function isIso(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isCalendarDate(value: unknown, dealYmd: string): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null || value.slice(0, 7).replace('-', '') !== dealYmd) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  return year >= 1900 && year <= 2200 &&
    instant.getUTCFullYear() === year &&
    instant.getUTCMonth() + 1 === month &&
    instant.getUTCDate() === day;
}

function isSaleRecord(
  value: unknown,
  sourceHousingType: SourceHousingType,
  dealYmd: string,
): value is KoreaSaleRecord {
  if (!isObject(value)) return false;
  const keys = [
    'sourceHousingType',
    'areaSqm',
    'priceWon',
    'contractDate',
    'recordStatus',
    ...(value.buildingLabel === undefined ? [] : ['buildingLabel']),
    ...(value.legalDong === undefined ? [] : ['legalDong']),
    ...(value.sourceRecordId === undefined ? [] : ['sourceRecordId']),
    ...(value.floor === undefined ? [] : ['floor']),
    ...(value.buildYear === undefined ? [] : ['buildYear']),
  ];
  return hasExactKeys(value, keys) &&
    value.sourceHousingType === sourceHousingType &&
    typeof value.areaSqm === 'number' && Number.isFinite(value.areaSqm) &&
    value.areaSqm > 0 && value.areaSqm <= 2_000 &&
    Number.isSafeInteger(value.priceWon) && (value.priceWon as number) > 0 &&
    isCalendarDate(value.contractDate, dealYmd) &&
    (value.recordStatus === 'active' || value.recordStatus === 'cancelled' || value.recordStatus === 'unknown') &&
    (value.buildingLabel === undefined ||
      (typeof value.buildingLabel === 'string' && value.buildingLabel.trim().length > 0)) &&
    (value.legalDong === undefined ||
      (typeof value.legalDong === 'string' && value.legalDong.trim().length > 0)) &&
    (value.sourceRecordId === undefined ||
      (typeof value.sourceRecordId === 'string' && value.sourceRecordId.trim().length > 0)) &&
    (value.floor === undefined || Number.isSafeInteger(value.floor)) &&
    (value.buildYear === undefined ||
      (Number.isSafeInteger(value.buildYear) && (value.buildYear as number) >= 1800 &&
        (value.buildYear as number) <= 2200));
}

function isManifest(value: unknown, namespace: string): value is SaleSourceManifestEntry {
  if (!isObject(value)) return false;
  return hasExactKeys(value, [
    'kind', 'parserVersion', 'rightsPolicyId', 'sourceHousingType', 'lawdCd', 'dealYmd',
    'pageSize', 'totalCount', 'retrievedAt', 'generation', 'chunkKeys',
  ]) &&
    value.kind === SALE_SOURCE_MANIFEST_CACHE_KIND &&
    value.parserVersion === MOLIT_SALE_PARSER_VERSION &&
    value.rightsPolicyId === MOLIT_SALE_RIGHTS_POLICY_ID &&
    isSourceHousingType(value.sourceHousingType) &&
    typeof value.lawdCd === 'string' && /^\d{5}$/.test(value.lawdCd) &&
    typeof value.dealYmd === 'string' && isValidDealYmd(value.dealYmd) &&
    Number.isSafeInteger(value.pageSize) && (value.pageSize as number) > 0 &&
    (value.pageSize as number) <= 1_000 &&
    Number.isSafeInteger(value.totalCount) && (value.totalCount as number) >= 0 &&
    isIso(value.retrievedAt) &&
    typeof value.generation === 'string' && /^[0-9a-f]{64}$/.test(value.generation) &&
    Array.isArray(value.chunkKeys) &&
    value.chunkKeys.length === Math.max(1, Math.ceil(
      (value.totalCount as number) / (value.pageSize as number),
    )) &&
    value.chunkKeys.every((key, index) =>
      key === `${namespace}:generation=${value.generation}:page=${index + 1}`);
}

function isPage(
  value: unknown,
  pageNo: number,
  manifest: SaleSourceManifestEntry,
): value is SaleSourcePageEntry {
  if (!isObject(value)) return false;
  const expectedRows = pageNo < manifest.chunkKeys.length
    ? manifest.pageSize
    : manifest.totalCount - manifest.pageSize * (manifest.chunkKeys.length - 1);
  return hasExactKeys(value, [
    'kind', 'parserVersion', 'rightsPolicyId', 'pageNo', 'rows', 'rowFingerprintDigests',
  ]) &&
    value.kind === SALE_SOURCE_PAGE_CACHE_KIND &&
    value.parserVersion === MOLIT_SALE_PARSER_VERSION &&
    value.rightsPolicyId === MOLIT_SALE_RIGHTS_POLICY_ID &&
    value.pageNo === pageNo &&
    Array.isArray(value.rows) && value.rows.length === expectedRows &&
    value.rows.every((record) =>
      isSaleRecord(record, manifest.sourceHousingType, manifest.dealYmd)) &&
    Array.isArray(value.rowFingerprintDigests) &&
    value.rowFingerprintDigests.length === value.rows.length &&
    value.rowFingerprintDigests.every((digest) =>
      typeof digest === 'string' && /^[0-9a-f]{64}$/.test(digest));
}

async function generation(month: MolitSaleMonth, signal?: AbortSignal): Promise<string> {
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
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function reconstructRecords(chunks: readonly SaleSourcePageEntry[]): readonly KoreaSaleRecord[] | null {
  const records: KoreaSaleRecord[] = [];
  const stableRecords = new Map<string, string>();
  for (const chunk of chunks) {
    for (let index = 0; index < chunk.rows.length; index += 1) {
      const record = chunk.rows[index]!;
      const digest = chunk.rowFingerprintDigests[index]!;
      if (record.sourceRecordId !== undefined) {
        const prior = stableRecords.get(record.sourceRecordId);
        if (prior !== undefined) {
          if (prior !== digest) return null;
          continue;
        }
        stableRecords.set(record.sourceRecordId, digest);
      }
      records.push(record);
    }
  }
  return Object.freeze(records);
}

export function createSaleSourceMonthStore(
  policy: SaleSourceMonthStorePolicy,
): SaleSourceMonthStore {
  const namespace = (input: SaleSourceMonthIdentity): string => [
    policy.namespacePrefix,
    'market=kr-seoul',
    `endpoint=${MOLIT_SALE_ENDPOINT_VERSION}`,
    `type=${input.sourceHousingType}`,
    `lawd=${input.lawdCd}`,
    `month=${input.dealYmd}`,
    `pageSize=${input.pageSize}`,
    `parser=${MOLIT_SALE_PARSER_VERSION}`,
    `rights=${MOLIT_SALE_RIGHTS_POLICY_ID}`,
  ].join(':');

  const invalidate = async (cache: RuntimeCachePort, signal?: AbortSignal): Promise<null> => {
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

  const read: SaleSourceMonthStore['read'] = async (cache, input, signal) => {
    const keyPrefix = namespace(input);
    const manifest = await safeGet<unknown>(cache, `${keyPrefix}:manifest`, signal);
    if (manifest === null) return null;
    if (!isManifest(manifest, keyPrefix) ||
      manifest.sourceHousingType !== input.sourceHousingType ||
      manifest.lawdCd !== input.lawdCd || manifest.dealYmd !== input.dealYmd ||
      manifest.pageSize !== input.pageSize) {
      return invalidate(cache, signal);
    }

    const chunks: SaleSourcePageEntry[] = [];
    for (let index = 0; index < manifest.chunkKeys.length; index += 1) {
      const chunk = await safeGet<unknown>(cache, manifest.chunkKeys[index]!, signal);
      if (!isPage(chunk, index + 1, manifest)) return invalidate(cache, signal);
      chunks.push(chunk);
    }
    const records = reconstructRecords(chunks);
    if (records === null) return invalidate(cache, signal);
    const month: MolitSaleMonth = Object.freeze({
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
    if (await generation(month, signal) !== manifest.generation) return invalidate(cache, signal);
    return month;
  };

  const write: SaleSourceMonthStore['write'] = async (
    cache,
    month,
    beforeWrite,
    signal,
  ) => {
    const keyPrefix = namespace(month);
    const sourceGeneration = await generation(month, signal);
    const chunkKeys = month.pages.map((page) =>
      `${keyPrefix}:generation=${sourceGeneration}:page=${page.pageNo}`);
    for (let index = 0; index < month.pages.length; index += 1) {
      const page = month.pages[index]!;
      const entry: SaleSourcePageEntry = Object.freeze({
        kind: SALE_SOURCE_PAGE_CACHE_KIND,
        parserVersion: MOLIT_SALE_PARSER_VERSION,
        rightsPolicyId: MOLIT_SALE_RIGHTS_POLICY_ID,
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

    const manifest: SaleSourceManifestEntry = Object.freeze({
      kind: SALE_SOURCE_MANIFEST_CACHE_KIND,
      parserVersion: MOLIT_SALE_PARSER_VERSION,
      rightsPolicyId: MOLIT_SALE_RIGHTS_POLICY_ID,
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
