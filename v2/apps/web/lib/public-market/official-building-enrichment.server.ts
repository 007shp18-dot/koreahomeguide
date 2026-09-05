import 'server-only';

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent';

import { contentDatabase } from '../db/postgres.server';
import { storeBuildingFacts, type BuildingFactsIdentity } from './building-facts-store.server';
import { loadOfficialBuildingFacts } from './official-building-facts.server';

type Candidate = BuildingFactsIdentity & Readonly<{ buildingKey: string }>;

async function recordAttempt(
  buildingKey: string,
  status: 'succeeded' | 'no-candidate' | 'provider-error',
  reason: string | null,
  retryDays: number,
): Promise<void> {
  const sql = contentDatabase();
  if (sql === null) return;
  await sql`
    INSERT INTO building_enrichment_attempts (
      building_key, pipeline, status, reason, attempted_at, next_retry_at
    ) VALUES (
      ${buildingKey}, 'official-building-facts', ${status}, ${reason}, now(),
      now() + (${retryDays}::text || ' days')::interval
    )
    ON CONFLICT (building_key, pipeline) DO UPDATE SET
      status = excluded.status,
      reason = excluded.reason,
      attempted_at = now(),
      next_retry_at = excluded.next_retry_at,
      updated_at = now()
  `;
}

export async function enrichOfficialBuildingFacts(limit = 4): Promise<Readonly<{
  state: 'ready' | 'not-configured';
  checked: number;
  stored: number;
  unavailable: number;
}>> {
  const sql = contentDatabase();
  const serviceKey = (process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY
    ?? process.env.DATA_GO_KR_SERVICE_KEY)?.trim();
  if (sql === null || !serviceKey) {
    return Object.freeze({ state: 'not-configured', checked: 0, stored: 0, unavailable: 0 });
  }
  const rows = await sql`
    SELECT building.key, building.external_id, building.official_name,
      entity.local_attributes
    FROM buildings AS building
    INNER JOIN property_entities AS entity
      ON entity.id = 'kr-seoul:estate:' || building.external_id
    WHERE building.market_key = 'seoul'
      AND entity.local_attributes ->> 'housingType' = 'apartment'
      AND NOT EXISTS (
        SELECT 1 FROM building_facts AS facts
        WHERE facts.building_key = building.key
          AND facts.checked_at >= now() - interval '30 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM building_enrichment_attempts AS attempt
        WHERE attempt.building_key = building.key
          AND attempt.pipeline = 'official-building-facts'
          AND attempt.next_retry_at > now()
      )
    ORDER BY building.key
    LIMIT ${Math.min(Math.max(limit, 1), 12)}
  `;
  const districtCodes = new Map<string, string>(SEOUL_RENT_CHECK_DISTRICTS.map((district) => [district.slug, district.lawdCd]));
  const candidates = rows.flatMap((row): Candidate[] => {
    const attributes = row.local_attributes;
    if (typeof row.key !== 'string' || typeof row.external_id !== 'string'
      || typeof row.official_name !== 'string' || typeof attributes !== 'object'
      || attributes === null || Array.isArray(attributes)) return [];
    const local = attributes as Record<string, unknown>;
    const districtSlug = typeof local.districtSlug === 'string' ? local.districtSlug : '';
    const districtLawdCd = districtCodes.get(districtSlug);
    const neighborhoodName = typeof local.neighborhoodName === 'string' ? local.neighborhoodName : '';
    if (districtLawdCd === undefined || neighborhoodName === '') return [];
    return [{
      buildingKey: row.key,
      districtSlug,
      buildingId: row.external_id,
      districtLawdCd,
      neighborhoodName,
      officialName: row.official_name,
      housingType: 'apartment',
    }];
  });
  const results = await Promise.all(candidates.map(async (candidate) => {
    const facts = await loadOfficialBuildingFacts({
      districtLawdCd: candidate.districtLawdCd,
      neighborhoodName: candidate.neighborhoodName,
      officialName: candidate.officialName,
      housingType: candidate.housingType,
      serviceKey,
      fetch: globalThis.fetch,
    });
    if (facts.status === 'ready') {
      await storeBuildingFacts(candidate, facts);
      await recordAttempt(candidate.buildingKey, 'succeeded', null, 30);
      return 'stored' as const;
    }
    const retryDays = facts.reason === 'provider_unavailable' ? 1 : 30;
    await recordAttempt(
      candidate.buildingKey,
      facts.reason === 'provider_unavailable' ? 'provider-error' : 'no-candidate',
      facts.reason,
      retryDays,
    );
    return 'unavailable' as const;
  }));
  return Object.freeze({
    state: 'ready',
    checked: candidates.length,
    stored: results.filter((result) => result === 'stored').length,
    unavailable: results.filter((result) => result === 'unavailable').length,
  });
}
