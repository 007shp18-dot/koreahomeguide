import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { decodeDubaiCsvBytes, parseCsv } from './build-dubai-area-evidence.mjs';

const normalize = value => String(value ?? '').normalize('NFKC')
  .replace(/[‘’]/gu, "'").replace(/[‐‑‒–—−]/gu, '-')
  .trim().replace(/\s+/gu, ' ').toLowerCase();
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Conservative, exact area/name join. No inferred coordinates or individual listings. */
export function aggregateDubaiProjects(sales, lands, areas, period, minimum = 30) {
  const byName = new Map();
  const byNumber = new Map();
  for (const row of lands) {
    const area = normalize(row.AREA_EN), name = normalize(row.PROJECT_EN);
    const id = row.PROJECT_NUMBER?.trim();
    if (!area || !name || !id) continue;
    const key = `${area}\0${name}`;
    const ids = byName.get(key) ?? new Set(); ids.add(id); byName.set(key, ids);
    const names = byNumber.get(id) ?? new Set(); names.add(key); byNumber.set(id, names);
  }
  const areaSlugs = new Map(areas.map(area => [normalize(area.name), area.slug]));
  const groups = new Map(), seen = new Map(), conflicts = new Set();
  for (const row of sales) {
    const id = row.TRANSACTION_NUMBER?.trim();
    if (!id) throw new Error('Transaction identity missing');
    const encoded = JSON.stringify(row);
    if (seen.has(id) && seen.get(id) !== encoded) conflicts.add(id);
    seen.set(id, encoded);
  }
  seen.clear();
  for (const row of sales) {
    const housing = row.PROP_TYPE_EN === 'Unit' && row.PROP_SB_TYPE_EN === 'Flat' ? 'apartment'
      : row.PROP_TYPE_EN === 'Building' && row.PROP_SB_TYPE_EN === 'Villa' ? 'villa' : null;
    const stage = row.IS_OFFPLAN_EN === 'Ready' ? 'ready' : row.IS_OFFPLAN_EN === 'Off-Plan' ? 'off-plan' : null;
    const date = row.INSTANCE_DATE?.slice(0, 10);
    const price = Number(row.TRANS_VALUE), size = Number(row.ACTUAL_AREA);
    if (row.GROUP_EN !== 'Sales' || row.USAGE_EN !== 'Residential' || !housing || !stage
      || !['Sale', 'Sell - Pre registration', 'Delayed Sell', 'Sale On Payment Plan'].includes(row.PROCEDURE_EN)
      || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || date < period.from || date > period.to
      || !Number.isFinite(price) || price < 100_000 || price > 500_000_000
      || !Number.isFinite(size) || size < 10 || size > 1000) continue;
    const transaction = row.TRANSACTION_NUMBER?.trim();
    if (!transaction) throw new Error('Transaction identity missing');
    // Multi-property registrations have no unit identity in this export.
    // Exclude them from project price comparisons rather than count one price repeatedly.
    if (conflicts.has(transaction) || seen.has(transaction)) continue;
    seen.set(transaction, true);
    const areaKey = normalize(row.AREA_EN), nameKey = normalize(row.PROJECT_EN);
    const ids = byName.get(`${areaKey}\0${nameKey}`);
    if (ids?.size !== 1) continue;
    const projectNumber = [...ids][0], areaSlug = areaSlugs.get(areaKey);
    if (byNumber.get(projectNumber)?.size !== 1 || !areaSlug) continue;
    const id = `${projectNumber}-${housing}-${stage}`;
    const group = groups.get(id) ?? { id, projectNumber, areaSlug,
      name: row.PROJECT_EN.trim().replace(/\s+/gu, ' '), housing, stage, prices: [], unitPrices: [] };
    group.prices.push(price); group.unitPrices.push(price / size); groups.set(id, group);
  }
  return [...groups.values()].filter(group => group.prices.length >= minimum).map(group => ({
    id: group.id, projectNumber: group.projectNumber, areaSlug: group.areaSlug,
    name: group.name, housing: group.housing, stage: group.stage,
    n: group.prices.length, medianPriceAed: Math.round(median(group.prices)),
    medianPricePerSqmAed: Math.round(median(group.unitPrices)),
  })).sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));
}

export function buildDubaiProjectEvidence({ transactionsCsv, landsCsv, parent }) {
  for (const [key, source] of [['transactions', transactionsCsv], ['lands', landsCsv]]) {
    if (createHash('sha256').update(source).digest('hex') !== parent.sources[key].sha256) {
      throw new Error(`${key} differs from released area evidence`);
    }
  }
  if (parent.publication.displayState !== 'published') throw new Error('Area evidence is not published');
  return {
    parentDataDigest: parent.dataDigest,
    comparisonPeriod: parent.comparisonPeriod,
    publicationMinimum: parent.publicationMinimum,
    projects: aggregateDubaiProjects(
      parseCsv(transactionsCsv, ['TRANSACTION_NUMBER', 'PROJECT_EN', 'AREA_EN', 'TRANS_VALUE', 'ACTUAL_AREA']),
      parseCsv(landsCsv, ['PROJECT_NUMBER', 'PROJECT_EN', 'AREA_EN']),
      parent.areas, parent.comparisonPeriod, parent.publicationMinimum,
    ),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [transactions, lands, parentPath, output] = process.argv.slice(2);
  if (!output) throw new Error('Usage: builder transactions.csv lands.csv area-evidence.json.gz output.json');
  const result = buildDubaiProjectEvidence({
    transactionsCsv: decodeDubaiCsvBytes(readFileSync(transactions)),
    landsCsv: decodeDubaiCsvBytes(readFileSync(lands)),
    parent: JSON.parse(gunzipSync(readFileSync(parentPath))),
  });
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ projects: result.projects.length, bytes: JSON.stringify(result).length }));
}
