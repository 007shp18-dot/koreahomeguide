import 'server-only';

import { contentDatabase } from '../db/postgres.server';
import { getPublicPhotoApproval } from './verified-building-photo-registry.server';

export type StoredPublicPhotoApproval = Readonly<{
  provider: 'google-place' | 'licensed-url' | 'owned-object';
  placeId: string | null;
  assetUrl: string | null;
  attributionName: string | null;
  attributionUrl: string | null;
  buildingName: string;
  address: string;
  approvedAt: string;
}>;

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function getStoredPublicPhotoApproval(key: string): Promise<StoredPublicPhotoApproval | null> {
  const sql = contentDatabase();
  if (sql !== null) {
    try {
      const [row] = await sql`
        SELECT
          photo.provider,
          photo.provider_place_id,
          photo.asset_url,
          photo.attribution_name,
          photo.attribution_url,
          building.official_name,
          coalesce(building.road_address, building.legal_address) AS address,
          photo.approved_at
        FROM building_photos photo
        JOIN buildings building ON building.key = photo.building_key
        WHERE photo.registry_key = ${key}
          AND photo.status = 'approved'
        ORDER BY photo.position, photo.id
        LIMIT 1
      `;
      const provider = row?.provider;
      const buildingName = row?.official_name;
      const address = row?.address;
      const approvedAt = row?.approved_at instanceof Date
        ? row.approved_at.toISOString()
        : typeof row?.approved_at === 'string' ? row.approved_at : null;
      if (['google-place', 'licensed-url', 'owned-object'].includes(String(provider))
        && typeof buildingName === 'string' && typeof address === 'string' && approvedAt !== null) {
        const assetUrl = safeHttpUrl(row?.asset_url);
        const placeId = typeof row?.provider_place_id === 'string' ? row.provider_place_id : null;
        if ((provider === 'google-place' && placeId !== null)
          || (provider !== 'google-place' && assetUrl !== null)) {
          return Object.freeze({
            provider: provider as StoredPublicPhotoApproval['provider'],
            placeId,
            assetUrl,
            attributionName: typeof row?.attribution_name === 'string' ? row.attribution_name : null,
            attributionUrl: safeHttpUrl(row?.attribution_url),
            buildingName,
            address,
            approvedAt,
          });
        }
      }
    } catch (error) {
      console.error('SignedPrice approved-photo database read failed.', error);
    }
  }
  const fallback = getPublicPhotoApproval(key);
  return fallback === null ? null : Object.freeze({
    provider: 'provider' in fallback ? fallback.provider : 'google-place',
    placeId: fallback.placeId,
    assetUrl: 'assetUrl' in fallback ? fallback.assetUrl : null,
    attributionName: 'attributionName' in fallback ? fallback.attributionName : null,
    attributionUrl: 'attributionUrl' in fallback ? fallback.attributionUrl : null,
    buildingName: fallback.buildingName,
    address: fallback.address,
    approvedAt: fallback.approvedAt,
  });
}

export type PhotoApprovalInput = Readonly<{
  registryKey: string;
  marketKey: 'seoul' | 'singapore' | 'dubai';
  buildingKey: string;
  externalId: string;
  buildingName: string;
  address: string;
  provider: StoredPublicPhotoApproval['provider'];
  placeId: string | null;
  assetUrl: string | null;
  attributionName: string | null;
  attributionUrl: string | null;
}>;

export async function approveBuildingPhoto(input: PhotoApprovalInput): Promise<void> {
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  const market = input.marketKey === 'seoul'
    ? { name: 'Seoul', countryCode: 'KR' }
    : input.marketKey === 'singapore'
      ? { name: 'Singapore', countryCode: 'SG' }
      : { name: 'Dubai', countryCode: 'AE' };
  const normalizedName = input.buildingName.normalize('NFKC').toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, '');
  await sql`
    WITH market_upsert AS (
      INSERT INTO markets (key, name, country_code)
      VALUES (${input.marketKey}, ${market.name}, ${market.countryCode})
      ON CONFLICT (key) DO UPDATE SET name = excluded.name, updated_at = now()
      RETURNING key
    ), building_upsert AS (
      INSERT INTO buildings (
        key, market_key, external_id, official_name, normalized_name,
        legal_address, identity_status
      )
      SELECT
        ${input.buildingKey}, market_upsert.key, ${input.externalId}, ${input.buildingName},
        ${normalizedName}, ${input.address}, 'verified'
      FROM market_upsert
      ON CONFLICT (key) DO UPDATE SET
        official_name = excluded.official_name,
        normalized_name = excluded.normalized_name,
        legal_address = excluded.legal_address,
        identity_status = 'verified',
        updated_at = now()
      RETURNING key
    )
    INSERT INTO building_photos (
      building_key, registry_key, provider, provider_place_id, asset_url,
      attribution_name, attribution_url, status, approved_at, approved_by,
      subject_kind, rights_status, source_page_url, visual_reviewed_at
    )
    SELECT
      building_upsert.key, ${input.registryKey}, ${input.provider}, ${input.placeId}, ${input.assetUrl},
      ${input.attributionName}, ${input.attributionUrl}, 'approved', now(), 'content-admin-api',
      'building-exterior', ${input.provider === 'owned-object' ? 'owned' : input.provider === 'licensed-url' ? 'licensed' : 'provider-display-only'},
      ${input.attributionUrl}, now()
    FROM building_upsert
    ON CONFLICT (registry_key) DO UPDATE SET
      building_key = excluded.building_key,
      provider = excluded.provider,
      provider_place_id = excluded.provider_place_id,
      asset_url = excluded.asset_url,
      attribution_name = excluded.attribution_name,
      attribution_url = excluded.attribution_url,
      status = 'approved',
      approved_at = now(),
      approved_by = 'content-admin-api',
      subject_kind = 'building-exterior',
      rights_status = excluded.rights_status,
      source_page_url = excluded.source_page_url,
      visual_reviewed_at = now(),
      checked_at = now(),
      updated_at = now()
  `;
}

type CandidateBuilding = Readonly<{
  key: string;
  marketKey: 'seoul' | 'singapore' | 'dubai';
  externalId: string;
  name: string;
  address: string;
  localAttributes: Readonly<Record<string, unknown>>;
}>;

export function candidatePhotoRegistryKey(building: Omit<CandidateBuilding, 'address'>): string | null {
  if (building.marketKey === 'seoul') return `kr-seoul:${building.externalId}`;
  if (building.marketKey === 'dubai') return `ae-dubai:${building.externalId}`;
  if (building.key.startsWith('singapore:project:')) {
    const segment = building.localAttributes.marketSegment;
    return typeof segment === 'string' && segment !== '' ? `sg-project:${segment}:${building.name}` : null;
  }
  if (building.key.startsWith('singapore:block:')) {
    const town = building.localAttributes.town;
    return typeof town === 'string' && town !== '' ? `sg-hdb:${town}:${building.name}` : null;
  }
  return null;
}

function normalizedIdentity(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, '');
}

export function googlePlaceAddressMatches(
  placeAddress: string,
  buildingAddress: string,
  marketKey: 'seoul' | 'singapore',
): boolean {
  const normalizedPlace = placeAddress.normalize('NFKC').toLocaleLowerCase('en-US');
  const parts = buildingAddress.normalize('NFKC').toLocaleLowerCase('en-US')
    .split(/[^\p{L}\p{N}]+/gu)
    .filter(Boolean);
  if (marketKey === 'seoul') {
    const district = parts.find((part) => /[구區]$/u.test(part));
    return district !== undefined && normalizedIdentity(normalizedPlace).includes(normalizedIdentity(district));
  }
  const ignored = new Set([
    'singapore', 'street', 'st', 'road', 'rd', 'avenue', 'ave', 'drive', 'dr',
    'lane', 'ln', 'walk', 'way', 'close', 'crescent', 'block', 'blk',
  ]);
  const locality = parts.find((part) => part.length >= 4 && !/^\d+$/u.test(part) && !ignored.has(part));
  return locality !== undefined && normalizedIdentity(normalizedPlace).includes(normalizedIdentity(locality));
}

async function recordEnrichmentAttempt(input: Readonly<{
  buildingKey: string;
  pipeline: 'photo-wikimedia' | 'photo-google';
  status: 'succeeded' | 'no-candidate' | 'provider-error';
  reason: string | null;
  retryAfter: 'day' | 'month' | 'year';
}>): Promise<void> {
  const sql = contentDatabase();
  if (sql === null) return;
  const retryInterval = input.retryAfter === 'day' ? '1 day' : input.retryAfter === 'month' ? '30 days' : '365 days';
  await sql`
    INSERT INTO building_enrichment_attempts (
      building_key, pipeline, status, reason, attempted_at, next_retry_at
    ) VALUES (
      ${input.buildingKey}, ${input.pipeline}, ${input.status}, ${input.reason}, now(),
      now() + ${retryInterval}::interval
    )
    ON CONFLICT (building_key, pipeline) DO UPDATE SET
      status = excluded.status,
      reason = excluded.reason,
      attempted_at = now(),
      next_retry_at = excluded.next_retry_at,
      updated_at = now()
  `;
}

type CommonsMetadataValue = Readonly<{ value?: unknown }>;
type CommonsImageInfo = Readonly<{
  url?: unknown;
  thumburl?: unknown;
  descriptionurl?: unknown;
  mime?: unknown;
  width?: unknown;
  height?: unknown;
  extmetadata?: Readonly<Record<string, CommonsMetadataValue>>;
}>;
type CommonsSearchPage = Readonly<{
  title?: unknown;
  imageinfo?: readonly CommonsImageInfo[];
}>;

export type WikimediaPhotoCandidate = Readonly<{
  assetUrl: string;
  sourcePageUrl: string;
  attributionName: string;
  licenseName: string;
  licenseUrl: string;
}>;

function plainMetadata(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
}

async function countCandidatesInBatches<T>(
  values: readonly T[],
  worker: (value: T) => Promise<boolean>,
  concurrency = 5,
): Promise<number> {
  let candidates = 0;
  for (let index = 0; index < values.length; index += concurrency) {
    const results = await Promise.all(values.slice(index, index + concurrency).map(worker));
    candidates += results.filter(Boolean).length;
  }
  return candidates;
}

/**
 * Commons search results remain review candidates. Exact identity and license
 * metadata are required before a URL is allowed into the photo review queue.
 */
export function selectWikimediaPhotoCandidate(
  buildingName: string,
  pages: readonly CommonsSearchPage[],
): WikimediaPhotoCandidate | null {
  const building = normalizedIdentity(buildingName);
  if (building.length < 5) return null;
  const candidates: { candidate: WikimediaPhotoCandidate; score: number }[] = [];
  for (const page of pages) {
    const title = typeof page.title === 'string' ? page.title.replace(/^File:/i, '') : '';
    if (!normalizedIdentity(title).includes(building)) continue;
    const info = page.imageinfo?.[0];
    if (info === undefined || typeof info.mime !== 'string' || !info.mime.startsWith('image/')) continue;
    const assetUrl = safeHttpUrl(info.thumburl) ?? safeHttpUrl(info.url);
    const sourcePageUrl = safeHttpUrl(info.descriptionurl);
    const metadata = info.extmetadata;
    const licenseName = plainMetadata(metadata?.LicenseShortName?.value);
    const licenseUrl = safeHttpUrl(metadata?.LicenseUrl?.value);
    const attributionName = plainMetadata(
      metadata?.Artist?.value ?? metadata?.Credit?.value ?? metadata?.Attribution?.value,
    );
    if (assetUrl === null || sourcePageUrl === null || licenseUrl === null
      || licenseName === '' || attributionName === '') continue;
    const width = typeof info.width === 'number' && Number.isFinite(info.width) ? info.width : 0;
    const height = typeof info.height === 'number' && Number.isFinite(info.height) ? info.height : 0;
    const pixels = width * height;
    if (pixels > 0 && pixels < 1_000_000) continue;
    candidates.push(Object.freeze({
      candidate: Object.freeze({ assetUrl, sourcePageUrl, attributionName, licenseName, licenseUrl }),
      score: pixels === 0 ? 1 : pixels * (width >= height ? 1.15 : 1),
    }));
  }
  return candidates.sort((left, right) => right.score - left.score)[0]?.candidate ?? null;
}

export async function discoverWikimediaCommonsPhotoCandidates(limit = 12, marketKey?: 'seoul' | 'singapore'): Promise<Readonly<{
  checked: number;
  candidates: number;
  state: 'ready' | 'not-configured';
}>> {
  const sql = contentDatabase();
  if (sql === null) return Object.freeze({ checked: 0, candidates: 0, state: 'not-configured' });
  const rows = await sql`
    SELECT building.key, building.market_key, building.external_id, building.official_name,
      coalesce(building.road_address, building.legal_address) AS address,
      entity.local_attributes
    FROM buildings building
    LEFT JOIN property_entities entity ON entity.id = CASE
      WHEN building.market_key = 'seoul' THEN 'kr-seoul:estate:' || building.external_id
      WHEN building.market_key = 'singapore' THEN 'sg-' || building.key
    END
    WHERE building.identity_status = 'verified'
      AND (${marketKey ?? null}::text IS NULL OR building.market_key = ${marketKey ?? null})
      AND coalesce(building.road_address, building.legal_address) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM building_photos photo
        WHERE photo.building_key = building.key
          AND photo.status IN ('approved', 'review_required', 'candidate')
      )
      AND NOT EXISTS (
        SELECT 1 FROM building_enrichment_attempts attempt
        WHERE attempt.building_key = building.key
          AND attempt.pipeline = 'photo-wikimedia'
          AND attempt.next_retry_at > now()
      )
    ORDER BY
      CASE WHEN building.market_key = 'singapore' AND building.key LIKE 'singapore:project:%' THEN 0 ELSE 1 END,
      building.key
    LIMIT ${Math.min(Math.max(limit, 1), 30)}
  `;
  const buildings = rows.flatMap((row): CandidateBuilding[] => (
    typeof row.key === 'string' && ['seoul', 'singapore', 'dubai'].includes(String(row.market_key))
      && typeof row.external_id === 'string' && typeof row.official_name === 'string'
      && typeof row.address === 'string'
      ? [{ key: row.key, marketKey: row.market_key as CandidateBuilding['marketKey'], externalId: row.external_id, name: row.official_name, address: row.address, localAttributes: (row.local_attributes ?? {}) as CandidateBuilding['localAttributes'] }]
      : []
  ));
  const candidates = await countCandidatesInBatches(buildings, async (building) => {
    if (building.marketKey === 'dubai') return false;
    const registryKey = candidatePhotoRegistryKey(building);
    if (registryKey === null) return false;
    try {
      const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
      endpoint.search = new URLSearchParams({
        action: 'query', format: 'json', formatversion: '2', generator: 'search',
        gsrsearch: `"${building.name}" filetype:bitmap`, gsrnamespace: '6', gsrlimit: '3',
        prop: 'imageinfo', iiprop: 'url|mime|size|extmetadata', iiurlwidth: '1600',
      }).toString();
      const response = await fetch(endpoint, {
        headers: { 'User-Agent': 'SignedPrice building-photo-candidate/1.0 (contact@signedprice.com)' },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-wikimedia', status: 'provider-error', reason: `http-${response.status}`, retryAfter: 'day' });
        return false;
      }
      const body = await response.json() as Readonly<{
        query?: Readonly<{ pages?: readonly CommonsSearchPage[] }>;
      }>;
      const candidate = selectWikimediaPhotoCandidate(building.name, body.query?.pages ?? []);
      if (candidate === null) {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-wikimedia', status: 'no-candidate', reason: 'exact-licensed-image-not-found', retryAfter: 'month' });
        return false;
      }
      await sql`
        INSERT INTO building_photos (
          building_key, registry_key, provider, asset_url, attribution_name, attribution_url,
          status, subject_kind, rights_status, source_page_url, checked_at
        ) VALUES (
          ${building.key}, ${registryKey}, 'licensed-url', ${candidate.assetUrl},
          ${`${candidate.attributionName} · ${candidate.licenseName}`}, ${candidate.licenseUrl},
          'review_required', 'building-exterior', 'licensed', ${candidate.sourcePageUrl}, now()
        )
        ON CONFLICT (registry_key) DO UPDATE SET
          provider = CASE WHEN building_photos.status = 'approved' THEN building_photos.provider ELSE excluded.provider END,
          provider_place_id = CASE WHEN building_photos.status = 'approved' THEN building_photos.provider_place_id ELSE NULL END,
          asset_url = CASE WHEN building_photos.status = 'approved' THEN building_photos.asset_url ELSE excluded.asset_url END,
          attribution_name = CASE WHEN building_photos.status = 'approved' THEN building_photos.attribution_name ELSE excluded.attribution_name END,
          attribution_url = CASE WHEN building_photos.status = 'approved' THEN building_photos.attribution_url ELSE excluded.attribution_url END,
          status = CASE WHEN building_photos.status = 'approved' THEN 'approved' ELSE 'review_required' END,
          subject_kind = 'building-exterior',
          rights_status = CASE WHEN building_photos.status = 'approved' THEN building_photos.rights_status ELSE 'licensed' END,
          source_page_url = CASE WHEN building_photos.status = 'approved' THEN building_photos.source_page_url ELSE excluded.source_page_url END,
          checked_at = now(), updated_at = now()
      `;
      await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-wikimedia', status: 'succeeded', reason: null, retryAfter: 'year' });
      return true;
    } catch {
      try {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-wikimedia', status: 'provider-error', reason: 'request-failed', retryAfter: 'day' });
      } catch {
        // Provider failures never create a guessed or partially licensed photo.
      }
      return false;
    }
  });
  return Object.freeze({ checked: buildings.length, candidates, state: 'ready' });
}

export async function discoverGooglePlacePhotoCandidates(limit = 12, marketKey?: 'seoul' | 'singapore'): Promise<Readonly<{
  checked: number;
  candidates: number;
  state: 'ready' | 'not-configured';
}>> {
  const sql = contentDatabase();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (sql === null || !apiKey) return Object.freeze({ checked: 0, candidates: 0, state: 'not-configured' });
  const rows = await sql`
    SELECT building.key, building.market_key, building.external_id, building.official_name,
      coalesce(building.road_address, building.legal_address) AS address,
      entity.local_attributes
    FROM buildings building
    LEFT JOIN property_entities entity ON entity.id = CASE
      WHEN building.market_key = 'seoul' THEN 'kr-seoul:estate:' || building.external_id
      WHEN building.market_key = 'singapore' THEN 'sg-' || building.key
    END
    WHERE building.identity_status = 'verified'
      AND (${marketKey ?? null}::text IS NULL OR building.market_key = ${marketKey ?? null})
      AND coalesce(building.road_address, building.legal_address) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM building_photos photo
        WHERE photo.building_key = building.key
          AND photo.status IN ('approved', 'review_required', 'candidate')
      )
      AND NOT EXISTS (
        SELECT 1 FROM building_enrichment_attempts attempt
        WHERE attempt.building_key = building.key
          AND attempt.pipeline = 'photo-google'
          AND attempt.next_retry_at > now()
      )
    ORDER BY
      CASE WHEN building.market_key = 'singapore' AND building.key LIKE 'singapore:project:%' THEN 0 ELSE 1 END,
      building.key
    LIMIT ${Math.min(Math.max(limit, 1), 30)}
  `;
  const buildings = rows.flatMap((row): CandidateBuilding[] => (
    typeof row.key === 'string' && ['seoul', 'singapore', 'dubai'].includes(String(row.market_key))
      && typeof row.external_id === 'string' && typeof row.official_name === 'string'
      && typeof row.address === 'string'
      ? [{ key: row.key, marketKey: row.market_key as CandidateBuilding['marketKey'], externalId: row.external_id, name: row.official_name, address: row.address, localAttributes: (row.local_attributes ?? {}) as CandidateBuilding['localAttributes'] }]
      : []
  ));
  const candidates = await countCandidatesInBatches(buildings, async (building) => {
    if (building.marketKey === 'dubai') return false;
    const registryKey = candidatePhotoRegistryKey(building);
    if (registryKey === null) return false;
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos',
        },
        body: JSON.stringify({ textQuery: `${building.name}, ${building.address}`, maxResultCount: 1, languageCode: building.marketKey === 'seoul' ? 'ko' : 'en' }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-google', status: 'provider-error', reason: `http-${response.status}`, retryAfter: 'day' });
        return false;
      }
      const body = await response.json() as Readonly<{ places?: readonly Readonly<{
        id?: unknown;
        displayName?: Readonly<{ text?: unknown }>;
        formattedAddress?: unknown;
        photos?: readonly unknown[];
      }>[] }>;
      const place = body.places?.[0];
      const placeId = typeof place?.id === 'string' ? place.id : null;
      const placeName = typeof place?.displayName?.text === 'string' ? place.displayName.text : '';
      const placeAddress = typeof place?.formattedAddress === 'string' ? place.formattedAddress : '';
      if (placeId === null || (place?.photos?.length ?? 0) === 0
        || !(normalizedIdentity(placeName).includes(normalizedIdentity(building.name))
          || normalizedIdentity(building.name).includes(normalizedIdentity(placeName)))
        || !googlePlaceAddressMatches(placeAddress, building.address, building.marketKey)) {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-google', status: 'no-candidate', reason: 'exact-place-with-photo-not-found', retryAfter: 'month' });
        return false;
      }
      await sql`
        INSERT INTO building_photos (
          building_key, registry_key, provider, provider_place_id, status,
          subject_kind, rights_status, checked_at
        ) VALUES (
          ${building.key}, ${registryKey}, 'google-place', ${placeId},
          'review_required', 'building-exterior', 'provider-display-only', now()
        )
        ON CONFLICT (registry_key) DO UPDATE SET
          provider_place_id = excluded.provider_place_id,
          status = CASE WHEN building_photos.status = 'approved' THEN 'approved' ELSE 'review_required' END,
          checked_at = now(), updated_at = now()
      `;
      await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-google', status: 'succeeded', reason: null, retryAfter: 'year' });
      return true;
    } catch {
      try {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-google', status: 'provider-error', reason: 'request-failed', retryAfter: 'day' });
      } catch {
        // A failed provider lookup must not create a guessed identity or photo.
      }
      return false;
    }
  });
  return Object.freeze({ checked: buildings.length, candidates, state: 'ready' });
}

export async function listBuildingPhotoCandidates(limit = 100): Promise<readonly Readonly<Record<string, unknown>>[]> {
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  const rows = await sql`
    SELECT photo.registry_key AS "registryKey", building.key AS "buildingKey",
      building.market_key AS "marketKey", building.external_id AS "externalId",
      building.official_name AS "buildingName",
      coalesce(building.road_address, building.legal_address) AS address,
      photo.provider, photo.provider_place_id AS "placeId", photo.asset_url AS "assetUrl",
      photo.attribution_name AS "attributionName", photo.attribution_url AS "attributionUrl",
      photo.source_page_url AS "sourcePageUrl", photo.rights_status AS "rightsStatus",
      photo.status, photo.checked_at AS "checkedAt"
    FROM building_photos photo
    JOIN buildings building ON building.key = photo.building_key
    WHERE photo.status IN ('candidate', 'review_required')
    ORDER BY photo.checked_at DESC
    LIMIT ${Math.min(Math.max(limit, 1), 300)}
  `;
  return Object.freeze(rows.map((row) => Object.freeze({ ...row })));
}
