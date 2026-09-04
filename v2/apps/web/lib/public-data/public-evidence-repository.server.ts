import 'server-only';

import { publicContentDatabase } from '../db/postgres.server';
import {
  MARKET_CAPABILITY_FEATURES,
  MARKET_CAPABILITY_STATES,
  MARKET_HOUSING_SECTORS,
  PUBLIC_EVIDENCE_DISPLAY_STATES,
  PUBLIC_LOCATION_PRECISIONS,
  PUBLIC_LOCATION_VERIFICATION_STATES,
  type MarketCapability,
  type PublicEntityLocation,
  type PublicEvidenceRelease,
} from './public-evidence-types';

type SqlRow = Readonly<Record<string, unknown>>;

export type PublicEvidenceSqlPort = Readonly<{
  query(statement: string, parameters: readonly unknown[]): Promise<readonly SqlRow[]>;
}>;

export type PublicEvidenceReadEvent = Readonly<{
  operation: 'release' | 'location' | 'capabilities';
  marketId: string | null;
  resultState: 'ready' | 'missing' | 'invalid' | 'unavailable';
  durationMs: number;
  cacheState: 'database';
}>;

export type PublicEvidenceRepository = Readonly<{
  getRelease(datasetId: string): Promise<PublicEvidenceRelease | null>;
  getLocation(entityId: string): Promise<PublicEntityLocation | null>;
  listCapabilities(marketId: string): Promise<readonly MarketCapability[]>;
}>;

type RepositoryOptions = Readonly<{
  now?: () => number;
  onRead?: (event: PublicEvidenceReadEvent) => void;
}>;

const RELEASE_SQL = `
  /* public-evidence:release */
  SELECT id, market_id, dataset_id, period_start, period_end, record_count,
    rights_policy_id, display_state, sha256
  FROM evidence_releases
  WHERE dataset_id = $1 AND display_state IN ('published', 'stale')
  ORDER BY period_end DESC, generated_at DESC
  LIMIT 1
`;

const LOCATION_SQL = `
  /* public-evidence:location */
  SELECT location.entity_id, location.market_id, location.latitude, location.longitude,
    location.precision, location.provider, location.provider_reference,
    location.rights_policy_id, location.verification_status,
    location.verified_at, location.updated_at
  FROM public_entity_locations AS location
  INNER JOIN rights_policies AS rights ON rights.id = location.rights_policy_id
  WHERE location.entity_id = $1 AND location.verification_status = 'verified'
    AND rights.can_display = true
  LIMIT 1
`;

const CAPABILITIES_SQL = `
  /* public-evidence:capabilities */
  SELECT market_id, feature, housing_sector, state, public_href, label,
    limitations, checked_at, evidence_release_id
  FROM market_capabilities
  WHERE market_id = $1
  ORDER BY feature, housing_sector
`;

const MARKET_IDS = ['kr-seoul', 'sg-singapore', 'ae-dubai'] as const;
const PUBLIC_MARKET_IDS = ['kr-seoul', 'sg-singapore'] as const;
const SHA256 = /^[a-f0-9]{64}$/u;

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function dateOnly(value: unknown): string | null {
  const iso = isoDate(value);
  return iso?.slice(0, 10) ?? null;
}

function isoDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function nonNegativeInteger(value: unknown): number | null {
  const parsed = typeof value === 'string' && /^(?:0|[1-9]\d*)$/u.test(value)
    ? Number(value)
    : value;
  return typeof parsed === 'number' && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function stringArray(value: unknown): readonly string[] | null {
  let candidate = value;
  if (typeof value === 'string') {
    try { candidate = JSON.parse(value); } catch { return null; }
  }
  if (!Array.isArray(candidate) || !candidate.every((item) => typeof item === 'string')) return null;
  return Object.freeze([...candidate]);
}

function releaseFromRow(row: SqlRow | undefined): PublicEvidenceRelease | null {
  if (row === undefined) return null;
  const periodStart = dateOnly(row.period_start);
  const periodEnd = dateOnly(row.period_end);
  const recordCount = nonNegativeInteger(row.record_count);
  if (
    typeof row.id !== 'string' || !includes(PUBLIC_MARKET_IDS, row.market_id) ||
    typeof row.dataset_id !== 'string' || periodStart === null || periodEnd === null ||
    periodEnd < periodStart || recordCount === null || typeof row.rights_policy_id !== 'string' ||
    !includes(PUBLIC_EVIDENCE_DISPLAY_STATES, row.display_state) ||
    typeof row.sha256 !== 'string' || !SHA256.test(row.sha256)
  ) return null;
  return Object.freeze({
    id: row.id,
    marketId: row.market_id,
    datasetId: row.dataset_id,
    periodStart,
    periodEnd,
    recordCount,
    rightsPolicyId: row.rights_policy_id,
    displayState: row.display_state,
    sha256: row.sha256,
  });
}

function locationFromRow(row: SqlRow | undefined): PublicEntityLocation | null {
  if (row === undefined) return null;
  const latitude = finiteNumber(row.latitude);
  const longitude = finiteNumber(row.longitude);
  const verifiedAt = isoDate(row.verified_at);
  const updatedAt = isoDate(row.updated_at);
  if (
    typeof row.entity_id !== 'string' || !includes(PUBLIC_MARKET_IDS, row.market_id) ||
    latitude === null || latitude < -90 || latitude > 90 ||
    longitude === null || longitude < -180 || longitude > 180 ||
    !includes(PUBLIC_LOCATION_PRECISIONS, row.precision) || typeof row.provider !== 'string' ||
    !(row.provider_reference === null || typeof row.provider_reference === 'string') ||
    typeof row.rights_policy_id !== 'string' ||
    !includes(PUBLIC_LOCATION_VERIFICATION_STATES, row.verification_status) ||
    row.verification_status !== 'verified' || verifiedAt === null || updatedAt === null
  ) return null;
  return Object.freeze({
    entityId: row.entity_id,
    marketId: row.market_id,
    latitude,
    longitude,
    precision: row.precision,
    provider: row.provider,
    providerReference: row.provider_reference,
    rightsPolicyId: row.rights_policy_id,
    verificationStatus: row.verification_status,
    verifiedAt,
    updatedAt,
  });
}

function capabilityFromRow(row: SqlRow): MarketCapability | null {
  const limitations = stringArray(row.limitations);
  const checkedAt = isoDate(row.checked_at);
  if (
    !includes(MARKET_IDS, row.market_id) || !includes(MARKET_CAPABILITY_FEATURES, row.feature) ||
    !includes(MARKET_HOUSING_SECTORS, row.housing_sector) ||
    !includes(MARKET_CAPABILITY_STATES, row.state) ||
    !(row.public_href === null || typeof row.public_href === 'string') ||
    typeof row.label !== 'string' || limitations === null || checkedAt === null ||
    !(row.evidence_release_id === null || typeof row.evidence_release_id === 'string')
  ) return null;
  return Object.freeze({
    marketId: row.market_id,
    feature: row.feature,
    housingSector: row.housing_sector,
    state: row.state,
    publicHref: row.public_href,
    label: row.label,
    limitations,
    checkedAt,
    evidenceReleaseId: row.evidence_release_id,
  });
}

export function createPublicEvidenceRepository(
  port: PublicEvidenceSqlPort,
  options: RepositoryOptions = {},
): PublicEvidenceRepository {
  const now = options.now ?? Date.now;
  const onRead = options.onRead ?? (() => undefined);

  async function read<T>(input: {
    operation: PublicEvidenceReadEvent['operation'];
    marketId: string | null;
    empty: T;
    query: () => Promise<readonly SqlRow[]>;
    parse: (rows: readonly SqlRow[]) => T;
    isMissing: (value: T) => boolean;
  }): Promise<T> {
    const startedAt = now();
    try {
      const rows = await input.query();
      const value = input.parse(rows);
      const invalid = rows.length > 0 && input.isMissing(value);
      onRead(Object.freeze({
        operation: input.operation,
        marketId: input.marketId,
        resultState: invalid ? 'invalid' : input.isMissing(value) ? 'missing' : 'ready',
        durationMs: Math.max(0, now() - startedAt),
        cacheState: 'database',
      }));
      return value;
    } catch {
      onRead(Object.freeze({
        operation: input.operation,
        marketId: input.marketId,
        resultState: 'unavailable',
        durationMs: Math.max(0, now() - startedAt),
        cacheState: 'database',
      }));
      return input.empty;
    }
  }

  return Object.freeze({
    getRelease(datasetId) {
      return read({
        operation: 'release', marketId: null, empty: null,
        query: () => port.query(RELEASE_SQL, [datasetId]),
        parse: (rows) => releaseFromRow(rows[0]),
        isMissing: (value) => value === null,
      });
    },
    getLocation(entityId) {
      return read({
        operation: 'location', marketId: null, empty: null,
        query: () => port.query(LOCATION_SQL, [entityId]),
        parse: (rows) => locationFromRow(rows[0]),
        isMissing: (value) => value === null,
      });
    },
    listCapabilities(marketId) {
      return read({
        operation: 'capabilities', marketId, empty: Object.freeze([]),
        query: () => port.query(CAPABILITIES_SQL, [marketId]),
        parse: (rows) => Object.freeze(rows.map(capabilityFromRow).filter((value): value is MarketCapability => value !== null)),
        isMissing: (value) => value.length === 0,
      });
    },
  });
}

export function publicEvidenceRepositoryFromEnvironment(
  options: RepositoryOptions = {},
): PublicEvidenceRepository | null {
  const sql = publicContentDatabase();
  if (sql === null) return null;
  return createPublicEvidenceRepository({
    query: (statement, parameters) => sql.query(statement, [...parameters]),
  }, options);
}
