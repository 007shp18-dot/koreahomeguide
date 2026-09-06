import 'server-only';

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent';

import { contentDatabase } from '../db/postgres.server';
import { storeBuildingFacts, type BuildingFactsIdentity } from './building-facts-store.server';
import { installedKaptBuildingFactsSnapshot } from './kapt-building-facts-snapshot.server';
import { loadOfficialBuildingFacts, type OfficialBuildingFacts } from './official-building-facts.server';

type Candidate = BuildingFactsIdentity & Readonly<{ buildingKey: string }>;
type SnapshotCandidate = Candidate & Readonly<{
  facts: Extract<OfficialBuildingFacts, { status: 'ready' }>;
}>;

type Dependencies = Readonly<{
  serviceKey?: string;
  snapshotAvailable(): boolean;
  loadSnapshotCandidates(limit: number): Promise<readonly SnapshotCandidate[]>;
  loadOnlineCandidates(limit: number): Promise<readonly Candidate[]>;
  store(
    identity: BuildingFactsIdentity,
    facts: Extract<OfficialBuildingFacts, { status: 'ready' }>,
  ): Promise<void>;
  recordAttempt(
    buildingKey: string,
    status: 'succeeded' | 'no-candidate' | 'provider-error',
    reason: string | null,
    retryDays: number,
  ): Promise<void>;
  loadOnline: typeof loadOfficialBuildingFacts;
}>;

async function defaultRecordAttempt(
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

function candidateRows(rows: readonly Record<string, unknown>[]): readonly Candidate[] {
  const districtCodes = new Map<string, string>(SEOUL_RENT_CHECK_DISTRICTS.map((district) => [district.slug, district.lawdCd]));
  return rows.flatMap((row): Candidate[] => {
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
}

async function defaultOnlineCandidates(limit: number): Promise<readonly Candidate[]> {
  const sql = contentDatabase();
  if (sql === null) return [];
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
    LIMIT ${limit}
  `;
  return candidateRows(rows);
}

function normalizedName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[^\p{L}\p{N}]+/gu, '');
}

async function defaultSnapshotCandidates(limit: number): Promise<readonly SnapshotCandidate[]> {
  const sql = contentDatabase();
  const snapshot = installedKaptBuildingFactsSnapshot();
  if (sql === null || snapshot === null) return [];
  const snapshotRecords = snapshot.records();
  if (snapshotRecords.length === 0) return [];
  const externalIds = snapshotRecords.map((record) => record.buildingId);
  const rows = await sql`
    SELECT building.key, building.external_id, building.official_name,
      entity.local_attributes
    FROM buildings AS building
    INNER JOIN property_entities AS entity
      ON entity.id = 'kr-seoul:estate:' || building.external_id
    WHERE building.market_key = 'seoul'
      AND building.external_id = ANY(${externalIds}::text[])
      AND entity.local_attributes ->> 'housingType' = 'apartment'
      AND NOT EXISTS (
        SELECT 1 FROM building_facts AS facts
        WHERE facts.building_key = building.key
          AND facts.checked_at >= now() - interval '30 days'
      )
    ORDER BY building.key
    LIMIT ${limit}
  `;
  const byBuildingId = new Map(snapshotRecords.map((record) => [record.buildingId, record]));
  return candidateRows(rows).flatMap((candidate): SnapshotCandidate[] => {
    const record = byBuildingId.get(candidate.buildingId);
    if (record === undefined || record.districtSlug !== candidate.districtSlug
      || normalizedName(record.officialName) !== normalizedName(candidate.officialName)) return [];
    return [{ ...candidate, facts: record.facts }];
  });
}

export async function enrichOfficialBuildingFacts(
  limit = 4,
  overrides?: Partial<Dependencies>,
): Promise<Readonly<{
  state: 'ready' | 'not-configured';
  checked: number;
  stored: number;
  unavailable: number;
}>> {
  const sql = contentDatabase();
  if (sql === null && overrides?.loadSnapshotCandidates === undefined) {
    return Object.freeze({ state: 'not-configured', checked: 0, stored: 0, unavailable: 0 });
  }
  const serviceKey = overrides?.serviceKey ?? (process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY
    ?? process.env.DATA_GO_KR_SERVICE_KEY)?.trim();
  const dependencies: Dependencies = {
    serviceKey,
    snapshotAvailable: overrides?.snapshotAvailable
      ?? (() => installedKaptBuildingFactsSnapshot() !== null),
    loadSnapshotCandidates: overrides?.loadSnapshotCandidates ?? defaultSnapshotCandidates,
    loadOnlineCandidates: overrides?.loadOnlineCandidates ?? defaultOnlineCandidates,
    store: overrides?.store ?? storeBuildingFacts,
    recordAttempt: overrides?.recordAttempt ?? defaultRecordAttempt,
    loadOnline: overrides?.loadOnline ?? loadOfficialBuildingFacts,
  };
  const cappedLimit = Math.min(Math.max(limit, 1), 250);
  const snapshotCandidates = await dependencies.loadSnapshotCandidates(cappedLimit);
  const snapshotResults: 'stored'[] = [];
  for (let offset = 0; offset < snapshotCandidates.length; offset += 20) {
    const batch = snapshotCandidates.slice(offset, offset + 20);
    snapshotResults.push(...await Promise.all(batch.map(async (candidate) => {
      await dependencies.store(candidate, candidate.facts);
      await dependencies.recordAttempt(candidate.buildingKey, 'succeeded', null, 30);
      return 'stored' as const;
    })));
  }
  const remaining = Math.max(0, cappedLimit - snapshotCandidates.length);
  if (snapshotCandidates.length > 0 || remaining === 0 || !dependencies.serviceKey) {
    return Object.freeze({
      state: snapshotCandidates.length > 0 || dependencies.snapshotAvailable() ? 'ready' : 'not-configured',
      checked: snapshotCandidates.length,
      stored: snapshotResults.length,
      unavailable: 0,
    });
  }
  const candidates = await dependencies.loadOnlineCandidates(Math.min(remaining, 10));
  const results: ('stored' | 'unavailable')[] = [];
  for (let offset = 0; offset < candidates.length; offset += 5) {
    const batch = candidates.slice(offset, offset + 5);
    results.push(...await Promise.all(batch.map(async (candidate) => {
      const facts = await dependencies.loadOnline({
        districtLawdCd: candidate.districtLawdCd,
        neighborhoodName: candidate.neighborhoodName,
        officialName: candidate.officialName,
        housingType: candidate.housingType,
        serviceKey: dependencies.serviceKey,
        fetch: globalThis.fetch,
      });
      if (facts.status === 'ready') {
        await dependencies.store(candidate, facts);
        await dependencies.recordAttempt(candidate.buildingKey, 'succeeded', null, 30);
        return 'stored' as const;
      }
      const retryDays = facts.reason === 'provider_unavailable' ? 1 : 30;
      await dependencies.recordAttempt(
        candidate.buildingKey,
        facts.reason === 'provider_unavailable' ? 'provider-error' : 'no-candidate',
        facts.reason,
        retryDays,
      );
      return 'unavailable' as const;
    })));
  }
  return Object.freeze({
    state: 'ready',
    checked: snapshotCandidates.length + candidates.length,
    stored: snapshotResults.length + results.filter((result) => result === 'stored').length,
    unavailable: results.filter((result) => result === 'unavailable').length,
  });
}
