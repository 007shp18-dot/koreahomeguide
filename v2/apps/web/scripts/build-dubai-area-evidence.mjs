import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const VERSION = 'signedprice-dubai-area-evidence-v1';
const SLUG_REGISTRY_VERSION = 'signedprice-dubai-area-slugs-v1';
const ALIAS_MAPPING_VERSION = 'ae-dubai-area-alias-v1';
const ALIAS_MAPPING_METHOD = 'lands-project-unanimous';
const PUBLICATION_MINIMUM = 30;
const DAY_MS = 86_400_000;
const SALE_PROCEDURES = new Set([
  'Sale',
  'Sell - Pre registration',
  'Delayed Sell',
  'Sale On Payment Plan',
]);
const TRANSACTION_HEADERS = Object.freeze([
  'TRANSACTION_NUMBER', 'INSTANCE_DATE', 'GROUP_EN', 'PROCEDURE_EN',
  'IS_OFFPLAN_EN', 'USAGE_EN', 'AREA_EN', 'PROP_TYPE_EN', 'PROP_SB_TYPE_EN',
  'TRANS_VALUE', 'ACTUAL_AREA', 'PROJECT_EN',
]);
const RENT_HEADERS = Object.freeze([
  'REGISTRATION_DATE', 'VERSION_EN', 'AREA_EN', 'ANNUAL_AMOUNT', 'ACTUAL_AREA',
  'PROP_TYPE_EN', 'PROP_SUB_TYPE_EN', 'USAGE_EN', 'TOTAL_PROPERTIES', 'PROJECT_EN',
]);
const LAND_HEADERS = Object.freeze(['AREA_EN', 'PROJECT_EN']);

function fail(message) {
  throw new Error(`Dubai area evidence build failed: ${message}`);
}

export function decodeDubaiCsvBytes(source) {
  if (!(source instanceof Uint8Array)) fail('provider source must be bytes');
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(source);
  } catch {
    return fail('invalid UTF-8 provider CSV');
  }
}

function normalized(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[‘’]/gu, "'")
    .replace(/[‐‑‒–—−]/gu, '-')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('en');
}

function displayLabel(value) {
  const compact = String(value ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (compact === '') return '';
  if (compact !== compact.toLocaleUpperCase('en')) return compact;
  return compact.toLocaleLowerCase('en').replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('en'));
}

function slugBase(value) {
  const slug = String(value)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return slug || `area-${createHash('sha1').update(String(value)).digest('hex').slice(0, 10)}`;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(value[key])}`
  )).join(',')}}`;
}

function normalizeUnitVerification(value) {
  const candidate = value ?? {
    state: 'pending',
    currency: 'AED',
    currencyFields: ['TRANS_VALUE', 'ANNUAL_AMOUNT'],
    area: 'sqm',
    areaField: 'ACTUAL_AREA',
    evidenceUrl: null,
    checkedAt: null,
    reviewedBy: null,
  };
  if ((candidate.state !== 'pending' && candidate.state !== 'verified')
    || candidate.currency !== 'AED' || candidate.area !== 'sqm'
    || candidate.areaField !== 'ACTUAL_AREA'
    || !Array.isArray(candidate.currencyFields)
    || candidate.currencyFields.length !== 2
    || candidate.currencyFields[0] !== 'TRANS_VALUE'
    || candidate.currencyFields[1] !== 'ANNUAL_AMOUNT') fail('invalid unit verification record');
  if (candidate.state === 'pending') {
    if (candidate.evidenceUrl !== null || candidate.checkedAt !== null
      || candidate.reviewedBy !== null) fail('pending unit verification must not claim review evidence');
  } else if (typeof candidate.evidenceUrl !== 'string' || !candidate.evidenceUrl.startsWith('https://')
    || typeof candidate.checkedAt !== 'string'
    || new Date(candidate.checkedAt).toISOString() !== candidate.checkedAt
    || typeof candidate.reviewedBy !== 'string' || candidate.reviewedBy.trim() === '') {
    fail('verified unit record requires evidence, time, and reviewer');
  }
  return {
    state: candidate.state,
    currency: 'AED',
    currencyFields: ['TRANS_VALUE', 'ANNUAL_AMOUNT'],
    area: 'sqm',
    areaField: 'ACTUAL_AREA',
    evidenceUrl: candidate.evidenceUrl,
    checkedAt: candidate.checkedAt,
    reviewedBy: candidate.reviewedBy,
  };
}

function httpsUrl(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be an HTTPS URL`);
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
      fail(`${label} must be an HTTPS URL`);
    }
  } catch {
    fail(`${label} must be an HTTPS URL`);
  }
  return value;
}

function normalizeRights(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail('invalid rights record');
  if (value.state !== 'pending' && value.state !== 'approved') fail('invalid rights state');
  const intendedUse = value.intendedUse === undefined ? 'commercial' : value.intendedUse;
  if (intendedUse !== 'commercial' && intendedUse !== 'noncommercial') fail('invalid intended use');
  if (value.canUseNonCommercially !== undefined
    && typeof value.canUseNonCommercially !== 'boolean') fail('invalid noncommercial permission');
  const canUseNonCommercially = value.canUseNonCommercially === true;
  const permissions = [
    'canStore', 'canCreateDerived', 'canUseCommercially', 'canDisplay', 'canIndex',
  ];
  if (!permissions.every((permission) => typeof value[permission] === 'boolean')) {
    fail('rights permissions must be explicit booleans');
  }
  const checked = new Date(value.checkedAt);
  if (!Number.isFinite(checked.getTime()) || checked.toISOString() !== value.checkedAt) {
    fail('rights checked-at must be a canonical instant');
  }
  const reviewedBy = value.reviewedBy === null ? null
    : typeof value.reviewedBy === 'string' && value.reviewedBy.trim() !== ''
      ? value.reviewedBy
      : fail('rights reviewer must be named');
  const licenseUrl = value.licenseUrl === null ? null : httpsUrl(value.licenseUrl, 'rights licence');
  if (value.state === 'pending') {
    if (reviewedBy !== null || licenseUrl !== null || canUseNonCommercially
      || permissions.some((permission) => value[permission] !== false)) {
      fail('pending rights must not claim approval or permissions');
    }
  } else if (reviewedBy === null || licenseUrl === null) {
    fail('approved rights require a licence and named reviewer');
  }
  if (typeof value.policyId !== 'string' || value.policyId.trim() === ''
    || typeof value.attribution !== 'string' || value.attribution.trim() === '') {
    fail('rights policy and attribution are required');
  }
  return {
    state: value.state,
    canStore: value.canStore,
    canCreateDerived: value.canCreateDerived,
    canUseCommercially: value.canUseCommercially,
    intendedUse,
    canUseNonCommercially,
    canDisplay: value.canDisplay,
    canIndex: value.canIndex,
    policyId: value.policyId,
    sourceUrl: httpsUrl(value.sourceUrl, 'rights source'),
    licenseUrl,
    attribution: value.attribution,
    checkedAt: value.checkedAt,
    reviewedBy,
  };
}

function normalizeSlugRegistry(value) {
  const candidate = value ?? { version: SLUG_REGISTRY_VERSION, entries: {} };
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)
    || candidate.version !== SLUG_REGISTRY_VERSION
    || typeof candidate.entries !== 'object' || candidate.entries === null
    || Array.isArray(candidate.entries)) fail('invalid Dubai area slug registry');
  const entries = new Map();
  const used = new Set();
  for (const [key, slug] of Object.entries(candidate.entries)) {
    if (key === '' || normalized(key) !== key
      || typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)
      || used.has(slug)) fail('invalid or duplicate Dubai area slug registry entry');
    entries.set(key, slug);
    used.add(slug);
  }
  return { entries, used };
}

function numeric(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function dateOnly(value) {
  if (typeof value !== 'string') return null;
  const candidate = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(candidate)) return null;
  const instant = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isFinite(instant.getTime()) && instant.toISOString().slice(0, 10) === candidate
    ? candidate
    : null;
}

function addDays(value, days) {
  return new Date(Date.parse(`${value}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function period(rows, field) {
  const dates = rows.map((row) => dateOnly(row[field])).filter(Boolean).sort();
  if (dates.length === 0) fail(`no dates in ${field}`);
  return { from: dates[0], to: dates.at(-1) };
}

export function parseCsv(source, requiredHeaders = [], label = 'CSV') {
  if (typeof source !== 'string' || source.length === 0) fail('empty CSV');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = source.charCodeAt(0) === 0xFEFF ? 1 : 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field === '') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      row.push(field);
      field = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      if (character === '\r' && source[index + 1] === '\n') index += 1;
    } else {
      field += character;
    }
  }
  if (quoted) fail('unterminated quoted CSV field');
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((value) => value !== '')) rows.push(row);
  }
  const headers = rows.shift();
  if (headers === undefined || headers.length === 0 || new Set(headers).size !== headers.length) fail('invalid CSV header');
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) fail(`${label} missing required header ${required}`);
  }
  return rows.map((values, rowIndex) => {
    if (values.length !== headers.length) fail(`row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function mostCommon(counter) {
  return [...counter.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'en'))[0]?.[0] ?? '';
}

function quantile(values, probability) {
  if (values.length === 0) fail('empty distribution');
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const lowerValue = sorted[lower];
  const upperValue = sorted[upper];
  if (lowerValue === undefined || upperValue === undefined) fail('invalid distribution');
  return lowerValue + (upperValue - lowerValue) * (position - lower);
}

function rounded(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function saleDistribution(rows) {
  const prices = rows.map(({ price }) => price);
  const perSqm = rows.map(({ perSqm: value }) => value);
  return {
    n: rows.length,
    medianPriceAed: rounded(quantile(prices, 0.5)),
    priceP25Aed: rounded(quantile(prices, 0.25)),
    priceP75Aed: rounded(quantile(prices, 0.75)),
    medianPricePerSqmAed: rounded(quantile(perSqm, 0.5)),
    pricePerSqmP25Aed: rounded(quantile(perSqm, 0.25)),
    pricePerSqmP75Aed: rounded(quantile(perSqm, 0.75)),
  };
}

function rentDistribution(group) {
  const totalN = group.newAmounts.length + group.renewedN;
  return {
    newN: group.newAmounts.length,
    renewedN: group.renewedN,
    totalN,
    medianAnnualRentAed: rounded(quantile(group.newAmounts, 0.5)),
    medianAnnualRentPerSqmAed: rounded(quantile(group.newPerSqm, 0.5)),
    newShare: rounded(group.newAmounts.length / totalN, 6),
    renewedShare: rounded(group.renewedN / totalN, 6),
  };
}

function mapPush(map, key, value) {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function mapCount(map, key, increment = 1) {
  map.set(key, (map.get(key) ?? 0) + increment);
}

function buildAreaIdentity(landRows, transactionRows) {
  const landSpellings = new Map();
  const canonicalByNormalized = new Map();
  const projectAreaSets = new Map();
  for (const row of landRows) {
    const areaKey = normalized(row.AREA_EN);
    if (areaKey === '') continue;
    const spellings = landSpellings.get(areaKey) ?? new Map();
    const spelling = displayLabel(row.AREA_EN);
    if (spelling !== '') mapCount(spellings, spelling);
    landSpellings.set(areaKey, spellings);
    const project = normalized(row.PROJECT_EN);
    if (project !== '') {
      const areaKeys = projectAreaSets.get(project) ?? new Set();
      areaKeys.add(areaKey);
      projectAreaSets.set(project, areaKeys);
    }
  }
  for (const [areaKey, spellings] of landSpellings) canonicalByNormalized.set(areaKey, {
    key: areaKey,
    name: mostCommon(spellings),
  });

  const projectCanonicalArea = new Map();
  for (const [project, areaKeys] of projectAreaSets) {
    if (areaKeys.size === 1) projectCanonicalArea.set(project, [...areaKeys][0]);
  }

  const aliasEvidence = new Map();
  const sourceSpellings = new Map();
  for (const row of transactionRows) {
    const sourceArea = normalized(row.AREA_EN);
    const project = normalized(row.PROJECT_EN);
    if (sourceArea === '' || project === '') continue;
    const targetArea = projectCanonicalArea.get(project);
    if (targetArea === undefined) continue;
    const evidence = aliasEvidence.get(sourceArea) ?? {
      targets: new Map(),
      projects: new Set(),
      rows: 0,
    };
    mapCount(evidence.targets, targetArea);
    evidence.projects.add(project);
    evidence.rows += 1;
    aliasEvidence.set(sourceArea, evidence);
    const spellings = sourceSpellings.get(sourceArea) ?? new Map();
    mapCount(spellings, displayLabel(row.AREA_EN));
    sourceSpellings.set(sourceArea, spellings);
  }

  const aliases = new Map();
  for (const [sourceArea, evidence] of aliasEvidence) {
    if (canonicalByNormalized.has(sourceArea)) continue;
    if (evidence.rows < 20 || evidence.projects.size < 3 || evidence.targets.size !== 1) continue;
    const [targetArea, targetRows] = [...evidence.targets.entries()][0] ?? [];
    if (targetArea === undefined || targetRows !== evidence.rows) continue;
    aliases.set(sourceArea, targetArea);
  }

  const rawAliasesByCanonical = new Map();
  for (const [sourceArea, targetArea] of aliases) {
    const values = rawAliasesByCanonical.get(targetArea) ?? new Set();
    const spelling = mostCommon(sourceSpellings.get(sourceArea) ?? new Map());
    if (spelling !== '') values.add(spelling);
    rawAliasesByCanonical.set(targetArea, values);
  }
  const aliasMappings = [...aliases.entries()].map(([sourceArea, targetArea]) => ({
    sourceArea: mostCommon(sourceSpellings.get(sourceArea) ?? new Map()),
    canonicalArea: canonicalByNormalized.get(targetArea)?.name ?? targetArea,
    method: ALIAS_MAPPING_METHOD,
    version: ALIAS_MAPPING_VERSION,
  })).sort((left, right) => compareName(left.sourceArea, right.sourceArea));
  return { canonicalByNormalized, aliases, rawAliasesByCanonical, aliasMappings };
}

function housingFromSale(row) {
  if (row.PROP_TYPE_EN === 'Unit' && row.PROP_SB_TYPE_EN === 'Flat') return 'apartment';
  if (row.PROP_TYPE_EN === 'Building' && row.PROP_SB_TYPE_EN === 'Villa') return 'villa';
  return null;
}

function housingFromRent(row) {
  if (row.PROP_TYPE_EN === 'Unit' && row.PROP_SUB_TYPE_EN === 'Flat') return 'apartment';
  if (row.PROP_TYPE_EN === 'Villa' && row.PROP_SUB_TYPE_EN === 'Villa') return 'villa';
  return null;
}

function canonicalAreaKey(value, identity) {
  const key = normalized(value);
  if (identity.canonicalByNormalized.has(key)) return key;
  return identity.aliases.get(key) ?? null;
}

function uniqueSlugs(areaKeys, identity, registryInput) {
  const { entries, used } = normalizeSlugRegistry(registryInput);
  const slugs = new Map();
  for (const key of [...areaKeys].sort(compareExact)) {
    const existing = entries.get(key);
    if (existing !== undefined) {
      slugs.set(key, existing);
      continue;
    }
    const base = slugBase(identity.canonicalByNormalized.get(key)?.name ?? key);
    let slug = base;
    if (used.has(slug)) {
      const digest = createHash('sha1').update(key).digest('hex');
      for (let length = 8; length <= digest.length; length += 2) {
        const candidate = `${base}-${digest.slice(0, length)}`;
        if (!used.has(candidate)) {
          slug = candidate;
          break;
        }
      }
      if (used.has(slug)) fail(`unable to allocate stable slug for ${key}`);
    }
    entries.set(key, slug);
    used.add(slug);
    slugs.set(key, slug);
  }
  return {
    slugs,
    registry: {
      version: SLUG_REGISTRY_VERSION,
      entries: Object.fromEntries([...entries.entries()].sort(([left], [right]) => compareExact(left, right))),
    },
  };
}

function compareName(left, right) {
  return left.localeCompare(right, 'en', { sensitivity: 'base' });
}

function compareExact(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function buildDubaiAreaEvidenceBundle({
  transactionsCsv,
  rentsCsv,
  landsCsv,
  generatedAt,
  rights: rightsInput,
  unitVerification: unitVerificationInput,
  slugRegistry: slugRegistryInput,
}) {
  const rights = normalizeRights(rightsInput);
  const unitVerification = normalizeUnitVerification(unitVerificationInput);
  const generated = new Date(generatedAt);
  if (!Number.isFinite(generated.getTime()) || generated.toISOString() !== generatedAt) fail('invalid generated-at');
  const transactionRows = parseCsv(transactionsCsv, TRANSACTION_HEADERS, 'transaction CSV');
  const rentRows = parseCsv(rentsCsv, RENT_HEADERS, 'rent CSV');
  const landRows = parseCsv(landsCsv, LAND_HEADERS, 'land CSV');
  const transactionPeriod = period(transactionRows, 'INSTANCE_DATE');
  const rentPeriod = period(rentRows, 'REGISTRATION_DATE');
  const asOfDate = transactionPeriod.to < rentPeriod.to ? transactionPeriod.to : rentPeriod.to;
  const comparisonPeriod = { from: addDays(asOfDate, -89), to: asOfDate };
  const identity = buildAreaIdentity(landRows, transactionRows);

  const saleGroups = new Map();
  let qualifyingSaleRows = 0;
  let mappedSaleRows = 0;
  for (const row of transactionRows) {
    const rowDate = dateOnly(row.INSTANCE_DATE);
    const housing = housingFromSale(row);
    const price = numeric(row.TRANS_VALUE);
    const areaSqm = numeric(row.ACTUAL_AREA);
    if (row.GROUP_EN !== 'Sales' || !SALE_PROCEDURES.has(row.PROCEDURE_EN)
      || row.USAGE_EN !== 'Residential' || housing === null
      || (row.IS_OFFPLAN_EN !== 'Ready' && row.IS_OFFPLAN_EN !== 'Off-Plan')
      || rowDate === null || rowDate < comparisonPeriod.from || rowDate > comparisonPeriod.to
      || price === null || price < 100_000 || price > 500_000_000
      || areaSqm === null || areaSqm < 10 || areaSqm > 1_000) continue;
    qualifyingSaleRows += 1;
    const areaKey = canonicalAreaKey(row.AREA_EN, identity);
    if (areaKey === null) continue;
    mappedSaleRows += 1;
    const stage = row.IS_OFFPLAN_EN === 'Ready' ? 'ready' : 'off-plan';
    mapPush(saleGroups, `${areaKey}\u0000${housing}\u0000${stage}`, {
      price,
      perSqm: price / areaSqm,
    });
  }

  const rentGroups = new Map();
  let qualifyingRentRows = 0;
  let mappedRentRows = 0;
  for (const row of rentRows) {
    const rowDate = dateOnly(row.REGISTRATION_DATE);
    const housing = housingFromRent(row);
    const annual = numeric(row.ANNUAL_AMOUNT);
    const areaSqm = numeric(row.ACTUAL_AREA);
    if (row.USAGE_EN !== 'Residential' || housing === null
      || (row.VERSION_EN !== 'New' && row.VERSION_EN !== 'Renewed')
      || row.TOTAL_PROPERTIES !== '1'
      || rowDate === null || rowDate < comparisonPeriod.from || rowDate > comparisonPeriod.to
      || annual === null || annual < 5_000 || annual > 20_000_000
      || areaSqm === null || areaSqm < 10 || areaSqm > 1_000) continue;
    qualifyingRentRows += 1;
    const areaKey = canonicalAreaKey(row.AREA_EN, identity);
    if (areaKey === null) continue;
    mappedRentRows += 1;
    const key = `${areaKey}\u0000${housing}`;
    const group = rentGroups.get(key) ?? { newAmounts: [], newPerSqm: [], renewedN: 0 };
    if (row.VERSION_EN === 'New') {
      group.newAmounts.push(annual);
      group.newPerSqm.push(annual / areaSqm);
    } else {
      group.renewedN += 1;
    }
    rentGroups.set(key, group);
  }

  const published = new Map();
  for (const [key, rentGroup] of rentGroups) {
    if (rentGroup.newAmounts.length < PUBLICATION_MINIMUM) continue;
    const [areaKey, housing] = key.split('\u0000');
    const readyRows = saleGroups.get(`${areaKey}\u0000${housing}\u0000ready`) ?? [];
    const offPlanRows = saleGroups.get(`${areaKey}\u0000${housing}\u0000off-plan`) ?? [];
    const ready = readyRows.length >= PUBLICATION_MINIMUM ? saleDistribution(readyRows) : null;
    const offPlan = offPlanRows.length >= PUBLICATION_MINIMUM ? saleDistribution(offPlanRows) : null;
    if (ready === null && offPlan === null) continue;
    const rent = rentDistribution(rentGroup);
    const segments = published.get(areaKey) ?? [];
    segments.push({
      housing,
      sales: { ready, offPlan },
      rent,
      readyGrossYieldPct: ready === null ? null : rounded(rent.medianAnnualRentAed / ready.medianPriceAed * 100),
      comparableAreaIds: { ready: [], offPlan: [] },
    });
    published.set(areaKey, segments);
  }

  const { slugs, registry: slugRegistry } = uniqueSlugs(
    [...published.keys()], identity, slugRegistryInput,
  );
  const registryChanged = canonicalJson(normalizeRegistryForComparison(slugRegistryInput))
    !== canonicalJson(slugRegistry);
  const areas = [...published.entries()].map(([areaKey, segments]) => {
    const slug = slugs.get(areaKey);
    const canonical = identity.canonicalByNormalized.get(areaKey);
    if (slug === undefined || canonical === undefined) fail('published area identity missing');
    const aliases = new Set(identity.rawAliasesByCanonical.get(areaKey) ?? []);
    aliases.add(canonical.name);
    return {
      id: `ae-dubai:area:${slug}`,
      slug,
      name: canonical.name,
      searchAliases: [...aliases].sort(compareName),
      segments: segments.sort((left, right) => compareName(left.housing, right.housing)),
    };
  }).sort((left, right) => compareName(left.name, right.name));

  for (const area of areas) {
    for (const segment of area.segments) {
      for (const stage of ['ready', 'offPlan']) {
        const ownMetric = segment.sales[stage]?.medianPricePerSqmAed;
        segment.comparableAreaIds[stage] = ownMetric === undefined ? [] : areas
          .filter((candidate) => candidate.id !== area.id)
          .flatMap((candidate) => {
            const candidateSegment = candidate.segments.find(({ housing }) => housing === segment.housing);
            const metric = candidateSegment?.sales[stage]?.medianPricePerSqmAed;
            return metric === undefined ? [] : [{ id: candidate.id, difference: Math.abs(metric - ownMetric) }];
          })
          .sort((left, right) => left.difference - right.difference || left.id.localeCompare(right.id))
          .slice(0, 3)
          .map(({ id }) => id);
      }
    }
  }

  const sourcePeriods = { transactions: transactionPeriod, rents: rentPeriod };
  const sources = {
    transactions: { sha256: sha256(transactionsCsv), rows: transactionRows.length },
    rents: { sha256: sha256(rentsCsv), rows: rentRows.length },
    lands: { sha256: sha256(landsCsv), rows: landRows.length },
  };
  const totals = {
    qualifyingSaleRows,
    mappedSaleRows,
    excludedSaleRows: transactionRows.length - qualifyingSaleRows,
    unmappedSaleRows: qualifyingSaleRows - mappedSaleRows,
    qualifyingRentRows,
    excludedRentRows: rentRows.length - qualifyingRentRows,
    unmappedRentRows: qualifyingRentRows - mappedRentRows,
    verifiedAliases: identity.aliases.size,
    publishedAreas: areas.length,
    publishedSegments: areas.reduce((sum, area) => sum + area.segments.length, 0),
  };
  const digestInput = canonicalJson({
    slugRegistryVersion: SLUG_REGISTRY_VERSION,
    asOfDate,
    comparisonPeriod,
    sourcePeriods,
    sources,
    totals,
    areas,
  });
  const snapshot = {
    version: VERSION,
    slugRegistryVersion: SLUG_REGISTRY_VERSION,
    marketId: 'ae-dubai',
    generatedAt,
    asOfDate,
    comparisonPeriod,
    sourcePeriods,
    units: {
      currency: 'AED',
      currencyBasis: unitVerification.state === 'verified'
        ? 'verified-source-schema'
        : 'inferred-dld-reporting',
      area: 'sqm',
      rentPeriod: 'year',
    },
    unitVerification,
    rights,
    publication: !registryChanged && rights.state === 'approved'
      && rights.canStore === true
      && rights.canCreateDerived === true
      && (rights.intendedUse === 'noncommercial'
        ? rights.canUseNonCommercially === true : rights.canUseCommercially === true)
      && rights.canDisplay === true
      && unitVerification.state === 'verified'
      ? {
          displayState: 'published',
          indexState: rights.canIndex === true ? 'index' : 'noindex',
        }
      : { displayState: 'draft', indexState: 'noindex' },
    publicationMinimum: PUBLICATION_MINIMUM,
    sources,
    totals,
    areas,
    dataDigest: sha256(digestInput),
  };
  return {
    snapshot,
    slugRegistry,
    registryChanged,
    audit: {
      exclusions: {
        saleFilter: totals.excludedSaleRows,
        saleUnmapped: totals.unmappedSaleRows,
        rentFilter: totals.excludedRentRows,
        rentUnmapped: totals.unmappedRentRows,
      },
      aliasMapping: {
        method: ALIAS_MAPPING_METHOD,
        version: ALIAS_MAPPING_VERSION,
        mappings: identity.aliasMappings,
      },
    },
  };
}

function normalizeRegistryForComparison(value) {
  const { entries } = normalizeSlugRegistry(value);
  return {
    version: SLUG_REGISTRY_VERSION,
    entries: Object.fromEntries([...entries.entries()].sort(([left], [right]) => compareExact(left, right))),
  };
}

export function buildDubaiAreaEvidence(input) {
  const bundle = buildDubaiAreaEvidenceBundle(input);
  if (bundle.registryChanged) fail('slug registry update must be reviewed and persisted first');
  return bundle.snapshot;
}

function cliArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith('--') || value === undefined) fail('CLI arguments must be --name value pairs');
    result[name.slice(2)] = value;
  }
  for (const required of [
    'transactions', 'rents', 'lands', 'generated-at', 'rights-record', 'slug-registry',
  ]) {
    if (!result[required]) fail(`missing --${required}`);
  }
  if (Boolean(result.output) === Boolean(result['slug-registry-output'])) {
    fail('choose exactly one of --output or --slug-registry-output');
  }
  return result;
}

function main() {
  const args = cliArguments(process.argv.slice(2));
  const releaseRecord = JSON.parse(readFileSync(resolve(args['rights-record']), 'utf8'));
  const slugRegistryInputPath = resolve(args['slug-registry']);
  const slugRegistryInput = JSON.parse(readFileSync(slugRegistryInputPath, 'utf8'));
  const bundle = buildDubaiAreaEvidenceBundle({
    transactionsCsv: decodeDubaiCsvBytes(readFileSync(resolve(args.transactions))),
    rentsCsv: decodeDubaiCsvBytes(readFileSync(resolve(args.rents))),
    landsCsv: decodeDubaiCsvBytes(readFileSync(resolve(args.lands))),
    generatedAt: args['generated-at'],
    rights: releaseRecord.rights ?? releaseRecord,
    unitVerification: releaseRecord.unitVerification,
    slugRegistry: slugRegistryInput,
  });
  if (args['slug-registry-output']) {
    const slugRegistryOutput = resolve(args['slug-registry-output']);
    if (dirname(slugRegistryOutput) === slugRegistryOutput || slugRegistryOutput === slugRegistryInputPath) {
      fail('slug registry proposal must be a different file');
    }
    writeFileSync(slugRegistryOutput, `${JSON.stringify(bundle.slugRegistry, null, 2)}\n`);
    const previousEntries = normalizeRegistryForComparison(slugRegistryInput).entries;
    const additions = Object.entries(bundle.slugRegistry.entries)
      .filter(([key, slug]) => previousEntries[key] !== slug)
      .map(([key, slug]) => ({ key, slug }));
    process.stdout.write(`${JSON.stringify({
      artifactWritten: false,
      slugRegistry: {
        version: bundle.slugRegistry.version,
        inputSha256: sha256(canonicalJson(normalizeRegistryForComparison(slugRegistryInput))),
        outputSha256: sha256(canonicalJson(bundle.slugRegistry)),
        output: slugRegistryOutput,
        additions,
      },
      exclusions: bundle.audit.exclusions,
      aliasMapping: bundle.audit.aliasMapping,
    }, null, 2)}\n`);
    return;
  }
  if (bundle.registryChanged) fail('slug registry update required; run proposal mode and review it before building the artifact');
  const built = bundle.snapshot;
  const serialized = JSON.stringify(built);
  const output = resolve(args.output);
  if (dirname(output) === output) fail('output must be a file');
  writeFileSync(output, gzipSync(serialized, { level: 9 }));
  process.stdout.write(`${JSON.stringify({
    output,
    objectSha256: sha256(serialized),
    dataDigest: built.dataDigest,
    asOfDate: built.asOfDate,
    comparisonPeriod: built.comparisonPeriod,
    totals: built.totals,
    exclusions: bundle.audit.exclusions,
    aliasMapping: bundle.audit.aliasMapping,
    slugRegistry: {
      version: bundle.slugRegistry.version,
      entries: Object.keys(bundle.slugRegistry.entries).length,
      input: slugRegistryInputPath,
    },
    artifactWritten: true,
  }, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
