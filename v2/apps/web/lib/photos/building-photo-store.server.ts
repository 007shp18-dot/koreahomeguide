import 'server-only';

import { contentDatabase } from '../db/postgres.server';
import { getPublicPhotoApproval } from './verified-building-photo-registry.server';
import { scorePhotoIdentity, type PhotoIdentityDecision } from './photo-identity-policy';

export type PhotoSubjectKind = 'building-exterior' | 'building-front' | 'site-aerial' | 'map-only';

export function privatePhotoCandidateKey(buildingKey: string, source: 'naver-search' | 'wikimedia' | 'google'): string {
  return `candidate:${source}:${buildingKey}`;
}

export type StoredPublicPhotoApproval = Readonly<{
  buildingKey?: string | null;
  provider: 'google-place' | 'licensed-url' | 'owned-object';
  subjectKind: PhotoSubjectKind;
  placeId: string | null;
  assetUrl: string | null;
  attributionName: string | null;
  attributionUrl: string | null;
  sourcePageUrl?: string | null;
  buildingName: string;
  address: string;
  approvedAt: string;
}>;

type StoredPublicPhotoApprovalRow = Readonly<Record<string, unknown>>;

export type StoredPublicPhotoApprovalReadPort = Readonly<{
  query(
    statement: string,
    parameters: readonly unknown[],
  ): Promise<readonly StoredPublicPhotoApprovalRow[]>;
}>;

const PUBLIC_PHOTO_APPROVALS_SQL = `
  /* building-photo-store:public-approvals */
  SELECT DISTINCT ON (photo.publication_registry_key)
    photo.publication_registry_key AS registry_key,
    photo.building_key,
    photo.provider,
    photo.subject_kind,
    photo.provider_place_id,
    photo.asset_url,
    photo.attribution_name,
    photo.attribution_url,
    photo.source_page_url,
    building.official_name,
    coalesce(building.road_address, building.legal_address) AS address,
    photo.approved_at
  FROM building_photos photo
  JOIN buildings building ON building.key = photo.building_key
  WHERE photo.publication_registry_key = ANY($1::text[])
    AND photo.status = 'approved'
    AND photo.approved_at IS NOT NULL AND photo.approved_by IS NOT NULL
    AND photo.visual_reviewed_at IS NOT NULL
    AND photo.rights_status IN ('licensed', 'owned', 'provider-display-only')
    AND building.identity_status = 'verified'
  ORDER BY photo.publication_registry_key, photo.position, photo.approved_at DESC, photo.id
`;

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function storedPublicPhotoApprovalFromRow(
  row: StoredPublicPhotoApprovalRow,
): StoredPublicPhotoApproval | null {
  const provider = row.provider;
  const subjectKind = row.subject_kind;
  const buildingName = row.official_name;
  const address = row.address;
  const approvedAt = row.approved_at instanceof Date
    ? row.approved_at.toISOString()
    : typeof row.approved_at === 'string' ? row.approved_at : null;
  if (!['google-place', 'licensed-url', 'owned-object'].includes(String(provider))
    || !['building-exterior', 'building-front', 'site-aerial', 'map-only'].includes(String(subjectKind))
    || typeof buildingName !== 'string' || typeof address !== 'string' || approvedAt === null) {
    return null;
  }
  const assetUrl = safeHttpUrl(row.asset_url);
  const placeId = typeof row.provider_place_id === 'string' ? row.provider_place_id : null;
  if ((provider === 'google-place' && placeId === null)
    || (provider !== 'google-place' && assetUrl === null)) return null;
  return Object.freeze({
    buildingKey: typeof row.building_key === 'string' ? row.building_key : null,
    provider: provider as StoredPublicPhotoApproval['provider'],
    subjectKind: subjectKind as PhotoSubjectKind,
    placeId,
    assetUrl,
    attributionName: typeof row.attribution_name === 'string' ? row.attribution_name : null,
    attributionUrl: safeHttpUrl(row.attribution_url),
    sourcePageUrl: safeHttpUrl(row.source_page_url),
    buildingName,
    address,
    approvedAt,
  });
}

function fallbackPublicPhotoApproval(key: string): StoredPublicPhotoApproval | null {
  const fallback = getPublicPhotoApproval(key);
  return fallback === null ? null : Object.freeze({
    provider: 'provider' in fallback ? fallback.provider : 'google-place',
    subjectKind: 'building-exterior',
    placeId: fallback.placeId,
    assetUrl: 'assetUrl' in fallback ? fallback.assetUrl : null,
    attributionName: 'attributionName' in fallback ? fallback.attributionName : null,
    attributionUrl: 'attributionUrl' in fallback ? fallback.attributionUrl : null,
    buildingName: fallback.buildingName,
    address: fallback.address,
    approvedAt: fallback.approvedAt,
  });
}

export function createStoredPublicPhotoApprovalReader(
  port: StoredPublicPhotoApprovalReadPort,
): Readonly<{
  list(keys: readonly string[]): Promise<ReadonlyMap<string, StoredPublicPhotoApproval>>;
}> {
  return Object.freeze({
    async list(keys) {
      const normalized = Object.freeze([
        ...new Set(keys.filter((key) => key.trim() !== '' && key.length <= 240)),
      ].slice(0, 2_500));
      if (normalized.length === 0) return new Map();
      const rows = await port.query(PUBLIC_PHOTO_APPROVALS_SQL, [normalized]);
      const approvals = new Map<string, StoredPublicPhotoApproval>();
      for (const row of rows) {
        if (typeof row.registry_key !== 'string' || approvals.has(row.registry_key)) continue;
        const approval = storedPublicPhotoApprovalFromRow(row);
        if (approval !== null) approvals.set(row.registry_key, approval);
      }
      return approvals;
    },
  });
}

export async function listStoredPublicPhotoApprovals(
  keys: readonly string[],
): Promise<Readonly<{
  approvals: ReadonlyMap<string, StoredPublicPhotoApproval>;
  databaseReadFailed: boolean;
}>> {
  const normalized = Object.freeze([
    ...new Set(keys.filter((key) => key.trim() !== '' && key.length <= 240)),
  ].slice(0, 2_500));
  let approvals = new Map<string, StoredPublicPhotoApproval>();
  let databaseReadFailed = false;
  const sql = contentDatabase();
  if (sql !== null && normalized.length > 0) {
    try {
      approvals = new Map(await createStoredPublicPhotoApprovalReader({
        query: (statement, parameters) => sql.query(statement, [...parameters]),
      }).list(normalized));
    } catch (error) {
      databaseReadFailed = true;
      console.error('SignedPrice approved-photo database read failed.', error);
    }
  }
  // A configured live database is authoritative, including during an outage.
  // Static seeds must never resurrect a photograph rejected in the database.
  if (sql !== null) return Object.freeze({ approvals, databaseReadFailed });
  for (const key of normalized) {
    if (approvals.has(key)) continue;
    const fallback = fallbackPublicPhotoApproval(key);
    if (fallback !== null) approvals.set(key, fallback);
  }
  return Object.freeze({ approvals, databaseReadFailed });
}

export async function getStoredPublicPhotoApproval(
  key: string,
): Promise<StoredPublicPhotoApproval | null | undefined> {
  const { approvals, databaseReadFailed } = await listStoredPublicPhotoApprovals([key]);
  return approvals.get(key) ?? (databaseReadFailed ? undefined : null);
}

type CandidateBuilding = Readonly<{
  entityId: string;
  key: string;
  marketKey: 'seoul' | 'singapore' | 'dubai';
  externalId: string;
  name: string;
  address: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  localAttributes: Readonly<Record<string, unknown>>;
}>;

export function candidatePhotoRegistryKey(
  building: Pick<CandidateBuilding, 'key' | 'marketKey' | 'externalId' | 'name' | 'localAttributes'>,
): string | null {
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

export type PhotoCandidateDiscoveryResult = Readonly<{
  checked: number;
  candidates: number;
  entityIds: readonly string[];
  state: 'ready' | 'not-configured' | 'provider-error';
  reason?: string;
}>;

export type GooglePhotoBuildingIdentity = Readonly<{
  marketKey: 'seoul' | 'singapore';
  name: string;
  address: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}>;

export type GooglePhotoPlaceIdentity = Readonly<{
  displayName: string;
  formattedAddress: string;
  location: Readonly<{ latitude: number; longitude: number }> | null;
  hasPhoto: boolean;
}>;

export function decideGooglePhotoCandidate(
  building: GooglePhotoBuildingIdentity,
  place: GooglePhotoPlaceIdentity,
) {
  const entityLocation = building.latitude !== null && building.longitude !== null
    ? { latitude: building.latitude, longitude: building.longitude }
    : null;
  return scorePhotoIdentity({
    market: building.marketKey,
    canonicalName: building.name,
    aliases: [],
    address: building.address,
    postalCode: building.postalCode,
    entityLocation,
    providerName: place.displayName,
    providerAddress: place.formattedAddress,
    providerLocation: place.location,
    hasPhoto: place.hasPhoto,
  });
}

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
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
  coordinates?: readonly Readonly<{ lat?: unknown; lon?: unknown }>[];
}>;

export type WikimediaPhotoCandidate = Readonly<{
  title: string;
  width: number | null;
  height: number | null;
  assetUrl: string;
  sourcePageUrl: string;
  attributionName: string;
  licenseName: string;
  licenseUrl: string;
}> & PhotoIdentityDecision;

export type WikimediaBuildingIdentity = Readonly<{
  name: string;
  marketKey: 'seoul' | 'singapore';
  address: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  deadlineAt = Date.now() + 45_000,
): Promise<number> {
  let candidates = 0;
  for (let index = 0; index < values.length; index += concurrency) {
    if (Date.now() >= deadlineAt) break;
    const results = await Promise.all(values.slice(index, index + concurrency).map(worker));
    candidates += results.filter(Boolean).length;
  }
  return candidates;
}

/** Metadata ranks licensed candidates; publication requires a separate visual review. */
export function selectWikimediaPhotoCandidate(
  identity: WikimediaBuildingIdentity,
  pages: readonly CommonsSearchPage[],
): WikimediaPhotoCandidate | null {
  const building = normalizedIdentity(identity.name);
  if (building.length < 5 || !/\p{L}/u.test(identity.name)) return null;
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
    const providerContext = [
      title,
      plainMetadata(metadata?.ImageDescription?.value),
      plainMetadata(metadata?.ObjectName?.value),
      plainMetadata(metadata?.Categories?.value),
    ].filter(Boolean).join(' ');
    const commonsLocation = page.coordinates?.[0];
    const latitude = finiteNumber(commonsLocation?.lat);
    const longitude = finiteNumber(commonsLocation?.lon);
    const providerLocation = latitude !== null && longitude !== null
      ? { latitude, longitude }
      : null;
    const entityLocation = identity.latitude != null && identity.longitude != null
      ? { latitude: identity.latitude, longitude: identity.longitude }
      : null;
    const objectName = plainMetadata(metadata?.ObjectName?.value);
    const identityDecision = scorePhotoIdentity({
      market: identity.marketKey,
      canonicalName: identity.name,
      aliases: [],
      address: identity.address,
      postalCode: identity.postalCode ?? null,
      entityLocation,
      providerName: objectName || title,
      providerAddress: providerContext,
      providerLocation,
      hasPhoto: true,
    });
    if (identityDecision.disposition === 'reject'
      || (identityDecision.disposition === 'review' && !identityDecision.evidence.includes('country'))) continue;
    const width = typeof info.width === 'number' && Number.isFinite(info.width) ? info.width : 0;
    const height = typeof info.height === 'number' && Number.isFinite(info.height) ? info.height : 0;
    const pixels = width * height;
    if (pixels > 0 && pixels < 1_000_000) continue;
    candidates.push(Object.freeze({
      candidate: Object.freeze({
        title,
        width: width || null,
        height: height || null,
        assetUrl,
        sourcePageUrl,
        attributionName,
        licenseName,
        licenseUrl,
        ...identityDecision,
      }),
      score: pixels === 0 ? 1 : pixels * (width >= height ? 1.15 : 1),
    }));
  }
  return candidates.sort((left, right) => right.score - left.score)[0]?.candidate ?? null;
}

export async function discoverWikimediaCommonsPhotoCandidates(
  limit = 12,
  marketKey?: 'seoul' | 'singapore',
): Promise<PhotoCandidateDiscoveryResult> {
  const sql = contentDatabase();
  if (sql === null) return Object.freeze({ checked: 0, candidates: 0, entityIds: Object.freeze([]), state: 'not-configured' });
  const rows = await sql`
    SELECT entity.id AS entity_id, building.key, building.market_key, building.external_id, building.official_name,
      coalesce(building.road_address, building.legal_address) AS address,
      entity.postal_code, building.latitude, building.longitude,
      entity.local_attributes
    FROM buildings building
    JOIN property_entities entity ON entity.id = CASE
      WHEN building.market_key = 'seoul' THEN 'kr-seoul:estate:' || building.external_id
      WHEN building.market_key = 'singapore' THEN 'sg-' || building.key
    END
    LEFT JOIN (
      SELECT subject_entity_id, count(*)::bigint AS observation_count
      FROM observations
      WHERE status = 'active'
      GROUP BY subject_entity_id
    ) popularity ON popularity.subject_entity_id = entity.id
    WHERE building.identity_status = 'verified'
      AND (${marketKey ?? null}::text IS NULL OR building.market_key = ${marketKey ?? null})
      AND coalesce(building.road_address, building.legal_address) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM building_photos photo
        WHERE photo.building_key = building.key
          AND (photo.status = 'approved' OR (
            photo.status IN ('review_required', 'candidate') AND photo.candidate_source = 'wikimedia'
          ))
      )
      AND NOT EXISTS (
        SELECT 1 FROM building_enrichment_attempts attempt
        WHERE attempt.building_key = building.key
          AND attempt.pipeline = 'photo-wikimedia'
          AND attempt.next_retry_at > now()
      )
    ORDER BY
      coalesce(popularity.observation_count, 0) DESC,
      CASE WHEN building.market_key = 'singapore' AND building.key LIKE 'singapore:project:%' THEN 0 ELSE 1 END,
      CASE WHEN building.latitude IS NOT NULL AND building.longitude IS NOT NULL THEN 0 ELSE 1 END,
      building.key
    LIMIT ${Math.min(Math.max(limit, 1), 60)}
  `;
  const buildings = rows.flatMap((row): CandidateBuilding[] => (
    typeof row.entity_id === 'string' && typeof row.key === 'string'
      && ['seoul', 'singapore', 'dubai'].includes(String(row.market_key))
      && typeof row.external_id === 'string' && typeof row.official_name === 'string'
      && typeof row.address === 'string'
      ? [{
        entityId: row.entity_id,
        key: row.key,
        marketKey: row.market_key as CandidateBuilding['marketKey'],
        externalId: row.external_id,
        name: row.official_name,
        address: row.address,
        postalCode: typeof row.postal_code === 'string' ? row.postal_code : null,
        latitude: finiteNumber(row.latitude),
        longitude: finiteNumber(row.longitude),
        localAttributes: (row.local_attributes ?? {}) as CandidateBuilding['localAttributes'],
      }]
      : []
  ));
  let checked = 0;
  const checkedEntityIds: string[] = [];
  const candidates = await countCandidatesInBatches(buildings, async (building) => {
    if (building.marketKey === 'dubai') return false;
    const registryKey = candidatePhotoRegistryKey(building);
    if (registryKey === null) return false;
    checked += 1;
    checkedEntityIds.push(building.entityId);
    try {
      const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
      endpoint.search = new URLSearchParams({
        action: 'query', format: 'json', formatversion: '2', generator: 'search',
        gsrsearch: `"${building.name}" filetype:bitmap`, gsrnamespace: '6', gsrlimit: '3',
        prop: 'imageinfo|coordinates', iiprop: 'url|mime|size|extmetadata', iiurlwidth: '1600',
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
      const candidate = selectWikimediaPhotoCandidate({
        name: building.name,
        marketKey: building.marketKey,
        address: building.address,
        postalCode: building.postalCode,
        latitude: building.latitude,
        longitude: building.longitude,
      }, body.query?.pages ?? []);
      if (candidate === null) {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-wikimedia', status: 'no-candidate', reason: 'exact-licensed-image-not-found', retryAfter: 'month' });
        return false;
      }
      const written = await sql`
        INSERT INTO building_photos (
          building_key, registry_key, publication_registry_key, candidate_source,
          candidate_title, candidate_width, candidate_height,
          provider, asset_url, attribution_name, attribution_url,
          status, approved_at, approved_by, subject_kind, rights_status, source_page_url,
          visual_reviewed_at, match_policy_version, match_confidence, match_evidence, checked_at
        ) VALUES (
          ${building.key}, ${privatePhotoCandidateKey(building.key, 'wikimedia')}, ${registryKey}, 'wikimedia',
          ${candidate.title}, ${candidate.width}, ${candidate.height}, 'licensed-url', ${candidate.assetUrl},
          ${`${candidate.attributionName} · ${candidate.licenseName}`}, ${candidate.licenseUrl},
          'review_required', NULL, NULL,
          'building-exterior', 'licensed', ${candidate.sourcePageUrl},
          NULL, ${candidate.policyVersion},
          ${candidate.confidence}, ${JSON.stringify(candidate.evidence)}::jsonb, now()
        )
        ON CONFLICT (registry_key) DO UPDATE SET
          building_key = excluded.building_key,
          publication_registry_key = excluded.publication_registry_key,
          candidate_title = excluded.candidate_title,
          candidate_width = excluded.candidate_width,
          candidate_height = excluded.candidate_height,
          provider = excluded.provider,
          provider_place_id = NULL,
          asset_url = excluded.asset_url,
          attribution_name = excluded.attribution_name,
          attribution_url = excluded.attribution_url,
          status = excluded.status,
          approved_at = excluded.approved_at,
          approved_by = excluded.approved_by,
          subject_kind = excluded.subject_kind,
          rights_status = excluded.rights_status,
          source_page_url = excluded.source_page_url,
          visual_reviewed_at = excluded.visual_reviewed_at,
          match_policy_version = excluded.match_policy_version,
          match_confidence = excluded.match_confidence,
          match_evidence = excluded.match_evidence,
          checked_at = now(), updated_at = now()
        WHERE building_photos.status <> 'approved'
          AND NOT (
            building_photos.status IN ('rejected', 'broken')
            AND building_photos.source_page_url IS NOT DISTINCT FROM excluded.source_page_url
          )
        RETURNING id
      `;
      if (written.length === 0) {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-wikimedia', status: 'no-candidate', reason: 'previously-rejected-candidate', retryAfter: 'month' });
        return false;
      }
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
  return Object.freeze({
    checked,
    candidates,
    entityIds: Object.freeze(checkedEntityIds),
    state: 'ready',
  });
}

export async function discoverGooglePlacePhotoCandidates(
  limit = 12,
  marketKey?: 'seoul' | 'singapore',
): Promise<PhotoCandidateDiscoveryResult> {
  const sql = contentDatabase();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (sql === null || !apiKey) return Object.freeze({ checked: 0, candidates: 0, entityIds: Object.freeze([]), state: 'not-configured' });
  const rows = await sql`
    SELECT entity.id AS entity_id, building.key, building.market_key, building.external_id, building.official_name,
      coalesce(building.road_address, building.legal_address) AS address,
      entity.postal_code, building.latitude, building.longitude,
      entity.local_attributes
    FROM buildings building
    JOIN property_entities entity ON entity.id = CASE
      WHEN building.market_key = 'seoul' THEN 'kr-seoul:estate:' || building.external_id
      WHEN building.market_key = 'singapore' THEN 'sg-' || building.key
    END
    LEFT JOIN (
      SELECT subject_entity_id, count(*)::bigint AS observation_count
      FROM observations
      WHERE status = 'active'
      GROUP BY subject_entity_id
    ) popularity ON popularity.subject_entity_id = entity.id
    WHERE building.identity_status = 'verified'
      AND (${marketKey ?? null}::text IS NULL OR building.market_key = ${marketKey ?? null})
      AND coalesce(building.road_address, building.legal_address) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM building_photos photo
        WHERE photo.building_key = building.key
          AND (photo.status = 'approved' OR (
            photo.status IN ('review_required', 'candidate') AND photo.candidate_source = 'google'
          ))
      )
      AND NOT EXISTS (
        SELECT 1 FROM building_enrichment_attempts attempt
        WHERE attempt.building_key = building.key
          AND attempt.pipeline = 'photo-google'
          AND attempt.next_retry_at > now()
      )
    ORDER BY
      coalesce(popularity.observation_count, 0) DESC,
      CASE WHEN building.market_key = 'singapore' AND building.key LIKE 'singapore:project:%' THEN 0 ELSE 1 END,
      CASE WHEN building.latitude IS NOT NULL AND building.longitude IS NOT NULL THEN 0 ELSE 1 END,
      building.key
    LIMIT ${Math.min(Math.max(limit, 1), 30)}
  `;
  const buildings = rows.flatMap((row): CandidateBuilding[] => (
    typeof row.entity_id === 'string' && typeof row.key === 'string'
      && ['seoul', 'singapore', 'dubai'].includes(String(row.market_key))
      && typeof row.external_id === 'string' && typeof row.official_name === 'string'
      && typeof row.address === 'string'
      ? [{
        entityId: row.entity_id,
        key: row.key,
        marketKey: row.market_key as CandidateBuilding['marketKey'],
        externalId: row.external_id,
        name: row.official_name,
        address: row.address,
        postalCode: typeof row.postal_code === 'string' ? row.postal_code : null,
        latitude: finiteNumber(row.latitude),
        longitude: finiteNumber(row.longitude),
        localAttributes: (row.local_attributes ?? {}) as CandidateBuilding['localAttributes'],
      }]
      : []
  ));
  let terminalProviderError: string | null = null;
  let checked = 0;
  const checkedEntityIds: string[] = [];
  const discover = async (building: CandidateBuilding) => {
    if (building.marketKey === 'dubai') return false;
    const registryKey = candidatePhotoRegistryKey(building);
    if (registryKey === null) return false;
    checked += 1;
    checkedEntityIds.push(building.entityId);
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.photos',
        },
        body: JSON.stringify({ textQuery: `${building.name}, ${building.address}`, maxResultCount: 1, languageCode: building.marketKey === 'seoul' ? 'ko' : 'en' }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        if ([401, 403].includes(response.status)) terminalProviderError = `http-${response.status}`;
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-google', status: 'provider-error', reason: `http-${response.status}`, retryAfter: 'day' });
        return false;
      }
      const body = await response.json() as Readonly<{ places?: readonly Readonly<{
        id?: unknown;
        displayName?: Readonly<{ text?: unknown }>;
        formattedAddress?: unknown;
        location?: Readonly<{ latitude?: unknown; longitude?: unknown }>;
        googleMapsUri?: unknown;
        photos?: readonly unknown[];
      }>[] }>;
      const place = body.places?.[0];
      const placeId = typeof place?.id === 'string' ? place.id : null;
      const placeName = typeof place?.displayName?.text === 'string' ? place.displayName.text : '';
      const placeAddress = typeof place?.formattedAddress === 'string' ? place.formattedAddress : '';
      const placeLatitude = finiteNumber(place?.location?.latitude);
      const placeLongitude = finiteNumber(place?.location?.longitude);
      const placeLocation = placeLatitude !== null && placeLongitude !== null
        ? { latitude: placeLatitude, longitude: placeLongitude }
        : null;
      const identity = decideGooglePhotoCandidate({
        marketKey: building.marketKey,
        name: building.name,
        address: building.address,
        postalCode: building.postalCode,
        latitude: building.latitude,
        longitude: building.longitude,
      }, {
        displayName: placeName,
        formattedAddress: placeAddress,
        location: placeLocation,
        hasPhoto: (place?.photos?.length ?? 0) > 0,
      });
      if (placeId === null || identity.disposition === 'reject') {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-google', status: 'no-candidate', reason: 'exact-place-with-photo-not-found', retryAfter: 'month' });
        return false;
      }
      const providerSourceUri = safeHttpUrl(place?.googleMapsUri);
      const written = await sql`
        INSERT INTO building_photos (
          building_key, registry_key, publication_registry_key, candidate_source, candidate_title,
          provider, provider_place_id, status,
          approved_at, approved_by, attribution_name, attribution_url,
          subject_kind, rights_status, source_page_url, visual_reviewed_at,
          match_policy_version, match_confidence, match_evidence,
          provider_source_uri, provider_checked_at, checked_at
        ) VALUES (
          ${building.key}, ${privatePhotoCandidateKey(building.key, 'google')}, ${registryKey}, 'google', ${placeName},
          'google-place', ${placeId}, 'review_required', NULL, NULL,
          'Google Maps', ${providerSourceUri}, 'building-exterior', 'provider-display-only',
          ${providerSourceUri}, NULL,
          ${identity.policyVersion}, ${identity.confidence}, ${JSON.stringify(identity.evidence)}::jsonb,
          ${providerSourceUri}, now(), now()
        )
        ON CONFLICT (registry_key) DO UPDATE SET
          building_key = excluded.building_key,
          publication_registry_key = excluded.publication_registry_key,
          candidate_title = excluded.candidate_title,
          provider = excluded.provider,
          provider_place_id = excluded.provider_place_id,
          asset_url = NULL,
          attribution_name = excluded.attribution_name,
          attribution_url = excluded.attribution_url,
          status = excluded.status,
          approved_at = excluded.approved_at,
          approved_by = excluded.approved_by,
          subject_kind = excluded.subject_kind,
          rights_status = excluded.rights_status,
          source_page_url = excluded.source_page_url,
          visual_reviewed_at = excluded.visual_reviewed_at,
          match_policy_version = excluded.match_policy_version,
          match_confidence = excluded.match_confidence,
          match_evidence = excluded.match_evidence,
          provider_source_uri = excluded.provider_source_uri,
          provider_checked_at = excluded.provider_checked_at,
          checked_at = now(), updated_at = now()
        WHERE building_photos.status <> 'approved'
          AND NOT (
            building_photos.status IN ('rejected', 'broken')
            AND building_photos.provider_place_id IS NOT DISTINCT FROM excluded.provider_place_id
          )
        RETURNING id
      `;
      if (written.length === 0) {
        await recordEnrichmentAttempt({ buildingKey: building.key, pipeline: 'photo-google', status: 'no-candidate', reason: 'previously-rejected-candidate', retryAfter: 'month' });
        return false;
      }
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
  };
  let candidates = 0;
  const deadlineAt = Date.now() + 45_000;
  const first = buildings[0];
  if (first !== undefined) candidates += await discover(first) ? 1 : 0;
  if (terminalProviderError !== null) {
    return Object.freeze({
      checked,
      candidates,
      entityIds: Object.freeze(checkedEntityIds),
      state: 'provider-error',
      reason: terminalProviderError,
    });
  }
  candidates += await countCandidatesInBatches(buildings.slice(1), async (building) => {
    if (terminalProviderError !== null) return false;
    return discover(building);
  }, 5, deadlineAt);
  return Object.freeze({
    checked,
    candidates,
    entityIds: Object.freeze(checkedEntityIds),
    state: terminalProviderError === null ? 'ready' : 'provider-error',
    ...(terminalProviderError === null ? {} : { reason: terminalProviderError }),
  });
}
