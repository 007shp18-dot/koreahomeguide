import { loadPropertySeedRows } from './property-seed-source.mjs';

const DATA_API = 'https://ep-rapid-grass-b34p9oiz.apirest.c-4.ap-southeast-1.aws.neon.tech/neondb/rest/v1';
const EXPECTED_BRANCH = 'codex/signedprice-db-seed-export';
const CHUNK_SIZE = 1000;

if (process.env.VERCEL !== '1' || process.env.VERCEL_ENV !== 'preview' || process.env.VERCEL_GIT_COMMIT_REF !== EXPECTED_BRANCH) {
  process.stdout.write('SignedPrice test-branch Data API seed skipped outside the isolated preview branch.\n');
  process.exit(0);
}

function chunks(values, size = CHUNK_SIZE) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function compactRow(row) {
  const housingSector = row.localAttributes.housingSector === 'hdb'
    ? 'hdb'
    : row.localAttributes.housingSector === 'private_residential'
      ? 'private_residential'
      : null;
  return {
    lk: row.legacyKey,
    lm: row.legacyMarketKey,
    i: row.externalId,
    n: row.name,
    nn: row.normalizedName,
    a: row.address,
    x: row.latitude,
    y: row.longitude,
    e: row.globalEntityId,
    gm: row.globalMarketId,
    ek: row.globalKind,
    g: row.geographyId,
    gk: row.geographyKind,
    gn: row.geographyName,
    gp: row.geographyProviderCode,
    hs: housingSector,
    ls: row.localSchemaVersion,
    la: row.localAttributes,
    es: row.externalSourceId,
    et: row.externalType,
  };
}

async function seedBatch(batch, attempt = 1) {
  const response = await fetch(`${DATA_API}/rpc/signedprice_seed_json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payload: batch.map(compactRow) }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      return seedBatch(batch, attempt + 1);
    }
    throw new Error(`Data API seed failed (${response.status}): ${detail}`);
  }
  const value = await response.json();
  if (!Number.isSafeInteger(value) || value < 0 || value > batch.length) {
    throw new Error(`Data API seed returned invalid change count: ${JSON.stringify(value)}`);
  }
  return value;
}

async function runPass(label, batches) {
  let changed = 0;
  for (let index = 0; index < batches.length; index += 1) {
    changed += await seedBatch(batches[index]);
    if ((index + 1) % 10 === 0 || index + 1 === batches.length) {
      process.stdout.write(`SignedPrice ${label}: ${index + 1}/${batches.length} batches complete; changed=${changed}.\n`);
    }
  }
  return changed;
}

const seed = loadPropertySeedRows();
if (seed.summary.seoul !== 48_999 || seed.summary.singaporePrivate !== 3_862
  || seed.summary.singaporeHdb !== 10_011 || seed.summary.total !== 62_872) {
  throw new Error(`Unexpected SignedPrice seed summary: ${JSON.stringify(seed.summary)}`);
}
const batches = chunks(seed.all);
process.stdout.write(`SignedPrice isolated test seed: ${seed.summary.total} rows in ${batches.length} batches.\n`);
const firstChanged = await runPass('seed pass 1', batches);
const secondChanged = await runPass('seed pass 2', batches);
if (secondChanged !== 0) {
  throw new Error(`SignedPrice seed is not idempotent: second pass changed ${secondChanged} identifiers.`);
}
process.stdout.write(`SignedPrice isolated test seed verified: firstChanged=${firstChanged}, secondChanged=0.\n`);
