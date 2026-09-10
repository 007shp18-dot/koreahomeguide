-- $1: JSON produced by prepare-seoul-official-coordinates.py.
-- Requires the reviewed seoul-oa-15818-v1 rights policy. No geocoding API calls.
WITH source AS (
  SELECT * FROM jsonb_to_recordset(($1::jsonb)->'records')
    AS r(code text, name text, address text, latitude double precision, longitude double precision)
), candidates AS (
  SELECT b.key, e.id AS entity_id, s.*
  FROM source s
  JOIN building_facts f ON f.kapt_code = s.code
  JOIN buildings b ON b.key = f.building_key AND b.market_key = 'seoul'
  JOIN property_entities e ON e.id = 'kr-seoul:estate:' || b.external_id AND e.market_id = 'kr-seoul'
  JOIN rights_policies rights ON rights.id = 'seoul-oa-15818-v1'
    AND rights.can_store AND rights.can_display AND rights.can_use_commercially
  WHERE b.identity_status = 'verified' AND e.identity_status = 'verified'
    AND s.latitude BETWEEN 37.4 AND 37.72 AND s.longitude BETWEEN 126.75 AND 127.25
    AND regexp_replace(b.road_address, '\s+', '', 'g') = regexp_replace(s.address, '\s+', '', 'g')
    AND b.latitude IS NULL AND b.longitude IS NULL
    AND e.latitude IS NULL AND e.longitude IS NULL
    AND (SELECT count(*) FROM source other WHERE other.code = s.code) = 1
    AND NOT EXISTS (SELECT 1 FROM public_entity_locations old WHERE old.entity_id=e.id AND old.verification_status='verified')
), buildings_updated AS (
  UPDATE buildings b SET latitude=c.latitude, longitude=c.longitude, updated_at=now()
  FROM candidates c WHERE b.key=c.key AND b.latitude IS NULL AND b.longitude IS NULL
  RETURNING b.key
), entities_updated AS (
  UPDATE property_entities e SET latitude=c.latitude, longitude=c.longitude, updated_at=now(),
    local_attributes=e.local_attributes || jsonb_build_object(
      'locationPrecision','parcel','locationProvider','Seoul Metropolitan Government OA-15818',
      'locationProviderReference',c.code,'locationRightsPolicyId','seoul-oa-15818-v1',
      'locationVerificationStatus','verified','locationSourceSha256',($1::jsonb)->>'sourceSha256',
      'locationMatchMethod','kapt-code-and-exact-road-address')
  FROM candidates c JOIN buildings_updated b ON b.key=c.key
  WHERE e.id=c.entity_id AND e.latitude IS NULL AND e.longitude IS NULL
  RETURNING e.id
), published AS (
  INSERT INTO public_entity_locations(entity_id,market_id,latitude,longitude,precision,provider,
    provider_reference,rights_policy_id,verification_status,verified_at,updated_at)
  SELECT c.entity_id,'kr-seoul',c.latitude,c.longitude,'parcel','Seoul Metropolitan Government OA-15818',
    c.code,'seoul-oa-15818-v1','verified',now(),now()
  FROM candidates c JOIN entities_updated e ON e.id=c.entity_id
  ON CONFLICT (entity_id) WHERE verification_status='verified' DO NOTHING
  RETURNING entity_id
)
SELECT (SELECT count(*) FROM candidates) AS matched,
  (SELECT count(*) FROM buildings_updated) AS buildings,
  (SELECT count(*) FROM entities_updated) AS entities,
  (SELECT count(*) FROM published) AS published;
