/** A place association is not a visual approval of an exterior photograph. */
export const PROVIDER_PHOTO_READY_SQL = `(
  photo.provider = 'google-place'
  AND photo.candidate_source = 'google'
  AND photo.status IN ('candidate', 'review_required')
  AND photo.rights_status = 'provider-display-only'
  AND photo.provider_place_id IS NOT NULL
  AND photo.provider_checked_at IS NOT NULL
  AND photo.match_policy_version = 'photo-identity-v2'
  AND photo.match_confidence >= 0.95
  AND photo.match_evidence @> '["name", "country"]'::jsonb
  AND (photo.match_evidence ? 'address' OR photo.match_evidence ? 'postal-code'
    OR photo.match_evidence ? 'distance<=250m')
  AND photo.source_page_url ~ '^https://(www\\.google\\.com|maps\\.google\\.com|google\\.com|maps\\.app\\.goo\\.gl)/'
)`;

export function providerPhotoReady(row: Readonly<Record<string, unknown>>): boolean {
  const evidence = Array.isArray(row.match_evidence) ? row.match_evidence : [];
  return row.provider === 'google-place' && row.candidate_source === 'google'
    && ['candidate', 'review_required'].includes(String(row.status))
    && row.rights_status === 'provider-display-only'
    && typeof row.provider_place_id === 'string' && row.provider_place_id.length > 0
    && row.provider_checked_at != null
    && row.match_policy_version === 'photo-identity-v2'
    && Number(row.match_confidence) >= 0.95
    && evidence.includes('name') && evidence.includes('country')
    && ['address', 'postal-code', 'distance<=250m'].some(item => evidence.includes(item))
    && typeof row.source_page_url === 'string'
    && /^https:\/\/(www\.google\.com|maps\.google\.com|google\.com|maps\.app\.goo\.gl)\//.test(row.source_page_url);
}
