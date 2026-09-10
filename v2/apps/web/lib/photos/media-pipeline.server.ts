import 'server-only';
import type { SqlPort } from '../evidence-pool/repository.server';

// One row per canonical entity: counts cannot be inflated by multiple photos,
// contracts, or location candidates. This is an operations-only inventory.
export const MEDIA_PIPELINE_SQL = `WITH photos AS (
  SELECT building_key,
    bool_or(status='approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL
      AND visual_reviewed_at IS NOT NULL AND rights_status IN ('licensed','owned','provider-display-only')
      AND subject_kind IN ('building-exterior','building-front','site-aerial')) AS approved,
    bool_or(status IN ('candidate','review_required') AND rights_status IN ('licensed','owned','provider-display-only')) AS reviewable,
    bool_or(status IN ('candidate','review_required') AND rights_status NOT IN ('licensed','owned','provider-display-only')) AS rights_blocked
  FROM building_photos GROUP BY building_key
), attempts AS (
  SELECT building_key,
    bool_or(status='provider-error') AS provider_error,
    count(DISTINCT pipeline) FILTER (WHERE status IN ('succeeded','no-candidate')) AS finished
  FROM building_enrichment_attempts WHERE pipeline IN ('photo-google','photo-wikimedia') GROUP BY building_key
), published AS (
  SELECT DISTINCT pm.entity_id
  FROM public_entity_media pm JOIN media_assets ma ON ma.id=pm.media_asset_id
  JOIN rights_policies rp ON rp.id=ma.rights_policy_id AND rp.can_display
  JOIN building_photos bp ON bp.registry_key=ma.legacy_registry_key
  JOIN property_entities e ON e.id=pm.entity_id AND e.identity_status='verified'
  WHERE bp.building_key=e.local_attributes->>'legacyBuildingKey'
    AND ma.review_state='approved' AND bp.status='approved'
    AND bp.approved_at IS NOT NULL AND bp.approved_by IS NOT NULL AND bp.visual_reviewed_at IS NOT NULL
    AND bp.rights_status IN ('licensed','owned','provider-display-only')
), locations AS (
  SELECT DISTINCT l.entity_id FROM public_entity_locations l
  JOIN rights_policies rp ON rp.id=l.rights_policy_id AND rp.can_display
  WHERE l.verification_status='verified'
), classified AS (
  SELECT e.market_id, e.kind,
    CASE WHEN e.identity_status <> 'verified' THEN 'identity-unverified'
      WHEN b.key IS NULL THEN 'building-unlinked'
      WHEN b.identity_status <> 'verified' THEN 'identity-unverified'
      WHEN p.approved THEN CASE WHEN pub.entity_id IS NULL THEN 'publication-pending' ELSE 'published' END
      WHEN nullif(trim(coalesce(b.road_address,b.legal_address)),'') IS NULL THEN 'address-missing'
      WHEN p.reviewable THEN 'visual-review'
      WHEN a.provider_error THEN 'provider-error'
      WHEN a.finished=2 THEN 'no-usable-result'
      WHEN p.rights_blocked THEN 'rights-blocked'
      ELSE 'discovery-incomplete' END AS stage,
    e.latitude IS NOT NULL AND e.longitude IS NOT NULL AS has_coordinates,
    l.entity_id IS NOT NULL AS public_coordinates
  FROM property_entities e LEFT JOIN buildings b ON b.key=e.local_attributes->>'legacyBuildingKey'
  LEFT JOIN photos p ON p.building_key=b.key LEFT JOIN attempts a ON a.building_key=b.key
  LEFT JOIN published pub ON pub.entity_id=e.id LEFT JOIN locations l ON l.entity_id=e.id
  WHERE e.market_id IN ('kr-seoul','sg-singapore','ae-dubai')
)
SELECT market_id AS market,kind,stage,count(*)::integer AS count,
  count(*) FILTER(WHERE has_coordinates)::integer AS coordinates,
  count(*) FILTER(WHERE public_coordinates)::integer AS public_coordinates
FROM classified GROUP BY market_id,kind,stage ORDER BY market_id,kind,stage`;

export type MediaPipelineRow = {market:string;kind:string;stage:string;count:number;coordinates:number;publicCoordinates:number};
export async function mediaPipeline(sql: SqlPort): Promise<MediaPipelineRow[]> {
  return (await sql.query(MEDIA_PIPELINE_SQL)).map(r=>({market:String(r.market),kind:String(r.kind),stage:String(r.stage),count:Number(r.count),coordinates:Number(r.coordinates),publicCoordinates:Number(r.public_coordinates)}));
}
