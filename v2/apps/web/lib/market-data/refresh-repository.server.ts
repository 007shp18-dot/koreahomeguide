import 'server-only';

import { randomUUID } from 'node:crypto';

import type {
  MarketRefreshCounters,
  MarketRefreshJob,
  NormalizedMarketBatch,
  NormalizedPropertyEntity,
} from './refresh-types';

type SqlRow = Readonly<Record<string, unknown>>;

export type MarketRefreshSqlStatement = Readonly<{
  statement: string;
  parameters?: readonly unknown[];
}>;

export type MarketRefreshSqlPort = Readonly<{
  query(statement: string, parameters?: readonly unknown[]): Promise<readonly SqlRow[]>;
  transaction(statements: readonly MarketRefreshSqlStatement[]): Promise<readonly (readonly SqlRow[])[]>;
}>;

export type MarketRefreshRun = Readonly<{
  runId: string;
  leaseToken: string;
  job: MarketRefreshJob;
}>;

const JOB_METADATA = Object.freeze({
  'kr-seoul-sale': Object.freeze({ marketId: 'kr-seoul', datasetId: 'kr-sale' }),
  'kr-seoul-rent': Object.freeze({ marketId: 'kr-seoul', datasetId: 'kr-rent' }),
  'sg-private-sale': Object.freeze({ marketId: 'sg-singapore', datasetId: 'sg-private-sale' }),
  'sg-private-rent': Object.freeze({ marketId: 'sg-singapore', datasetId: 'sg-private-rent' }),
  'ae-dubai-transaction': Object.freeze({ marketId: 'ae-dubai', datasetId: 'ae-dubai-transactions' }),
  'ae-dubai-rent': Object.freeze({ marketId: 'ae-dubai', datasetId: 'ae-dubai-rents' }),
}) satisfies Readonly<Record<MarketRefreshJob, Readonly<{ marketId: string; datasetId: string }>>>;

const DEFAULT_MAX_RECORDS_PER_TRANSACTION = 2_000;

const START_SQL = `
  /* market-data-refresh:start */
  WITH acquired AS (
    INSERT INTO market_data_refresh_leases (job, lease_token, acquired_at, expires_at)
    VALUES ($1, $2, now(), now() + interval '10 minutes')
    ON CONFLICT (job) DO UPDATE SET
      lease_token = excluded.lease_token,
      acquired_at = excluded.acquired_at,
      expires_at = excluded.expires_at
    WHERE market_data_refresh_leases.expires_at < now()
    RETURNING job, lease_token
  ), started AS (
    INSERT INTO market_data_refresh_runs (
      job, market_id, dataset_id, state, lease_token
    )
    SELECT
      acquired.job,
      CASE
        WHEN acquired.job LIKE 'kr-%' THEN 'kr-seoul'
        WHEN acquired.job LIKE 'sg-%' THEN 'sg-singapore'
        ELSE 'ae-dubai'
      END,
      CASE acquired.job
        WHEN 'kr-seoul-sale' THEN 'kr-sale'
        WHEN 'kr-seoul-rent' THEN 'kr-rent'
        WHEN 'sg-private-sale' THEN 'sg-private-sale'
        WHEN 'sg-private-rent' THEN 'sg-private-rent'
        WHEN 'ae-dubai-transaction' THEN 'ae-dubai-transactions'
        ELSE 'ae-dubai-rents'
      END,
      'running', acquired.lease_token
    FROM acquired
    RETURNING id::text AS run_id, lease_token
  )
  SELECT run_id, lease_token FROM started
`;

const UPSERT_DATASET_SQL = `
  /* market-data-refresh:dataset */
  INSERT INTO datasets (
    id, market_id, provider, official_name, landing_url, subject_scope,
    refresh_cadence, expected_lag, schema_version, parser_version,
    rights_policy_id, updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
  ON CONFLICT (id) DO UPDATE SET
    provider = excluded.provider,
    official_name = excluded.official_name,
    landing_url = excluded.landing_url,
    subject_scope = excluded.subject_scope,
    refresh_cadence = excluded.refresh_cadence,
    expected_lag = excluded.expected_lag,
    schema_version = excluded.schema_version,
    parser_version = excluded.parser_version,
    rights_policy_id = excluded.rights_policy_id,
    updated_at = now()
  WHERE ROW(
    datasets.provider, datasets.official_name, datasets.landing_url,
    datasets.subject_scope, datasets.refresh_cadence, datasets.expected_lag,
    datasets.schema_version, datasets.parser_version, datasets.rights_policy_id
  ) IS DISTINCT FROM ROW(
    excluded.provider, excluded.official_name, excluded.landing_url,
    excluded.subject_scope, excluded.refresh_cadence, excluded.expected_lag,
    excluded.schema_version, excluded.parser_version, excluded.rights_policy_id
  )
`;

const UPSERT_GEOGRAPHIES_SQL = `
  /* market-data-refresh:geographies */
  INSERT INTO geographies (
    id, market_id, kind, official_name, localized_names, provider_code, updated_at
  )
  SELECT id, market_id, kind, official_name, localized_names, provider_code, now()
  FROM jsonb_to_recordset($1::jsonb) AS row(
    id text, market_id text, kind text, official_name text,
    localized_names jsonb, provider_code text
  )
  ON CONFLICT (id) DO UPDATE SET
    official_name = excluded.official_name,
    localized_names = excluded.localized_names,
    updated_at = now()
  WHERE ROW(geographies.official_name, geographies.localized_names)
    IS DISTINCT FROM ROW(excluded.official_name, excluded.localized_names)
`;

const UPSERT_ENTITIES_SQL = `
  /* market-data-refresh:entities */
  INSERT INTO property_entities (
    id, market_id, geography_id, kind, canonical_name, normalized_name,
    address_text, housing_sector, property_class, identity_status,
    local_attributes, local_schema_version, updated_at
  )
  SELECT id, market_id, geography_id, kind, canonical_name, normalized_name,
    address_text, housing_sector, property_class, identity_status,
    local_attributes, local_schema_version, now()
  FROM jsonb_to_recordset($1::jsonb) AS row(
    id text, market_id text, geography_id text, kind text,
    canonical_name text, normalized_name text, address_text text,
    housing_sector text, property_class text, identity_status text,
    local_attributes jsonb, local_schema_version text
  )
  ON CONFLICT (id) DO UPDATE SET
    geography_id = COALESCE(excluded.geography_id, property_entities.geography_id),
    canonical_name = excluded.canonical_name,
    normalized_name = excluded.normalized_name,
    address_text = COALESCE(excluded.address_text, property_entities.address_text),
    housing_sector = COALESCE(excluded.housing_sector, property_entities.housing_sector),
    property_class = CASE
      WHEN property_entities.property_class IS NULL OR excluded.property_class IS NULL THEN NULL
      WHEN property_entities.property_class = excluded.property_class
        THEN property_entities.property_class
      ELSE NULL
    END,
    identity_status = excluded.identity_status,
    local_attributes = property_entities.local_attributes || excluded.local_attributes,
    local_schema_version = excluded.local_schema_version,
    updated_at = now()
  WHERE ROW(
    property_entities.geography_id, property_entities.canonical_name,
    property_entities.normalized_name, property_entities.address_text,
    property_entities.housing_sector, property_entities.property_class,
    property_entities.identity_status, property_entities.local_attributes,
    property_entities.local_schema_version
  ) IS DISTINCT FROM ROW(
    COALESCE(excluded.geography_id, property_entities.geography_id),
    excluded.canonical_name, excluded.normalized_name,
    COALESCE(excluded.address_text, property_entities.address_text),
    COALESCE(excluded.housing_sector, property_entities.housing_sector),
    CASE
      WHEN property_entities.property_class IS NULL OR excluded.property_class IS NULL THEN NULL
      WHEN property_entities.property_class = excluded.property_class
        THEN property_entities.property_class
      ELSE NULL
    END,
    excluded.identity_status,
    property_entities.local_attributes || excluded.local_attributes,
    excluded.local_schema_version
  )
`;

const APPLY_RECORDS_SQL = `
  /* market-data-refresh:records */
  WITH input AS (
    SELECT * FROM jsonb_to_recordset($1::jsonb) AS row(
      dataset_id text, market_id text, business_key text, content_hash char(64),
      source_observed_at timestamptz, raw_metadata jsonb, entity_id text,
      kind text, stage text, observed_at date, registered_at date,
      period_start date, period_end date, amount_minor bigint,
      annual_amount_minor bigint, currency_code char(3), deposit_minor bigint,
      recurring_amount_minor bigint, frequency text, property_area_sqm numeric(12,3),
      transacted_area_sqm numeric(12,3), area_basis text, floor_value integer,
      floor_range text, bedrooms numeric(4,1), tenure_kind text,
      observation_status text, local_attributes jsonb, local_schema_version text
    )
  ), classified AS (
    SELECT input.*,
      EXISTS (
        SELECT 1 FROM source_records source
        WHERE source.dataset_id = input.dataset_id
          AND source.business_key = input.business_key
          AND source.content_hash = input.content_hash
      ) AS exact_exists,
      EXISTS (
        SELECT 1 FROM source_records source
        WHERE source.dataset_id = input.dataset_id
          AND source.business_key = input.business_key
      ) AS key_exists
    FROM input
  ), changed_keys AS (
    SELECT DISTINCT dataset_id, business_key, content_hash
    FROM classified WHERE key_exists
  ), superseded AS (
    UPDATE observations observation
    SET status = 'superseded', updated_at = now()
    FROM source_records source, changed_keys changed
    WHERE observation.source_record_id = source.id
      AND source.dataset_id = changed.dataset_id
      AND source.business_key = changed.business_key
      AND source.content_hash <> changed.content_hash
      AND observation.status <> 'superseded'
    RETURNING observation.id
  ), upserted_sources AS (
    INSERT INTO source_records (
      dataset_id, business_key, content_hash, observed_at, raw_metadata
    )
    SELECT dataset_id, business_key, content_hash, source_observed_at, raw_metadata
    FROM input
    ON CONFLICT (dataset_id, business_key, content_hash) DO UPDATE SET
      observed_at = excluded.observed_at,
      raw_metadata = excluded.raw_metadata
    RETURNING id, dataset_id, business_key, content_hash
  ), upserted_observations AS (
    INSERT INTO observations (
      market_id, subject_entity_id, source_record_id, kind, stage, observed_at,
      registered_at, period_start, period_end, amount_minor, annual_amount_minor,
      currency_code, deposit_minor, recurring_amount_minor, frequency,
      property_area_sqm, transacted_area_sqm, area_basis, floor_value, floor_range,
      bedrooms, tenure_kind, status, local_attributes, local_schema_version, updated_at
    )
    SELECT input.market_id, input.entity_id, source.id, input.kind, input.stage,
      input.observed_at, input.registered_at, input.period_start, input.period_end,
      input.amount_minor, input.annual_amount_minor, input.currency_code,
      input.deposit_minor, input.recurring_amount_minor, input.frequency,
      input.property_area_sqm, input.transacted_area_sqm, input.area_basis,
      input.floor_value, input.floor_range, input.bedrooms, input.tenure_kind,
      input.observation_status, input.local_attributes, input.local_schema_version, now()
    FROM input
    INNER JOIN upserted_sources source
      ON source.dataset_id = input.dataset_id
      AND source.business_key = input.business_key
      AND source.content_hash = input.content_hash
    WHERE input.entity_id IS NOT NULL AND input.kind IS NOT NULL
    ON CONFLICT (source_record_id, subject_entity_id, kind) DO UPDATE SET
      stage = excluded.stage,
      observed_at = excluded.observed_at,
      registered_at = excluded.registered_at,
      period_start = excluded.period_start,
      period_end = excluded.period_end,
      amount_minor = excluded.amount_minor,
      annual_amount_minor = excluded.annual_amount_minor,
      deposit_minor = excluded.deposit_minor,
      recurring_amount_minor = excluded.recurring_amount_minor,
      frequency = excluded.frequency,
      property_area_sqm = excluded.property_area_sqm,
      transacted_area_sqm = excluded.transacted_area_sqm,
      area_basis = excluded.area_basis,
      floor_value = excluded.floor_value,
      floor_range = excluded.floor_range,
      bedrooms = excluded.bedrooms,
      tenure_kind = excluded.tenure_kind,
      status = excluded.status,
      local_attributes = excluded.local_attributes,
      local_schema_version = excluded.local_schema_version,
      updated_at = now()
    WHERE ROW(
      observations.stage, observations.observed_at, observations.registered_at,
      observations.period_start, observations.period_end, observations.amount_minor,
      observations.annual_amount_minor, observations.deposit_minor,
      observations.recurring_amount_minor, observations.frequency,
      observations.property_area_sqm, observations.transacted_area_sqm,
      observations.area_basis, observations.floor_value, observations.floor_range,
      observations.bedrooms, observations.tenure_kind, observations.status,
      observations.local_attributes, observations.local_schema_version
    ) IS DISTINCT FROM ROW(
      excluded.stage, excluded.observed_at, excluded.registered_at,
      excluded.period_start, excluded.period_end, excluded.amount_minor,
      excluded.annual_amount_minor, excluded.deposit_minor,
      excluded.recurring_amount_minor, excluded.frequency,
      excluded.property_area_sqm, excluded.transacted_area_sqm,
      excluded.area_basis, excluded.floor_value, excluded.floor_range,
      excluded.bedrooms, excluded.tenure_kind, excluded.status,
      excluded.local_attributes, excluded.local_schema_version
    )
    RETURNING id
  )
  SELECT
    count(*)::text AS received,
    count(*) FILTER (WHERE NOT key_exists)::text AS inserted,
    count(*) FILTER (WHERE key_exists AND NOT exact_exists)::text AS updated,
    count(*) FILTER (WHERE exact_exists)::text AS unchanged,
    count(*) FILTER (WHERE entity_id IS NULL OR kind IS NULL)::text AS unlinked
  FROM classified
`;

const COMPLETE_SQL = `
  /* market-data-refresh:complete */
  UPDATE market_data_refresh_runs SET
    state = 'succeeded', source_as_of = $3::timestamptz,
    received = $4, inserted = $5, updated = $6, unchanged = $7, unlinked = $8,
    error_code = NULL, completed_at = now()
  WHERE id = $1::bigint AND lease_token = $2 AND state = 'running'
`;

const FAIL_SQL = `
  /* market-data-refresh:fail */
  UPDATE market_data_refresh_runs SET
    state = 'failed', error_code = $3, completed_at = now()
  WHERE id = $1::bigint AND lease_token = $2 AND state = 'running'
`;

const SKIP_SQL = `
  /* market-data-refresh:skip */
  UPDATE market_data_refresh_runs SET
    state = 'skipped', error_code = $3, completed_at = now()
  WHERE id = $1::bigint AND lease_token = $2 AND state = 'running'
`;

const RELEASE_SQL = `
  /* market-data-refresh:release */
  DELETE FROM market_data_refresh_leases WHERE job = $1 AND lease_token = $2
`;

function count(value: unknown, label: string): number {
  const source = typeof value === 'number' ? String(value) : value;
  if (typeof source !== 'string' || !/^(?:0|[1-9]\d*)$/u.test(source)) {
    throw new TypeError(`Market refresh ${label} count is invalid.`);
  }
  const parsed = Number(source);
  if (!Number.isSafeInteger(parsed)) throw new TypeError(`Market refresh ${label} count is invalid.`);
  return parsed;
}

function errorCode(value: string): string {
  if (!/^[a-z][a-z0-9_]{1,63}$/u.test(value)) {
    throw new TypeError('Market refresh error code is invalid.');
  }
  return value;
}

function addCounters(
  left: MarketRefreshCounters,
  right: MarketRefreshCounters,
): MarketRefreshCounters {
  const output = Object.freeze({
    received: left.received + right.received,
    inserted: left.inserted + right.inserted,
    updated: left.updated + right.updated,
    unchanged: left.unchanged + right.unchanged,
    unlinked: left.unlinked + right.unlinked,
  });
  if (Object.values(output).some((value) => !Number.isSafeInteger(value))) {
    throw new TypeError('Market refresh aggregate counters are invalid.');
  }
  return output;
}

function uniqueEntities(batch: NormalizedMarketBatch): readonly NormalizedPropertyEntity[] {
  const entities = new Map<string, NormalizedPropertyEntity>();
  for (const record of batch.records) {
    if (record.entity === null) continue;
    const prior = entities.get(record.entity.id);
    if (prior !== undefined) {
      const priorIdentity = { ...prior, propertyClass: null };
      const nextIdentity = { ...record.entity, propertyClass: null };
      if (JSON.stringify(priorIdentity) !== JSON.stringify(nextIdentity)) {
        throw new TypeError(`Market refresh entity conflict: ${record.entity.id}`);
      }
      if (prior.propertyClass !== record.entity.propertyClass) {
        entities.set(record.entity.id, Object.freeze({ ...prior, propertyClass: null }));
      }
      continue;
    }
    entities.set(record.entity.id, record.entity);
  }
  return Object.freeze([...entities.values()]);
}

function payloads(batch: NormalizedMarketBatch): Readonly<{
  geographies: string;
  entities: string;
  records: string;
}> {
  const entities = uniqueEntities(batch);
  const geographyById = new Map(entities.flatMap((entity) => (
    entity.geography === null ? [] : [[entity.geography.id, entity.geography] as const]
  )));
  return Object.freeze({
    geographies: JSON.stringify([...geographyById.values()].map((geography) => ({
      id: geography.id, market_id: geography.marketId, kind: geography.kind,
      official_name: geography.officialName, localized_names: geography.localizedNames,
      provider_code: geography.providerCode,
    }))),
    entities: JSON.stringify(entities.map((entity) => ({
      id: entity.id, market_id: entity.marketId,
      geography_id: entity.geography?.id ?? null, kind: entity.kind,
      canonical_name: entity.canonicalName, normalized_name: entity.normalizedName,
      address_text: entity.addressText, housing_sector: entity.housingSector,
      property_class: entity.propertyClass, identity_status: entity.identityStatus,
      local_attributes: entity.localAttributes, local_schema_version: entity.localSchemaVersion,
    }))),
    records: JSON.stringify(batch.records.map((record) => ({
      dataset_id: batch.dataset.id, market_id: batch.dataset.marketId,
      business_key: record.businessKey, content_hash: record.contentHash,
      source_observed_at: record.sourceObservedAt, raw_metadata: record.rawMetadata,
      entity_id: record.entity?.id ?? null,
      kind: record.observation?.kind ?? null,
      stage: record.observation?.stage ?? null,
      observed_at: record.observation?.observedAt ?? null,
      registered_at: record.observation?.registeredAt ?? null,
      period_start: record.observation?.periodStart ?? null,
      period_end: record.observation?.periodEnd ?? null,
      amount_minor: record.observation?.amountMinor ?? null,
      annual_amount_minor: record.observation?.annualAmountMinor ?? null,
      currency_code: record.observation?.currencyCode ?? null,
      deposit_minor: record.observation?.depositMinor ?? null,
      recurring_amount_minor: record.observation?.recurringAmountMinor ?? null,
      frequency: record.observation?.frequency ?? null,
      property_area_sqm: record.observation?.propertyAreaSqm ?? null,
      transacted_area_sqm: record.observation?.transactedAreaSqm ?? null,
      area_basis: record.observation?.areaBasis ?? null,
      floor_value: record.observation?.floorValue ?? null,
      floor_range: record.observation?.floorRange ?? null,
      bedrooms: record.observation?.bedrooms ?? null,
      tenure_kind: record.observation?.tenureKind ?? null,
      observation_status: record.observation?.status ?? null,
      local_attributes: record.observation?.localAttributes ?? {},
      local_schema_version: record.observation?.localSchemaVersion ?? null,
    }))),
  });
}

export function createMarketRefreshRepository(
  port: MarketRefreshSqlPort,
  dependencies: Readonly<{
    randomId?: () => string;
    maxRecordsPerTransaction?: number;
  }> = Object.freeze({}),
): Readonly<{
  start(job: MarketRefreshJob): Promise<MarketRefreshRun | null>;
  persist(run: MarketRefreshRun, batch: NormalizedMarketBatch): Promise<MarketRefreshCounters>;
  succeed(run: MarketRefreshRun, counters: MarketRefreshCounters, sourceAsOf: string): Promise<void>;
  fail(run: MarketRefreshRun, code: string): Promise<void>;
  skip(run: MarketRefreshRun, code: string): Promise<void>;
}> {
  const maxRecordsPerTransaction = dependencies.maxRecordsPerTransaction
    ?? DEFAULT_MAX_RECORDS_PER_TRANSACTION;
  if (!Number.isSafeInteger(maxRecordsPerTransaction)
    || maxRecordsPerTransaction < 1 || maxRecordsPerTransaction > 10_000) {
    throw new TypeError('Market refresh transaction batch size is invalid.');
  }

  return Object.freeze({
    async start(job) {
      const leaseToken = (dependencies.randomId ?? randomUUID)();
      const [row] = await port.query(START_SQL, [job, leaseToken]);
      if (row === undefined) return null;
      if (typeof row.run_id !== 'string' || row.run_id === '' || row.lease_token !== leaseToken) {
        throw new TypeError('Market refresh run lease is invalid.');
      }
      return Object.freeze({ runId: row.run_id, leaseToken, job });
    },

    async persist(run, batch) {
      const metadata = JOB_METADATA[run.job];
      if (batch.job !== run.job || batch.dataset.id !== metadata.datasetId
        || batch.dataset.marketId !== metadata.marketId) {
        throw new TypeError('Market refresh job mismatch.');
      }
      if (batch.records.length === 0) throw new TypeError('Market refresh batch is empty.');
      const dataset = batch.dataset;
      const datasetStatement: MarketRefreshSqlStatement = {
        statement: UPSERT_DATASET_SQL,
        parameters: [dataset.id, dataset.marketId, dataset.provider, dataset.officialName,
          dataset.landingUrl, dataset.subjectScope, dataset.refreshCadence,
          dataset.expectedLag, dataset.schemaVersion, dataset.parserVersion,
          dataset.rightsPolicyId],
      };
      let counters: MarketRefreshCounters = Object.freeze({
        received: 0, inserted: 0, updated: 0, unchanged: 0, unlinked: 0,
      });
      for (let offset = 0; offset < batch.records.length; offset += maxRecordsPerTransaction) {
        const chunk: NormalizedMarketBatch = Object.freeze({
          ...batch,
          records: Object.freeze(batch.records.slice(offset, offset + maxRecordsPerTransaction)),
        });
        const data = payloads(chunk);
        const results = await port.transaction([
          // Keep initial dataset creation atomic with the first chunk, without
          // another HTTP round trip or an identical upsert in every later chunk.
          ...(offset === 0 ? [datasetStatement] : []),
          { statement: UPSERT_GEOGRAPHIES_SQL, parameters: [data.geographies] },
          { statement: UPSERT_ENTITIES_SQL, parameters: [data.entities] },
          { statement: APPLY_RECORDS_SQL, parameters: [data.records] },
        ]);
        const row = results.at(-1)?.[0];
        if (row === undefined) throw new TypeError('Market refresh counters are unavailable.');
        counters = addCounters(counters, Object.freeze({
          received: count(row.received, 'received'),
          inserted: count(row.inserted, 'inserted'),
          updated: count(row.updated, 'updated'),
          unchanged: count(row.unchanged, 'unchanged'),
          unlinked: count(row.unlinked, 'unlinked'),
        }));
      }
      return counters;
    },

    async succeed(run, counters, sourceAsOf) {
      const canonicalSourceAsOf = new Date(sourceAsOf);
      if (!Number.isFinite(canonicalSourceAsOf.getTime())) {
        throw new TypeError('Market refresh source instant is invalid.');
      }
      await port.transaction([
        { statement: COMPLETE_SQL, parameters: [run.runId, run.leaseToken,
          canonicalSourceAsOf.toISOString(), counters.received, counters.inserted,
          counters.updated, counters.unchanged, counters.unlinked] },
        { statement: RELEASE_SQL, parameters: [run.job, run.leaseToken] },
      ]);
    },

    async fail(run, code) {
      const safeCode = errorCode(code);
      await port.transaction([
        { statement: FAIL_SQL, parameters: [run.runId, run.leaseToken, safeCode] },
        { statement: RELEASE_SQL, parameters: [run.job, run.leaseToken] },
      ]);
    },

    async skip(run, code) {
      const safeCode = errorCode(code);
      await port.transaction([
        { statement: SKIP_SQL, parameters: [run.runId, run.leaseToken, safeCode] },
        { statement: RELEASE_SQL, parameters: [run.job, run.leaseToken] },
      ]);
    },
  });
}
