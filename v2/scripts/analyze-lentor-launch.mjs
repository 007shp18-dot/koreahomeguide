// Reproduce the descriptive figures in the Lentor launch article.
// Run from v2: node scripts/analyze-lentor-launch.mjs
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const snapshot = JSON.parse(gunzipSync(readFileSync(new URL('../apps/web/data/singapore-private-sale.json.gz', import.meta.url))));
const expectedDigest = 'e2bc92b0e75ffb7eaf17544e883a96e2986995f7db208f14b711cab8714a1e3c';
if (snapshot.digest !== expectedDigest) throw new Error('Snapshot changed; review article figures before republishing.');
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) throw new Error('Empty sample');
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2;
};
const located = (r) => Number.isFinite(r.x) && r.x > 0 && Number.isFinite(r.y) && r.y > 0;
const anchor = snapshot.records.find((r) => r.project === 'LENTOR MODERN' && located(r));
if (!anchor) throw new Error('Missing anchor coordinates');
const groups = new Map();
for (const r of snapshot.records) {
  if (r.saleType !== 'resale' || r.units !== 1 || !['apartment', 'condominium'].includes(r.propertyType)
    || r.areaSqm < 80 || r.areaSqm > 120 || !r.tenure.startsWith('99 yrs') || !located(r)
    || !Number.isFinite(r.psf) || r.psf <= 0) continue;
  const window = r.contractMonth >= '2021-09-01' && r.contractMonth < '2022-09-01' ? 'before'
    : r.contractMonth >= '2022-10-01' && r.contractMonth < '2023-10-01' ? 'after' : null;
  if (!window) continue;
  if (!groups.has(r.project)) groups.set(r.project, { project: r.project, distanceM: Math.hypot(r.x - anchor.x, r.y - anchor.y), before: [], after: [] });
  groups.get(r.project)[window].push(r.psf);
}
const eligible = [...groups.values()].filter((g) => g.before.length >= 5 && g.after.length >= 5).map((g) => ({
  project: g.project, distanceM: Math.round(g.distanceM), beforeN: g.before.length, afterN: g.after.length,
  beforeMedianPsf: median(g.before), afterMedianPsf: median(g.after),
  changePct: (median(g.after) / median(g.before) - 1) * 100,
}));
const near = eligible.filter((g) => g.distanceM <= 1000);
const comparison = eligible.filter((g) => g.distanceM >= 2000 && g.distanceM <= 4000);
const summarize = (rows) => ({ projects: rows.length, beforeN: rows.reduce((n, r) => n + r.beforeN, 0), afterN: rows.reduce((n, r) => n + r.afterN, 0), medianProjectChangePct: median(rows.map((r) => r.changePct)) });
console.log(JSON.stringify({ digest: snapshot.digest, generatedAt: snapshot.generatedAt, method: 'SVY21 straight-line project coordinates; 99-year strata apartment/condo single-unit resales, 80–120 sqm, at least five sales in each 12-month window; September 2022 omitted; descriptive, not causal', near, nearSummary: summarize(near), comparison, comparisonSummary: summarize(comparison) }, null, 2));
