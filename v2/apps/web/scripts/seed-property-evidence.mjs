import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

import { neon } from '@neondatabase/serverless';
import { loadPropertyEvidenceSeed } from './property-evidence-seed-source.mjs';

const OBSERVATION_DATASETS = Object.freeze(['kr-rent', 'kr-sale', 'sg-private-sale']);
const EXPECTED_LEGACY_ID_DIGEST = 'd86ae08ab146e07570ccbd7b15f07a80f3ca5fd537d7199f58628348439e446a';
const EXPECTED_ENTITY_ID_DIGEST = '92be10891460d8604c8b6661cd4884c3eaee9ce5791a14ec6c59a49a2d9e3729';

function stableDigest(values) {
  return createHash('sha256').update([...values].sort().join('\n')).digest('hex');
}

function batches(rows, batchSize) {
  const output = [];
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    output.push(rows.slice(offset, offset + batchSize));
  }
  return output;
}

function assertScope(seed) {
  const observations = Object.values(seed.observations).flat();
  if (observations.some((row) => !/^(?:kr-seoul|sg-singapore):/u.test(row.entityId))
    || seed.metrics.some((row) => !row.entityId.startsWith('sg-singapore:block:'))) {
    throw new RangeError('Property evidence seed scope is limited to Seoul and Singapore.');
  }
}

export function createPropertyEvidenceSeedRunner(port, loadSeed = loadPropertyEvidenceSeed) {
  return Object.freeze({
    async run({ batchSize = 500, verifyOnly = false } = {}) {
      if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 1_000) {
        throw new RangeError('Property evidence batch size must be between 1 and 1000.');
      }
      const seed = loadSeed();
      assertScope(seed);
      const beforeDubai = port.captureDubai === undefined ? null : await port.captureDubai();
      let insertedObservations = 0;
      let insertedMetrics = 0;
      if (!verifyOnly) {
        await port.upsertMetadata(seed.metadata);
        for (const datasetId of OBSERVATION_DATASETS) {
          for (const batch of batches(seed.observations[datasetId], batchSize)) {
            insertedObservations += await port.upsertObservations(batch);
          }
        }
        for (const batch of batches(seed.metrics, batchSize)) {
          insertedMetrics += await port.upsertMetrics(batch);
        }
      }
      const verification = await port.verify(seed.summary);
      const afterDubai = port.captureDubai === undefined ? null : await port.captureDubai();
      if (beforeDubai !== null && JSON.stringify(beforeDubai) !== JSON.stringify(afterDubai)) {
        throw new Error('Dubai evidence state changed during a scoped seed.');
      }
      return Object.freeze({
        insertedObservations,
        insertedMetrics,
        verification,
        dubaiUnchanged: beforeDubai === null || JSON.stringify(beforeDubai) === JSON.stringify(afterDubai),
      });
    },
  });
}

function parseCount(value, label) {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new TypeError(`Invalid ${label} count.`);
  return parsed;
}

function databasePort(connectionString) {
  const sql = neon(connectionString);
  return Object.freeze({
    async upsertMetadata(metadata) {
      const checkedAt = metadata.evidenceReleases
        .map(({ generatedAt }) => generatedAt).sort().at(-1);
      await sql.transaction((transaction) => [
        transaction.query(`
          INSERT INTO rights_policies (
            id, can_fetch, can_store, can_cache, can_display, can_create_derived,
            can_use_commercially, can_index, attribution, policy_url, checked_at
          )
          SELECT id, can_fetch, can_store, can_cache, can_display, can_create_derived,
            can_use_commercially, can_index, attribution, policy_url, checked_at
          FROM jsonb_to_recordset($1::jsonb) AS source(
            id text, can_fetch boolean, can_store boolean, can_cache boolean,
            can_display boolean, can_create_derived boolean, can_use_commercially boolean,
            can_index boolean, attribution jsonb, policy_url text, checked_at timestamptz
          )
          ON CONFLICT (id) DO UPDATE SET
            can_fetch = excluded.can_fetch,
            can_store = excluded.can_store,
            can_cache = excluded.can_cache,
            can_display = excluded.can_display,
            can_create_derived = excluded.can_create_derived,
            can_use_commercially = excluded.can_use_commercially,
            can_index = excluded.can_index,
            attribution = excluded.attribution,
            policy_url = excluded.policy_url,
            checked_at = excluded.checked_at,
            updated_at = now()
          WHERE (
            rights_policies.can_fetch, rights_policies.can_store, rights_policies.can_cache,
            rights_policies.can_display, rights_policies.can_create_derived,
            rights_policies.can_use_commercially, rights_policies.can_index,
            rights_policies.attribution, rights_policies.policy_url, rights_policies.checked_at
          ) IS DISTINCT FROM (
            excluded.can_fetch, excluded.can_store, excluded.can_cache, excluded.can_display,
            excluded.can_create_derived, excluded.can_use_commercially, excluded.can_index,
            excluded.attribution, excluded.policy_url, excluded.checked_at
          )
        `, [JSON.stringify(metadata.rightsPolicies.map((row) => ({
          id: row.id, can_fetch: row.canFetch, can_store: row.canStore,
          can_cache: row.canCache, can_display: row.canDisplay,
          can_create_derived: row.canCreateDerived,
          can_use_commercially: row.canUseCommercially, can_index: row.canIndex,
          attribution: row.attribution, policy_url: row.policyUrl, checked_at: checkedAt,
        }))) ]),
        transaction.query(`
          INSERT INTO datasets (
            id, market_id, provider, official_name, landing_url, subject_scope,
            refresh_cadence, expected_lag, schema_version, parser_version, rights_policy_id
          )
          SELECT id, market_id, provider, official_name, landing_url, subject_scope,
            refresh_cadence, expected_lag, schema_version, parser_version, rights_policy_id
          FROM jsonb_to_recordset($1::jsonb) AS source(
            id text, market_id text, provider text, official_name text, landing_url text,
            subject_scope text, refresh_cadence text, expected_lag text,
            schema_version text, parser_version text, rights_policy_id text
          )
          ON CONFLICT (id) DO UPDATE SET
            market_id = excluded.market_id, provider = excluded.provider,
            official_name = excluded.official_name, landing_url = excluded.landing_url,
            subject_scope = excluded.subject_scope, refresh_cadence = excluded.refresh_cadence,
            expected_lag = excluded.expected_lag, schema_version = excluded.schema_version,
            parser_version = excluded.parser_version, rights_policy_id = excluded.rights_policy_id,
            updated_at = now()
          WHERE (
            datasets.market_id, datasets.provider, datasets.official_name, datasets.landing_url,
            datasets.subject_scope, datasets.refresh_cadence, datasets.expected_lag,
            datasets.schema_version, datasets.parser_version, datasets.rights_policy_id
          ) IS DISTINCT FROM (
            excluded.market_id, excluded.provider, excluded.official_name, excluded.landing_url,
            excluded.subject_scope, excluded.refresh_cadence, excluded.expected_lag,
            excluded.schema_version, excluded.parser_version, excluded.rights_policy_id
          )
        `, [JSON.stringify(metadata.datasets.map((row) => ({
          id: row.id, market_id: row.marketId, provider: row.provider,
          official_name: row.officialName, landing_url: row.landingUrl,
          subject_scope: row.subjectScope, refresh_cadence: row.refreshCadence,
          expected_lag: row.expectedLag, schema_version: row.schemaVersion,
          parser_version: row.parserVersion, rights_policy_id: row.rightsPolicyId,
        })))]),
        transaction.query(`
          INSERT INTO evidence_releases (
            id, dataset_id, market_id, period_start, period_end, released_at,
            sample_size, rights_state, publication_state, limitations, generated_at,
            record_count, coverage, publication_minimum, rights_policy_id,
            display_state, index_state, object_url, sha256
          )
          SELECT id, dataset_id, market_id, period_start, period_end, released_at,
            sample_size, rights_state, publication_state, limitations, generated_at,
            record_count, coverage, publication_minimum, rights_policy_id,
            display_state, index_state, object_url, sha256
          FROM jsonb_to_recordset($1::jsonb) AS source(
            id text, dataset_id text, market_id text, period_start date, period_end date,
            released_at timestamptz, sample_size integer, rights_state text,
            publication_state text, limitations jsonb, generated_at timestamptz,
            record_count integer, coverage jsonb, publication_minimum integer,
            rights_policy_id text, display_state text, index_state text,
            object_url text, sha256 char(64)
          )
          ON CONFLICT (id) DO UPDATE SET
            sample_size = excluded.sample_size, limitations = excluded.limitations,
            record_count = excluded.record_count, coverage = excluded.coverage,
            object_url = excluded.object_url, sha256 = excluded.sha256
          WHERE (
            evidence_releases.sample_size, evidence_releases.limitations,
            evidence_releases.record_count, evidence_releases.coverage,
            evidence_releases.object_url, evidence_releases.sha256
          ) IS DISTINCT FROM (
            excluded.sample_size, excluded.limitations, excluded.record_count,
            excluded.coverage, excluded.object_url, excluded.sha256
          )
        `, [JSON.stringify(metadata.evidenceReleases.map((row) => ({
          id: row.id, dataset_id: row.datasetId, market_id: row.marketId,
          period_start: row.periodStart, period_end: row.periodEnd,
          released_at: row.releasedAt, sample_size: row.sampleSize,
          rights_state: row.rightsState, publication_state: row.publicationState,
          limitations: row.limitations, generated_at: row.generatedAt,
          record_count: row.recordCount, coverage: row.coverage,
          publication_minimum: row.publicationMinimum, rights_policy_id: row.rightsPolicyId,
          display_state: row.displayState, index_state: row.indexState,
          object_url: row.objectUrl, sha256: row.sha256,
        })))]),
        transaction.query(`
          INSERT INTO metric_definitions (id, label, unit, formula, frequency)
          SELECT id, label, unit, formula, frequency
          FROM jsonb_to_recordset($1::jsonb) AS source(
            id text, label text, unit text, formula text, frequency text
          )
          ON CONFLICT (id) DO UPDATE SET
            label = excluded.label, unit = excluded.unit, formula = excluded.formula,
            frequency = excluded.frequency, updated_at = now()
          WHERE (metric_definitions.label, metric_definitions.unit,
            metric_definitions.formula, metric_definitions.frequency)
            IS DISTINCT FROM (excluded.label, excluded.unit, excluded.formula, excluded.frequency)
        `, [JSON.stringify(metadata.metricDefinitions)]),
      ]);
      return metadata.rightsPolicies.length + metadata.datasets.length
        + metadata.evidenceReleases.length + metadata.metricDefinitions.length;
    },
    async upsertObservations(rows) {
      const payload = JSON.stringify(rows.map((row) => ({
        dataset_id: row.datasetId, business_key: row.businessKey,
        content_hash: row.contentHash, entity_id: row.entityId,
        projectable: row.projectable,
        market_id: row.marketId, kind: row.kind, stage: row.stage,
        observed_at: row.observedAt, registered_at: row.registeredAt,
        period_start: row.periodStart, period_end: row.periodEnd,
        amount_minor: row.amountMinor, annual_amount_minor: row.annualAmountMinor,
        currency_code: row.currencyCode, deposit_minor: row.depositMinor,
        recurring_amount_minor: row.recurringAmountMinor, frequency: row.frequency,
        property_area_sqm: row.propertyAreaSqm, transacted_area_sqm: row.transactedAreaSqm,
        area_basis: row.areaBasis, floor_value: row.floorValue, floor_range: row.floorRange,
        tenure_kind: row.tenureKind, raw_metadata: row.rawMetadata,
        local_schema_version: row.localSchemaVersion,
      })));
      const inputShape = `
        SELECT * FROM jsonb_to_recordset($1::jsonb) AS row(
          dataset_id text, business_key text, content_hash char(64), entity_id text,
          projectable boolean,
          market_id text, kind text, stage text, observed_at date, registered_at date,
          period_start date, period_end date, amount_minor bigint,
          annual_amount_minor bigint, currency_code char(3), deposit_minor bigint,
          recurring_amount_minor bigint, frequency text, property_area_sqm numeric(12,3),
          transacted_area_sqm numeric(12,3), area_basis text, floor_value integer,
          floor_range text, tenure_kind text, raw_metadata jsonb, local_schema_version text
        )
      `;
      const [, observationResult] = await sql.transaction((transaction) => [
        transaction.query(`
          WITH input AS (${inputShape})
          INSERT INTO source_records (
            dataset_id, business_key, content_hash, observed_at, raw_metadata
          )
          SELECT dataset_id, business_key, content_hash, observed_at::timestamptz, raw_metadata
          FROM input
          ON CONFLICT (dataset_id, business_key, content_hash) DO NOTHING
        `, [payload]),
        transaction.query(`
          WITH input AS (${inputShape}), inserted_observations AS (
          INSERT INTO observations (
            market_id, subject_entity_id, source_record_id, kind, stage, observed_at,
            registered_at, period_start, period_end, amount_minor, annual_amount_minor,
            currency_code, deposit_minor, recurring_amount_minor, frequency,
            property_area_sqm, transacted_area_sqm, area_basis, floor_value, floor_range,
            tenure_kind, local_attributes, local_schema_version
          )
          SELECT input.market_id, input.entity_id, source.id, input.kind, input.stage,
            input.observed_at, input.registered_at, input.period_start, input.period_end,
            input.amount_minor, input.annual_amount_minor, input.currency_code,
            input.deposit_minor, input.recurring_amount_minor, input.frequency,
            input.property_area_sqm, input.transacted_area_sqm, input.area_basis,
            input.floor_value, input.floor_range, input.tenure_kind,
            jsonb_build_object('businessKey', input.business_key), input.local_schema_version
          FROM input
          INNER JOIN source_records AS source
            ON source.dataset_id = input.dataset_id
            AND source.business_key = input.business_key
            AND source.content_hash = input.content_hash
          INNER JOIN property_entities AS entity ON entity.id = input.entity_id
          WHERE input.projectable
          ON CONFLICT (source_record_id, subject_entity_id, kind) DO NOTHING
          RETURNING id
          )
          SELECT count(*)::text AS inserted FROM inserted_observations
        `, [payload]),
      ]);
      const [result] = observationResult;
      return parseCount(result?.inserted ?? '0', 'inserted observation');
    },
    async upsertMetrics(rows) {
      const payload = JSON.stringify(rows.map((row) => ({
        metric_definition_id: row.metricDefinitionId,
        evidence_release_id: row.evidenceReleaseId,
        market_id: row.marketId, subject_entity_id: row.entityId,
        period_start: row.periodStart, period_end: row.periodEnd,
        value_numeric: row.valueNumeric, value_text: row.valueText,
        sample_size: row.sampleSize,
      })));
      const [result] = await sql.query(`
        WITH inserted AS (
          INSERT INTO metric_observations (
            metric_definition_id, evidence_release_id, market_id, subject_entity_id,
            period_start, period_end, value_numeric, value_text, sample_size
          )
          SELECT metric_definition_id, evidence_release_id, market_id, subject_entity_id,
            period_start, period_end, value_numeric, value_text, sample_size
          FROM jsonb_to_recordset($1::jsonb) AS source(
            metric_definition_id text, evidence_release_id text, market_id text,
            subject_entity_id text, period_start date, period_end date,
            value_numeric numeric, value_text text, sample_size integer
          )
          ON CONFLICT (metric_definition_id, evidence_release_id, subject_entity_id,
            period_start, period_end) WHERE subject_entity_id IS NOT NULL DO NOTHING
          RETURNING id
        )
        SELECT count(*)::text AS inserted FROM inserted
      `, [payload]);
      return parseCount(result?.inserted ?? '0', 'inserted metric');
    },
    async verify(expected) {
      const [counts, sourceRows, metricRows, entityRows, legacyRows, orphanRows] = await Promise.all([
        sql.query(`
          SELECT source.dataset_id, count(*)::text AS source_count,
            count(observation.id)::text AS observation_count
          FROM source_records AS source
          LEFT JOIN observations AS observation ON observation.source_record_id = source.id
          WHERE source.dataset_id = ANY($1::text[])
          GROUP BY source.dataset_id ORDER BY source.dataset_id
        `, [OBSERVATION_DATASETS]),
        sql.query(`
          SELECT source.dataset_id, source.business_key, source.content_hash
          FROM source_records AS source
          WHERE source.dataset_id = ANY($1::text[])
          ORDER BY source.dataset_id, source.business_key, source.content_hash
        `, [OBSERVATION_DATASETS]),
        sql.query(`
          SELECT definition.id AS metric_definition_id, observation.subject_entity_id,
            observation.period_start::text, observation.period_end::text
          FROM metric_observations AS observation
          INNER JOIN metric_definitions AS definition
            ON definition.id = observation.metric_definition_id
          WHERE definition.id LIKE 'sg-hdb-%'
          ORDER BY definition.id, observation.subject_entity_id,
            observation.period_start, observation.period_end
        `),
        sql.query(`
          SELECT id FROM property_entities
          WHERE market_id IN ('kr-seoul', 'sg-singapore') ORDER BY id
        `),
        sql.query(`
          SELECT market_key, external_id FROM buildings
          WHERE market_key IN ('seoul', 'singapore') ORDER BY market_key, external_id
        `),
        sql.query(`
          SELECT count(*)::text AS count
          FROM observations AS observation
          LEFT JOIN property_entities AS entity ON entity.id = observation.subject_entity_id
          LEFT JOIN source_records AS source ON source.id = observation.source_record_id
          WHERE source.dataset_id = ANY($1::text[])
            AND (entity.id IS NULL OR entity.market_id NOT IN ('kr-seoul', 'sg-singapore'))
        `, [OBSERVATION_DATASETS]),
      ]);
      const sourceByDataset = Object.fromEntries(counts.map((row) => [
        row.dataset_id,
        parseCount(row.source_count, `${row.dataset_id} source record`),
      ]));
      const observationByDataset = Object.fromEntries(counts.map((row) => [
        row.dataset_id,
        parseCount(row.observation_count, `${row.dataset_id} observation`),
      ]));
      const observationIdentityDigest = stableDigest(sourceRows.map((row) => `${row.dataset_id}:${row.business_key}`));
      const observationContentDigest = stableDigest(sourceRows.map((row) => `${row.dataset_id}:${row.business_key}:${row.content_hash}`));
      const metricIdentityDigest = stableDigest(metricRows.map((row) =>
        `${row.metric_definition_id}:${row.subject_entity_id}:${row.period_start}:${row.period_end}`));
      const verification = Object.freeze({
        koreaRentSourceRecords: sourceByDataset['kr-rent'] ?? 0,
        koreaRentObservations: observationByDataset['kr-rent'] ?? 0,
        koreaSaleSourceRecords: sourceByDataset['kr-sale'] ?? 0,
        koreaSaleObservations: observationByDataset['kr-sale'] ?? 0,
        singaporePrivateSourceRecords: sourceByDataset['sg-private-sale'] ?? 0,
        singaporePrivateObservations: observationByDataset['sg-private-sale'] ?? 0,
        sourceRecordTotal: Object.values(sourceByDataset).reduce((sum, count) => sum + count, 0),
        observationTotal: Object.values(observationByDataset).reduce((sum, count) => sum + count, 0),
        unlinkedSourceRecords: Object.values(sourceByDataset).reduce((sum, count) => sum + count, 0)
          - Object.values(observationByDataset).reduce((sum, count) => sum + count, 0),
        hdbMetricRows: metricRows.length,
        observationIdentityDigest,
        observationContentDigest,
        metricIdentityDigest,
        entityIdDigest: stableDigest(entityRows.map((row) => row.id)),
        legacyIdDigest: stableDigest(legacyRows.map((row) => `${row.market_key}:${row.external_id}`)),
        orphanObservations: parseCount(orphanRows[0]?.count ?? '0', 'orphan observation'),
      });
      for (const key of ['koreaRentSourceRecords', 'koreaRentObservations', 'koreaSaleSourceRecords',
        'koreaSaleObservations', 'singaporePrivateSourceRecords', 'singaporePrivateObservations',
        'sourceRecordTotal', 'observationTotal', 'unlinkedSourceRecords', 'hdbMetricRows',
        'observationIdentityDigest', 'observationContentDigest', 'metricIdentityDigest']) {
        if (verification[key] !== expected[key]) throw new Error(`Property evidence verification mismatch: ${key}`);
      }
      if (verification.entityIdDigest !== EXPECTED_ENTITY_ID_DIGEST
        || verification.legacyIdDigest !== EXPECTED_LEGACY_ID_DIGEST
        || verification.orphanObservations !== 0) {
        throw new Error('Property identity or orphan verification mismatch.');
      }
      return verification;
    },
    async captureDubai() {
      const [row] = await sql.query(`
        SELECT
          (SELECT count(*)::text FROM buildings WHERE market_key = 'dubai') AS buildings,
          (SELECT count(*)::text FROM property_entities WHERE market_id = 'ae-dubai') AS entities,
          (SELECT count(*)::text FROM building_photos AS photo
            INNER JOIN buildings AS building ON building.key = photo.building_key
            WHERE building.market_key = 'dubai') AS photos,
          (SELECT count(*)::text FROM observations WHERE market_id = 'ae-dubai') AS observations
      `);
      return Object.freeze({ ...row });
    },
  });
}

function parseArguments(argv) {
  const verifyOnly = argv.includes('--verify-only');
  const dryRun = argv.includes('--dry-run');
  const batchArgument = argv.find((argument) => argument.startsWith('--batch-size='));
  const batchSize = batchArgument === undefined ? 500 : Number(batchArgument.slice('--batch-size='.length));
  return Object.freeze({ verifyOnly, dryRun, batchSize });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const seed = loadPropertyEvidenceSeed();
  if (options.dryRun) {
    process.stdout.write(`${JSON.stringify({ state: 'dry-run', summary: seed.summary })}\n`);
    return;
  }
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const result = await createPropertyEvidenceSeedRunner(databasePort(connectionString))
    .run({ batchSize: options.batchSize, verifyOnly: options.verifyOnly });
  process.stdout.write(`${JSON.stringify({ state: options.verifyOnly ? 'verified' : 'seeded', ...result })}\n`);
}

const entry = process.argv[1] === undefined ? null : pathToFileURL(process.argv[1]).href;
if (entry === import.meta.url) await main();
