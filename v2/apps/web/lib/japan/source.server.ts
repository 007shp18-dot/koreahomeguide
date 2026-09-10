import 'server-only';
import { createHash } from 'node:crypto';

export const JAPAN_SOURCE = 'https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001';
export const JAPAN_PARSER = 'xit001-area-snapshot@1';
export const MAX_JAPAN_RECORDS = 10_000;
const MAX_BYTES = 8 * 1024 * 1024;
export type JapanScope = { city: string; year: string; quarter: string };
export type JapanRecord = {
  recordReference: string; contentHash: string; occurrence: number;
  type: string; municipalityCode: string; municipality: string; district: string;
  price: number; currency: 'JPY'; areaSqm: number | null; areaLabel: string;
  floorPlan: string; buildingYear: string; structure: string; period: string;
  periodPrecision: 'quarter'; identityPrecision: 'anonymized_transaction';
};
export type JapanSnapshot = {
  scope: JapanScope; records: JapanRecord[]; sourceUrl: string; retrievedAt: string;
  rawPayload: string; rawHash: string; snapshotHash: string; parserVersion: string;
  responseMetadata: { etag: string | null; lastModified: string | null };
};
export function parseJapanScope(query: URLSearchParams): JapanScope {
  const city = query.get('city') ?? '13103';
  const year = query.get('year') ?? '2025';
  const quarter = query.get('quarter') ?? '4';
  if (!/^131(0[1-9]|1[0-9]|2[0-3])$/.test(city)
    || !/^20\d{2}$/.test(year) || Number(year) < 2024 || Number(year) > new Date().getUTCFullYear()
    || !/^[1-4]$/.test(quarter)) throw new TypeError('invalid_scope');
  return { city, year, quarter };
}
export function scopeKey(scope: JapanScope) { return `${scope.city}:${scope.year}:Q${scope.quarter}`; }
export function sha256(value: string) { return createHash('sha256').update(value).digest('hex'); }
function label(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > 1000) throw new TypeError('source_invalid');
  return value.trim();
}
function positiveNumber(value: string) {
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= Number.MAX_SAFE_INTEGER ? parsed : null;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

export function parseJapanSnapshot(rawPayload: string, scope: JapanScope, retrievedAt: string,
  responseMetadata: JapanSnapshot['responseMetadata'] = { etag: null, lastModified: null }): JapanSnapshot {
  if (Buffer.byteLength(rawPayload) > MAX_BYTES || !Number.isFinite(Date.parse(retrievedAt))) throw new TypeError('source_invalid');
  const body = JSON.parse(rawPayload);
  if (body?.status !== 'OK' || !Array.isArray(body.data) || body.data.length > MAX_JAPAN_RECORDS
    || body.truncated === true || body.hasMore === true
    || (body.total !== undefined && Number(body.total) !== body.data.length)) throw new TypeError('source_incomplete');
  const occurrences = new Map<string, number>();
  const records: JapanRecord[] = body.data.map((row: Record<string, unknown>) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new TypeError('source_invalid');
    const period = label(row.Period);
    const match = /^(\d)(?:st|nd|rd|th) quarter (\d{4})$/i.exec(period);
    const japanese = /^(\d{4})年第([1-4])四半期$/.exec(period);
    if (label(row.MunicipalityCode) !== scope.city
      || !(match?.[1] === scope.quarter && match?.[2] === scope.year
        || japanese?.[1] === scope.year && japanese?.[2] === scope.quarter)) throw new TypeError('source_scope_mismatch');
    const price = positiveNumber(label(row.TradePrice));
    if (price === null || !Number.isSafeInteger(price) || label(row.Type) === '') throw new TypeError('source_invalid');
    const contentHash = sha256(canonical(row));
    const occurrence = (occurrences.get(contentHash) ?? 0) + 1;
    occurrences.set(contentHash, occurrence);
    return {
      // A multiset member reference, never an official transaction or building ID.
      recordReference: `${scopeKey(scope)}:${contentHash}:${occurrence}`, contentHash, occurrence,
      type: label(row.Type), municipalityCode: scope.city, municipality: label(row.Municipality),
      district: label(row.DistrictName), price, currency: 'JPY',
      areaSqm: positiveNumber(label(row.Area)), areaLabel: label(row.Area),
      floorPlan: label(row.FloorPlan), buildingYear: label(row.BuildingYear), structure: label(row.Structure),
      period, periodPrecision: 'quarter', identityPrecision: 'anonymized_transaction',
    };
  });
  const sourceUrl = new URL(JAPAN_SOURCE);
  sourceUrl.search = new URLSearchParams({ ...scope, language: 'en', priceClassification: '01' }).toString();
  return { scope, records, sourceUrl: sourceUrl.toString(), retrievedAt, rawPayload,
    rawHash: sha256(rawPayload), snapshotHash: sha256(records.map(row => row.recordReference).sort().join('\n')),
    parserVersion: JAPAN_PARSER, responseMetadata };
}

export async function collectJapanSnapshot(scope: JapanScope, apiKey: string,
  fetchResponse: typeof fetch = fetch): Promise<JapanSnapshot> {
  const url = new URL(JAPAN_SOURCE);
  url.search = new URLSearchParams({ ...scope, language: 'en', priceClassification: '01' }).toString();
  const response = await fetchResponse(url, { cache: 'no-store', redirect: 'error',
    signal: AbortSignal.timeout(25_000), headers: { 'Ocp-Apim-Subscription-Key': apiKey, Accept: 'application/json' } });
  // XIT001 uses 404 for no data; do not erase a prior release on absence or failure.
  if (!response.ok || !response.body) throw new Error('provider_unavailable');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      bytes += item.value.byteLength;
      if (bytes > MAX_BYTES) { await reader.cancel(); throw new TypeError('source_too_large'); }
      chunks.push(item.value);
    }
  } finally { reader.releaseLock(); }
  const rawPayload = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  return parseJapanSnapshot(rawPayload, scope, new Date().toISOString(), {
    etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified'),
  });
}
