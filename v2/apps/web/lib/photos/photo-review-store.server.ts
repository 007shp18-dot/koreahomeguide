import 'server-only';

import { contentDatabase } from '../db/postgres.server';

type Row = Readonly<Record<string, unknown>>;
type Port = Readonly<{ query(sql: string, parameters: readonly unknown[]): Promise<readonly Row[]> }>;
export type PhotoCandidateSource = 'wikimedia' | 'google' | 'naver-search' | 'manual';
export type PhotoReviewDecision = Readonly<{
  candidateId: string;
  checkedAt: string;
  decision: 'approve' | 'reject' | 'broken';
  note: string;
  visualReviewed?: true;
  subjectKind?: 'building-exterior' | 'building-front' | 'site-aerial';
}>;
export type PhotoReviewFilter = Readonly<{
  afterId?: string;
  limit?: number;
  source?: PhotoCandidateSource;
  market?: 'seoul' | 'singapore' | 'dubai';
  status?: 'pending' | 'approved';
}>;

const SOURCES = ['wikimedia', 'google', 'naver-search', 'manual'];
const MARKETS = ['seoul', 'singapore', 'dubai'];
const ID = /^[1-9]\d{0,17}$/;

export function parsePhotoReviewDecision(value: unknown): PhotoReviewDecision | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !['candidateId', 'checkedAt', 'decision', 'note', 'visualReviewed', 'subjectKind'].includes(key))
    || typeof row.candidateId !== 'string' || !ID.test(row.candidateId)
    || typeof row.checkedAt !== 'string' || row.checkedAt.length > 40 || !Number.isFinite(Date.parse(row.checkedAt))
    || !['approve', 'reject', 'broken'].includes(String(row.decision))
    || typeof row.note !== 'string' || row.note.trim().length < 12 || row.note.length > 1500) return null;
  if (row.decision === 'approve' && (row.visualReviewed !== true
    || !['building-exterior', 'building-front', 'site-aerial'].includes(String(row.subjectKind)))) return null;
  if (row.visualReviewed !== undefined && row.visualReviewed !== true) return null;
  if (row.subjectKind !== undefined && !['building-exterior', 'building-front', 'site-aerial'].includes(String(row.subjectKind))) return null;
  return Object.freeze({
    candidateId: row.candidateId, checkedAt: row.checkedAt,
    decision: row.decision as PhotoReviewDecision['decision'], note: row.note.trim(),
    ...(row.visualReviewed === true ? { visualReviewed: true as const } : {}),
    ...(row.subjectKind === undefined ? {} : { subjectKind: row.subjectKind as PhotoReviewDecision['subjectKind'] }),
  });
}

const COLUMNS = `photo.id::text AS "candidateId", photo.publication_registry_key AS "publicationRegistryKey",
  photo.registry_key AS "privateRegistryKey", photo.building_key AS "buildingKey",
  building.market_key AS "marketKey", building.official_name AS "buildingName",
  coalesce(building.road_address, building.legal_address) AS address,
  building.identity_status AS "identityStatus", building.latitude, building.longitude,
  photo.candidate_source AS source, photo.candidate_title AS title,
  photo.candidate_width AS width, photo.candidate_height AS height,
  photo.provider, photo.provider_place_id AS "placeId", photo.asset_url AS "assetUrl",
  photo.attribution_name AS "attributionName", photo.attribution_url AS "attributionUrl",
  photo.source_page_url AS "sourcePageUrl", photo.rights_status AS "rightsStatus",
  photo.match_policy_version AS "matchPolicyVersion", photo.match_confidence AS confidence,
  photo.match_evidence AS evidence, photo.subject_kind AS "subjectKind",
  photo.status, photo.checked_at::text AS "checkedAt", photo.approved_by AS "approvedBy"`;

const LIST_SQL = `/* photo-review:list */
  SELECT ${COLUMNS},
    (SELECT count(*)::integer FROM building_photos duplicate
      WHERE photo.asset_url IS NOT NULL AND duplicate.asset_url = photo.asset_url
    ) AS "assetUseCount"
  FROM building_photos photo JOIN buildings building ON building.key = photo.building_key
  WHERE photo.id > $1::bigint
    AND (($5 = 'pending' AND photo.status IN ('candidate', 'review_required'))
      OR ($5 = 'approved' AND photo.status = 'approved'))
    AND ($2::text IS NULL OR photo.candidate_source = $2)
    AND ($3::text IS NULL OR building.market_key = $3)
  ORDER BY photo.id ASC LIMIT $4`;

const FIND_SQL = `/* photo-review:find */
  SELECT ${COLUMNS} FROM building_photos photo
  JOIN buildings building ON building.key = photo.building_key
  WHERE photo.id = $1::bigint`;

// Version matching prevents a newly fetched image from inheriting a decision
// about its predecessor. The decision and audit event are a single statement.
const REVIEW_SQL = `/* photo-review:transition */
  WITH target AS (
    SELECT photo.* FROM building_photos photo
    WHERE photo.id = $1::bigint AND photo.checked_at = $2::timestamptz
      AND photo.status IN ('candidate', 'review_required', 'approved')
    FOR UPDATE
  ), changed AS (
    UPDATE building_photos photo SET
      status = CASE $3 WHEN 'approve' THEN 'approved' WHEN 'broken' THEN 'broken' ELSE 'rejected' END,
      subject_kind = CASE WHEN $3 = 'approve' THEN $5 ELSE photo.subject_kind END,
      approved_at = CASE WHEN $3 = 'approve' THEN now() ELSE NULL END,
      approved_by = CASE WHEN $3 = 'approve' THEN 'content-admin-visual-review' ELSE NULL END,
      visual_reviewed_at = CASE WHEN $3 = 'approve' THEN now() ELSE NULL END,
      checked_at = now(), updated_at = now()
    FROM target WHERE photo.id = target.id
      AND ($3 <> 'approve' OR NOT EXISTS (
        SELECT 1 FROM building_photos existing
        WHERE existing.publication_registry_key = target.publication_registry_key
          AND existing.status = 'approved' AND existing.id <> target.id
      ))
    RETURNING photo.id, photo.status, photo.publication_registry_key,
      jsonb_build_object('buildingKey', target.building_key,
        'assetUrl', target.asset_url, 'placeId', target.provider_place_id,
        'sourcePageUrl', target.source_page_url, 'attributionUrl', target.attribution_url,
        'rightsStatus', target.rights_status, 'previousStatus', target.status,
        'checkedAt', target.checked_at, 'visualReviewed', $3 = 'approve',
        'subjectKind', photo.subject_kind) AS evidence
  ), event AS (
    INSERT INTO building_photo_review_events (photo_id, decision, actor, note, evidence)
    SELECT id, $3, 'content-admin-api', $4, evidence FROM changed RETURNING photo_id
  )
  SELECT changed.id::text AS "candidateId", changed.status,
    changed.publication_registry_key AS "publicationRegistryKey"
  FROM changed JOIN event ON event.photo_id = changed.id`;

function httpsUrl(value: unknown): URL | null {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' ? url : null; } catch { return null; }
}

export function photoCandidateHasRightsEvidence(row: Row): boolean {
  const source = httpsUrl(row.sourcePageUrl);
  if (source === null || row.identityStatus !== 'verified') return false;
  if (row.provider === 'google-place') return row.source === 'google'
    && row.rightsStatus === 'provider-display-only' && typeof row.placeId === 'string' && row.placeId.length > 0
    && ['maps.google.com', 'www.google.com', 'google.com', 'maps.app.goo.gl'].includes(source.hostname);
  const license = httpsUrl(row.attributionUrl);
  const asset = httpsUrl(row.assetUrl);
  return row.source === 'wikimedia' && row.provider === 'licensed-url' && row.rightsStatus === 'licensed'
    && source.hostname === 'commons.wikimedia.org' && source.pathname.startsWith('/wiki/File:')
    && asset !== null && ['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(asset.hostname)
    && source.href !== asset.href
    && typeof row.attributionName === 'string' && row.attributionName.trim().length > 0
    && license !== null && license.hostname === 'creativecommons.org'
    && /^\/(?:licenses\/by(?:-sa)?\/\d\.\d|publicdomain\/(?:zero|mark)\/1\.0)(?:\/|$)/.test(license.pathname);
}

export function createPhotoReviewStore(port: Port) {
  return Object.freeze({
    async list(filter: PhotoReviewFilter = {}) {
      const limit = filter.limit ?? 50;
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100
        || (filter.afterId !== undefined && !ID.test(filter.afterId))
        || (filter.source !== undefined && !SOURCES.includes(filter.source))
        || (filter.market !== undefined && !MARKETS.includes(filter.market))
        || (filter.status !== undefined && !['pending', 'approved'].includes(filter.status))) throw new TypeError('Invalid review filter.');
      const rows = await port.query(LIST_SQL, [filter.afterId ?? '0', filter.source ?? null, filter.market ?? null, limit + 1, filter.status ?? 'pending']);
      return Object.freeze({
        items: Object.freeze(rows.slice(0, limit)),
        nextCursor: rows.length > limit ? String(rows[limit - 1]!.candidateId) : null,
      });
    },
    async review(decision: PhotoReviewDecision) {
      if (parsePhotoReviewDecision(decision) === null) throw new TypeError('Invalid review decision.');
      const [row] = await port.query(FIND_SQL, [decision.candidateId]);
      if (!row) return Object.freeze({ state: 'not-found' as const });
      if (decision.decision === 'approve' && !photoCandidateHasRightsEvidence(row)) {
        return Object.freeze({ state: 'rights-evidence-required' as const });
      }
      try {
        const [changed] = await port.query(REVIEW_SQL, [decision.candidateId, decision.checkedAt, decision.decision, decision.note, decision.subjectKind ?? null]);
        return changed ? Object.freeze({ state: 'reviewed' as const, ...changed }) : Object.freeze({ state: 'conflict' as const });
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return Object.freeze({ state: 'conflict' as const });
        throw error;
      }
    },
  });
}

export function photoReviewStoreFromEnvironment() {
  const sql = contentDatabase();
  if (!sql) throw new Error('database_not_configured');
  return createPhotoReviewStore({ query: (statement, parameters) => sql.query(statement, [...parameters]) });
}
