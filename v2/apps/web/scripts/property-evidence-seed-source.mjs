import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const ARTIFACTS = Object.freeze({
  'kr-rent': Object.freeze({ file: 'korea-rent-evidence.json.gz', versionKey: 'artifactVersion', version: 'signedprice-korea-rent-evidence-v2' }),
  'kr-sale': Object.freeze({ file: 'korea-sale-evidence.json.gz', versionKey: 'artifactVersion', version: 'signedprice-korea-sale-evidence-v1' }),
  'sg-private-sale': Object.freeze({ file: 'singapore-private-sale.json.gz', versionKey: 'version', version: 'signedprice-singapore-private-sale-v1' }),
  'sg-hdb': Object.freeze({ file: 'singapore-hdb.json.gz', versionKey: 'version', version: 'signedprice-singapore-hdb-published-v1' }),
});

const DATASET_DETAILS = Object.freeze({
  'kr-rent': Object.freeze({ provider: 'MOLIT', officialName: 'Reported Seoul rental contracts', landingUrl: 'https://rt.molit.go.kr/', subjectScope: 'Seoul residential rent', cadence: 'monthly', expectedLag: 'filing dependent' }),
  'kr-sale': Object.freeze({ provider: 'MOLIT', officialName: 'Reported Seoul sale contracts', landingUrl: 'https://rt.molit.go.kr/', subjectScope: 'Seoul residential sale', cadence: 'monthly', expectedLag: 'filing dependent' }),
  'sg-private-sale': Object.freeze({ provider: 'URA', officialName: 'Private residential property transactions', landingUrl: 'https://eservice.ura.gov.sg/property-market-information/pmiResidentialTransactionSearch', subjectScope: 'Singapore private residential sale', cadence: 'quarterly', expectedLag: 'provider release' }),
  'sg-hdb': Object.freeze({ provider: 'data.gov.sg', officialName: 'HDB property, rental and resale summaries', landingUrl: 'https://data.gov.sg/', subjectScope: 'Singapore HDB blocks', cadence: 'monthly', expectedLag: 'provider release' }),
});

const RIGHTS_POLICIES = Object.freeze([
  Object.freeze({ id: 'kr-molit-rent-v1', canFetch: true, canStore: true, canCache: true, canDisplay: true, canCreateDerived: true, canUseCommercially: true, canIndex: true, attribution: Object.freeze(['국토교통부 실거래가 공개시스템']), policyUrl: 'https://rt.molit.go.kr/' }),
  Object.freeze({ id: 'kr-molit-sale-v1', canFetch: true, canStore: true, canCache: true, canDisplay: true, canCreateDerived: true, canUseCommercially: true, canIndex: true, attribution: Object.freeze(['국토교통부 실거래가 공개시스템']), policyUrl: 'https://rt.molit.go.kr/' }),
  Object.freeze({ id: 'sg-open-data-licence-v1', canFetch: true, canStore: true, canCache: true, canDisplay: true, canCreateDerived: true, canUseCommercially: true, canIndex: true, attribution: Object.freeze(['data.gov.sg']), policyUrl: 'https://data.gov.sg/open-data-licence' }),
  Object.freeze({ id: 'sg-ura-private-sale-v1', canFetch: true, canStore: true, canCache: true, canDisplay: true, canCreateDerived: true, canUseCommercially: true, canIndex: true, attribution: Object.freeze(['Urban Redevelopment Authority']), policyUrl: 'https://www.ura.gov.sg/' }),
]);

const METRIC_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'sg-hdb-rental-median-sgd', label: 'HDB rental median', unit: 'SGD/month', formula: 'median reported monthly rent', frequency: 'release' }),
  Object.freeze({ id: 'sg-hdb-rental-sample-count', label: 'HDB rental sample count', unit: 'transactions', formula: 'count of reported rental records', frequency: 'release' }),
  Object.freeze({ id: 'sg-hdb-resale-median-sgd', label: 'HDB resale median', unit: 'SGD', formula: 'median reported resale price', frequency: 'release' }),
  Object.freeze({ id: 'sg-hdb-resale-sample-count', label: 'HDB resale sample count', unit: 'transactions', formula: 'count of reported resale records', frequency: 'release' }),
]);

let cachedSeed;

function readDataFile(name) {
  for (const path of [resolve(process.cwd(), 'data', name), resolve(process.cwd(), 'apps/web/data', name)]) {
    try { return readFileSync(path); } catch { /* Try the workspace-root location. */ }
  }
  throw new Error(`SignedPrice evidence seed source unavailable: ${name}`);
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stableDigest(values) {
  return sha256([...values].sort().join('\n'));
}

function metricContentKey(row) {
  return `${row.identityKey}:${row.valueNumeric ?? ''}:${row.valueText ?? ''}:${row.sampleSize ?? ''}`;
}

function object(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`SignedPrice evidence seed source invalid: ${label}`);
  }
  return value;
}

function text(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`SignedPrice evidence seed source invalid: ${label}`);
  }
  return value.trim();
}

function monthRange(period) {
  const [from, to] = period.split('/');
  if (!/^\d{4}-\d{2}$/.test(from ?? '') || !/^\d{4}-\d{2}$/.test(to ?? '')) {
    throw new TypeError('SignedPrice evidence period invalid.');
  }
  const [year, month] = to.split('-').map(Number);
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return Object.freeze({ start: `${from}-01`, end });
}

function installedRegistry() {
  const registry = object(JSON.parse(readDataFile('installed-snapshots.json').toString('utf8')), 'registry');
  if (registry.registryVersion !== 'signedprice-installed-snapshots-v1' || !Array.isArray(registry.snapshots)) {
    throw new TypeError('SignedPrice installed snapshot registry invalid.');
  }
  return new Map(registry.snapshots.map((entry) => {
    const row = object(entry, 'registry snapshot');
    return [text(row.dataset, 'registry dataset'), row];
  }));
}

function readVerifiedArtifact(datasetId, registry) {
  const definition = ARTIFACTS[datasetId];
  const metadata = registry.get(datasetId);
  if (!definition || !metadata) throw new TypeError(`SignedPrice installed snapshot missing: ${datasetId}`);
  const serialized = gunzipSync(readDataFile(definition.file));
  const payload = JSON.parse(serialized.toString('utf8'));
  if (payload[definition.versionKey] !== definition.version
    || metadata.schemaVersion !== definition.version
    || sha256(serialized) !== metadata.sha256) {
    throw new TypeError(`SignedPrice installed snapshot mismatch: ${datasetId}`);
  }
  return Object.freeze({ metadata, payload });
}

function observationRow(datasetId, businessKey, entityId, source, fields, options = {}) {
  const contentHash = sha256(canonicalJson(source));
  return Object.freeze({
    datasetId,
    businessKey,
    contentHash,
    entityId,
    projectable: options.projectable ?? true,
    ...fields,
    rawMetadata: options.rawMetadata ?? Object.freeze({}),
  });
}

function seoulPropertyEntityIds() {
  const payload = object(
    JSON.parse(gunzipSync(readDataFile('observed-building-inventory.json.gz')).toString('utf8')),
    'Seoul building inventory',
  );
  if (payload.artifactVersion !== 'signedprice-observed-building-inventory-v1'
    || !Array.isArray(payload.records)) {
    throw new TypeError('SignedPrice Seoul building inventory version mismatch.');
  }
  return new Set(payload.records.map((entry) => {
    const row = object(entry, 'Seoul building inventory row');
    return `kr-seoul:estate:${text(row.buildingId, 'Seoul building ID')}`;
  }));
}

function koreaRentRows(payload) {
  return Object.freeze(payload.buildingRecords.flatMap((building) =>
    building.recentTransactions.map((transaction, index) => observationRow(
      'kr-rent',
      `${building.buildingId}:${String(index).padStart(2, '0')}`,
      `kr-seoul:estate:${building.buildingId}`,
      Object.freeze({ buildingId: building.buildingId, transaction }),
      Object.freeze({
        marketId: 'kr-seoul', kind: 'rent', stage: transaction.contractType,
        observedAt: `${transaction.filedMonth}-01`, registeredAt: null,
        periodStart: `${transaction.filedMonth}-01`, periodEnd: `${transaction.filedMonth}-01`,
        amountMinor: null, annualAmountMinor: null, currencyCode: 'KRW',
        depositMinor: transaction.depositWon,
        recurringAmountMinor: transaction.monthlyRentWon,
        frequency: transaction.monthlyRentWon > 0 ? 'monthly' : 'once',
        propertyAreaSqm: transaction.areaSqm, transactedAreaSqm: null,
        areaBasis: 'reported-exclusive-area', floorValue: null, floorRange: null,
        tenureKind: null, localSchemaVersion: 'kr-rent-recent@1',
      }),
      Object.freeze({
        rawMetadata: Object.freeze({ transactionKind: transaction.transaction }),
      }),
    )),
  ));
}

function koreaSaleRows(payload, propertyEntityIds) {
  return Object.freeze(payload.buildingRecords.flatMap((building) =>
    building.recentSales.map((transaction, index) => {
      const entityId = `kr-seoul:estate:${building.buildingId}`;
      const source = Object.freeze({ buildingId: building.buildingId, transaction });
      const projectable = propertyEntityIds.has(entityId);
      return observationRow(
        'kr-sale',
        `${building.buildingId}:${String(index).padStart(2, '0')}`,
        entityId,
        source,
        Object.freeze({
          marketId: 'kr-seoul', kind: 'sale', stage: null,
          observedAt: `${transaction.filedMonth}-01`, registeredAt: null,
          periodStart: `${transaction.filedMonth}-01`, periodEnd: `${transaction.filedMonth}-01`,
          amountMinor: transaction.priceWon, annualAmountMinor: null, currencyCode: 'KRW',
          depositMinor: null, recurringAmountMinor: null, frequency: 'once',
          propertyAreaSqm: transaction.areaSqm, transactedAreaSqm: null,
          areaBasis: 'reported-exclusive-area', floorValue: transaction.floor ?? null,
          floorRange: null, tenureKind: null, localSchemaVersion: 'kr-sale-recent@1',
        }),
        Object.freeze({
          projectable,
          rawMetadata: projectable
            ? Object.freeze({ buildYear: transaction.buildYear ?? null })
            : Object.freeze({ source }),
        }),
      );
    }),
  ));
}

function singaporePrivateRows(payload) {
  return Object.freeze(payload.records.map((transaction) => observationRow(
    'sg-private-sale',
    `${transaction.sourceOrder.batch}:${transaction.sourceOrder.project}:${transaction.sourceOrder.transaction}`,
    `sg-singapore:project:${transaction.projectId}`,
    transaction,
    Object.freeze({
      marketId: 'sg-singapore', kind: 'sale', stage: transaction.saleType,
      observedAt: transaction.contractMonth, registeredAt: null,
      periodStart: transaction.contractMonth, periodEnd: transaction.contractMonth,
      amountMinor: transaction.priceSgd * 100, annualAmountMinor: null, currencyCode: 'SGD',
      depositMinor: null, recurringAmountMinor: null, frequency: 'once',
      propertyAreaSqm: transaction.areaSqm, transactedAreaSqm: transaction.areaSqm,
      areaBasis: transaction.areaBasis, floorValue: null, floorRange: transaction.floorRange,
      tenureKind: transaction.tenure, localSchemaVersion: 'sg-private-sale@1',
    }),
    Object.freeze({
      rawMetadata: Object.freeze({
        contractDate: transaction.contractDate,
        netPriceSgd: transaction.netPriceSgd ?? null,
        propertyType: transaction.propertyType,
        psf: transaction.psf ?? null,
        units: transaction.units,
      }),
    }),
  )));
}

function hdbMetricRows(payload, releaseId) {
  const rentalPeriod = monthRange(payload.periods.rental);
  const resalePeriod = monthRange(payload.periods.resale);
  return Object.freeze(payload.blocks.flatMap((block) => {
    const entityId = `sg-singapore:block:${block.blockId}`;
    return [
      ['sg-hdb-rental-median-sgd', block.rental.medianSgd, rentalPeriod],
      ['sg-hdb-rental-sample-count', block.rental.n, rentalPeriod],
      ['sg-hdb-resale-median-sgd', block.resale.medianSgd, resalePeriod],
      ['sg-hdb-resale-sample-count', block.resale.n, resalePeriod],
    ].map(([metricDefinitionId, valueNumeric, period]) => Object.freeze({
      metricDefinitionId,
      evidenceReleaseId: releaseId,
      marketId: 'sg-singapore',
      entityId,
      periodStart: period.start,
      periodEnd: period.end,
      valueNumeric: typeof valueNumeric === 'number' && Number.isFinite(valueNumeric)
        ? valueNumeric
        : null,
      valueText: typeof valueNumeric === 'number' && Number.isFinite(valueNumeric)
        ? null
        : 'withheld',
      sampleSize: metricDefinitionId.endsWith('sample-count') ? null
        : metricDefinitionId.includes('rental') ? block.rental.n : block.resale.n,
      identityKey: `${metricDefinitionId}:${entityId}:${period.start}:${period.end}`,
    }));
  }));
}

function metadataRows(artifacts) {
  const datasets = Object.freeze(Object.keys(artifacts).sort().map((datasetId) => {
    const { metadata } = artifacts[datasetId];
    const details = DATASET_DETAILS[datasetId];
    return Object.freeze({
      id: datasetId, marketId: metadata.marketId, provider: details.provider,
      officialName: details.officialName, landingUrl: details.landingUrl,
      subjectScope: details.subjectScope, refreshCadence: details.cadence,
      expectedLag: details.expectedLag, schemaVersion: metadata.schemaVersion,
      parserVersion: metadata.parserVersion, rightsPolicyId: metadata.rightsPolicyId,
    });
  }));
  const evidenceReleases = Object.freeze(Object.keys(artifacts).sort().map((datasetId) => {
    const { metadata, payload } = artifacts[datasetId];
    const period = monthRange(metadata.period);
    const sourceRecordCount = datasetId === 'sg-hdb'
      ? payload.totals?.sourceRows
      : datasetId === 'sg-private-sale'
        ? payload.totals?.transactions
        : payload.stats?.sourceRecordCount;
    if (!Number.isSafeInteger(sourceRecordCount) || sourceRecordCount < 0) {
      throw new TypeError(`SignedPrice source record count invalid: ${datasetId}`);
    }
    return Object.freeze({
      id: `${datasetId}:${metadata.period.replace('/', ':')}`,
      datasetId, marketId: metadata.marketId, periodStart: period.start, periodEnd: period.end,
      releasedAt: metadata.generatedAt, generatedAt: metadata.generatedAt,
      sampleSize: sourceRecordCount, recordCount: sourceRecordCount,
      rightsState: 'approved', publicationState: 'released', publicationMinimum: null,
      rightsPolicyId: metadata.rightsPolicyId, displayState: 'published', indexState: 'indexed',
      objectUrl: metadata.objectUrl, sha256: metadata.sha256,
      coverage: Object.freeze({ sourceVersion: metadata.sourceVersion }),
      limitations: Object.freeze(['Database rows mirror only the row-level or aggregate evidence present in the installed artifact.']),
    });
  }));
  return Object.freeze({ rightsPolicies: RIGHTS_POLICIES, datasets, evidenceReleases, metricDefinitions: METRIC_DEFINITIONS });
}

export function loadPropertyEvidenceSeed() {
  if (cachedSeed !== undefined) return cachedSeed;
  const registry = installedRegistry();
  const artifacts = Object.freeze(Object.fromEntries(Object.keys(ARTIFACTS).map((datasetId) =>
    [datasetId, readVerifiedArtifact(datasetId, registry)])));
  const observations = Object.freeze({
    'kr-rent': koreaRentRows(artifacts['kr-rent'].payload),
    'kr-sale': koreaSaleRows(artifacts['kr-sale'].payload, seoulPropertyEntityIds()),
    'sg-private-sale': singaporePrivateRows(artifacts['sg-private-sale'].payload),
  });
  const hdbReleaseId = `sg-hdb:${artifacts['sg-hdb'].metadata.period.replace('/', ':')}`;
  const metrics = hdbMetricRows(artifacts['sg-hdb'].payload, hdbReleaseId);
  const allObservations = Object.freeze(Object.values(observations).flat());
  const projectedObservations = Object.freeze(allObservations.filter((row) => row.projectable));
  const summary = Object.freeze({
    koreaRentSourceRecords: observations['kr-rent'].length,
    koreaRentObservations: observations['kr-rent'].filter((row) => row.projectable).length,
    koreaSaleSourceRecords: observations['kr-sale'].length,
    koreaSaleObservations: observations['kr-sale'].filter((row) => row.projectable).length,
    singaporePrivateSourceRecords: observations['sg-private-sale'].length,
    singaporePrivateObservations: observations['sg-private-sale'].filter((row) => row.projectable).length,
    sourceRecordTotal: allObservations.length,
    observationTotal: projectedObservations.length,
    unlinkedSourceRecords: allObservations.length - projectedObservations.length,
    hdbMetricRows: metrics.length,
    observationIdentityDigest: stableDigest(allObservations.map((row) => `${row.datasetId}:${row.businessKey}`)),
    observationContentDigest: stableDigest(allObservations.map((row) => `${row.datasetId}:${row.businessKey}:${row.contentHash}`)),
    metricIdentityDigest: stableDigest(metrics.map((row) => row.identityKey)),
    metricContentDigest: stableDigest(metrics.map(metricContentKey)),
  });
  cachedSeed = Object.freeze({ metadata: metadataRows(artifacts), observations, metrics, summary });
  return cachedSeed;
}

export function propertyEvidenceSeedPage(kind, offset = 0, limit = 1_000) {
  const seed = loadPropertyEvidenceSeed();
  const source = kind === 'sg-hdb-metrics' ? seed.metrics : seed.observations[kind];
  if (!Array.isArray(source)) throw new RangeError('Unknown SignedPrice evidence seed kind.');
  const start = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
  const size = Number.isSafeInteger(limit) && limit >= 1 && limit <= 5_000 ? limit : 1_000;
  return Object.freeze({ kind, offset: start, limit: size, total: source.length, items: Object.freeze(source.slice(start, start + size)) });
}
