import 'server-only';

import type { KoreaProximityRecord } from '@signedprice/korea-rent';

import { contentDatabase } from '../db/postgres.server';
import type { VerifiedKoreaProximityArtifact } from './korea-proximity-schema';
import { koreaProximityRepositoryFromEnvironment } from './korea-proximity-repository.server';

type SqlRow = Readonly<Record<string, unknown>>;

export type KoreaProximityDatabasePort = Readonly<{
  query(statement: string, parameters?: readonly unknown[]): Promise<readonly SqlRow[]>;
}>;

export type KoreaProximityDatabaseRow = Readonly<{
  buildingKey: string;
  kind: 'station' | 'school';
  providerId: string;
  name: string;
  distanceMeters: number;
  lines: readonly string[];
  isNearest: boolean;
  source: string;
  evidenceSha256: string;
}>;

function readyRows(
  record: Extract<KoreaProximityRecord, { status: 'ready' }>,
  artifact: VerifiedKoreaProximityArtifact,
): KoreaProximityDatabaseRow[] {
  const rows = new Map<string, KoreaProximityDatabaseRow>();
  const addStation = (station: NonNullable<typeof record.nearestStation>, isNearest: boolean) => {
    rows.set(`station:${station.sourceId}`, Object.freeze({
      buildingKey: `seoul:${record.buildingId}`,
      kind: 'station',
      providerId: station.sourceId,
      name: station.name,
      distanceMeters: Math.round(station.distanceMeters),
      lines: Object.freeze([...station.lines]),
      isNearest,
      source: artifact.provenance.stationSource.landingPage,
      evidenceSha256: artifact.sha256,
    }));
  };
  const addSchool = (school: NonNullable<typeof record.nearestSchool>, isNearest: boolean) => {
    rows.set(`school:${school.sourceId}`, Object.freeze({
      buildingKey: `seoul:${record.buildingId}`,
      kind: 'school',
      providerId: school.sourceId,
      name: school.name,
      distanceMeters: Math.round(school.distanceMeters),
      lines: Object.freeze([]),
      isNearest,
      source: artifact.provenance.schoolSource.landingPage,
      evidenceSha256: artifact.sha256,
    }));
  };
  for (const station of record.stations) addStation(station, station.sourceId === record.nearestStation?.sourceId);
  for (const school of record.schools) addSchool(school, school.sourceId === record.nearestSchool?.sourceId);
  if (record.nearestStation !== null) addStation(record.nearestStation, true);
  if (record.nearestSchool !== null) addSchool(record.nearestSchool, true);
  return [...rows.values()];
}

export function proximityDatabaseRows(
  artifact: VerifiedKoreaProximityArtifact,
): readonly KoreaProximityDatabaseRow[] {
  return Object.freeze(artifact.records.flatMap((record) => (
    record.status === 'ready' ? readyRows(record, artifact) : []
  )).sort((left, right) => (
    left.buildingKey.localeCompare(right.buildingKey)
    || left.kind.localeCompare(right.kind)
    || left.distanceMeters - right.distanceMeters
    || left.providerId.localeCompare(right.providerId)
  )));
}

const START_SQL = `
  /* proximity-db:start */
  INSERT INTO ingestion_runs (pipeline, status, diagnostic)
  VALUES ('korea-proximity-db', 'running', $1)
  RETURNING id::text
`;

const CHUNK_SQL = `
  /* proximity-db:chunk */
  WITH scoped_buildings AS (
    SELECT unnest($1::text[]) AS building_key
  ), deleted AS (
    DELETE FROM nearby_places AS place
    USING scoped_buildings AS scoped
    WHERE place.building_key = scoped.building_key
      AND place.kind IN ('station', 'school')
  ), incoming AS (
    SELECT * FROM jsonb_to_recordset($2::jsonb) AS row(
      "buildingKey" text, kind text, "providerId" text, name text,
      "distanceMeters" integer, lines jsonb, "isNearest" boolean,
      source text, "evidenceSha256" char(64)
    )
  ), inserted AS (
    INSERT INTO nearby_places (
      building_key, kind, provider_id, name, distance_meters,
      lines, is_nearest, source, evidence_sha256, checked_at
    )
    SELECT
      building.key, incoming.kind, incoming."providerId", incoming.name,
      incoming."distanceMeters", incoming.lines, incoming."isNearest",
      incoming.source, incoming."evidenceSha256", now()
    FROM incoming
    INNER JOIN buildings AS building ON building.key = incoming."buildingKey"
    WHERE building.market_key = 'seoul'
      AND incoming.kind IN ('station', 'school')
    ON CONFLICT (building_key, kind, provider_id) DO UPDATE SET
      name = excluded.name,
      distance_meters = excluded.distance_meters,
      lines = excluded.lines,
      is_nearest = excluded.is_nearest,
      source = excluded.source,
      evidence_sha256 = excluded.evidence_sha256,
      checked_at = now(),
      updated_at = now()
    RETURNING id
  )
  SELECT count(*)::text AS stored_count FROM inserted
`;

const FINISH_SQL = `
  /* proximity-db:finish */
  UPDATE ingestion_runs
  SET status = $2, finished_at = now(), fetched_count = $3,
    stored_count = $4, diagnostic = $5
  WHERE id = $1
`;

function integer(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isSafeInteger(parsed) || parsed < 0) {
    throw new TypeError('Invalid Korea proximity database count.');
  }
  return parsed;
}

export function createKoreaProximityDatabasePublisher(
  port: KoreaProximityDatabasePort,
  chunkSize = 500,
): Readonly<{
  publish(artifact: VerifiedKoreaProximityArtifact): Promise<Readonly<{
    state: 'ready'; buildings: number; storedPlaces: number; evidenceSha256: string;
  }>>;
}> {
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 1 || chunkSize > 2_000) {
    throw new TypeError('Invalid Korea proximity database chunk size.');
  }
  return Object.freeze({
    async publish(artifact) {
      const [run] = await port.query(START_SQL, [JSON.stringify({ evidenceSha256: artifact.sha256 })]);
      const runId = run?.id;
      if ((typeof runId !== 'string' && typeof runId !== 'number') || String(runId) === '') {
        throw new TypeError('Korea proximity ingestion run unavailable.');
      }
      const allRows = proximityDatabaseRows(artifact);
      let storedPlaces = 0;
      try {
        for (let offset = 0; offset < artifact.records.length; offset += chunkSize) {
          const records = artifact.records.slice(offset, offset + chunkSize);
          const buildingKeys = records.map((record) => `seoul:${record.buildingId}`);
          const buildingSet = new Set(buildingKeys);
          const rows = allRows.filter((row) => buildingSet.has(row.buildingKey));
          const [result] = await port.query(CHUNK_SQL, [buildingKeys, JSON.stringify(rows)]);
          storedPlaces += integer(result?.stored_count ?? '0');
        }
        await port.query(FINISH_SQL, [String(runId), 'succeeded', artifact.records.length, storedPlaces,
          JSON.stringify({ evidenceSha256: artifact.sha256 })]);
      } catch (error) {
        try {
          await port.query(FINISH_SQL, [String(runId), 'failed', artifact.records.length, storedPlaces,
            JSON.stringify({ evidenceSha256: artifact.sha256, error: 'publish-failed' })]);
        } catch {
          // Preserve the original publication failure.
        }
        throw error;
      }
      return Object.freeze({
        state: 'ready', buildings: artifact.records.length, storedPlaces,
        evidenceSha256: artifact.sha256,
      });
    },
  });
}

export async function publishInstalledKoreaProximityToDatabase(): Promise<Readonly<
  { state: 'missing' | 'invalid' | 'not-configured' }
  | { state: 'ready'; buildings: number; storedPlaces: number; evidenceSha256: string }
>> {
  const repository = koreaProximityRepositoryFromEnvironment();
  if (repository.state !== 'ready') return Object.freeze({ state: repository.state });
  const sql = contentDatabase();
  if (sql === null) return Object.freeze({ state: 'not-configured' });
  return createKoreaProximityDatabasePublisher({
    query: (statement, parameters = []) => sql.query(statement, [...parameters]),
  }).publish(repository.repository.getArtifact());
}
