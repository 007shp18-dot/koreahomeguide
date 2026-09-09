import 'server-only';

// Read-time classification preserves the original values and review history.
export const classified = `WITH duplicates AS (
  SELECT e.*, count(*) FILTER (WHERE status NOT IN ('withdrawn','rejected')) OVER (PARTITION BY data - ARRAY['sourceId','url','tier','expiresOn'])
    > CASE WHEN status IN ('withdrawn','rejected') THEN 0 ELSE 1 END AS duplicate
  FROM property_pool_evidence e
), classified AS (
  SELECT e.*, CASE
    WHEN coalesce(d.duplicate, false) THEN 'duplicate'
    WHEN e.data->>'expiresOn' < to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      OR (e.data->>'observedOn')::date > (now() AT TIME ZONE 'UTC')::date
      OR (e.data->>'observedOn')::date < (now() AT TIME ZONE 'UTC')::date - CASE WHEN e.data->>'metric' = 'rent' THEN 180 ELSE 365 END THEN 'outdated'
    WHEN (e.data->>'amount')::numeric <= 0
      OR coalesce(trim(e.data->>'conditions'), '') = ''
      OR (e.data->>'metric' IN ('sale_price','rent','service_charge') AND coalesce(trim(e.data->>'address'),'') = '' AND coalesce(trim(e.data->>'building'),'') = '')
      OR (e.data->>'metric' IN ('sale_price','rent') AND (e.data->>'sizeSqm' IS NULL OR coalesce(trim(e.data->>'housingType'),'') = ''))
      OR (e.data->>'metric' IN ('rent','service_charge') AND e.data->>'unit' NOT IN ('monthly','annual') AND coalesce(e.data->>'billingPeriod','') NOT IN ('monthly','annual'))
      OR (e.data->>'metric' = 'sale_price' AND e.data->>'unit' NOT IN ('total','sqm')) THEN 'incomplete'
    ELSE 'qualified' END AS quality, coalesce(d.duplicate, false) AS duplicate
  FROM property_pool_evidence e LEFT JOIN duplicates d ON d.id = e.id
)`;
export const filterWhere = `($1::text = '' OR e.data->>'market' = $1)
  AND ($2::text = '' OR e.status = $2 OR ($2 = 'expired' AND e.data->>'expiresOn' < to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD')))
  AND ($3::text = '' OR strpos(lower(concat(e.data->>'area', ' ', e.data->>'building', ' ', s.name)), lower($3)) > 0)
  AND ($4::text = '' OR e.quality = $4)`;
