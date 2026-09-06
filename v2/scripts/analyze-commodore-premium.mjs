// Run from v2: node scripts/analyze-commodore-premium.mjs
// Historical group comparison, not matched-unit investment returns.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const snapshot = JSON.parse(gunzipSync(readFileSync(new URL('../apps/web/data/singapore-private-sale.json.gz', import.meta.url))));
if (snapshot.digest !== 'e2bc92b0e75ffb7eaf17544e883a96e2986995f7db208f14b711cab8714a1e3c') {
  throw new Error('Source snapshot changed; review article figures.');
}
const project = 'THE COMMODORE';
const located = (r) => Number.isFinite(r.x) && r.x > 0 && Number.isFinite(r.y) && r.y > 0;
const anchor = snapshot.records.find((r) => r.project === project && located(r));
if (!anchor) throw new Error('Missing anchor');
const median = (values) => {
  if (!values.length) throw new Error('Empty group');
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2;
};
const change = (before, after) => 100 * (after / before - 1);

function analyze(minArea, maxArea) {
  const groups = new Map();
  for (const r of snapshot.records) {
    if (r.units !== 1 || r.areaBasis !== 'strata' || !['apartment', 'condominium'].includes(r.propertyType)
      || !r.tenure.startsWith('99 yrs') || !Number.isFinite(r.areaSqm) || r.areaSqm < minArea || r.areaSqm > maxArea
      || !located(r) || !Number.isFinite(r.psf) || r.psf <= 0) continue;
    const distanceM = Math.hypot(r.x - anchor.x, r.y - anchor.y);
    if (distanceM > 1500) continue;
    const window = r.contractMonth >= '2021-11-01' && r.contractMonth < '2022-11-01'
      && r.saleType === (r.project === project ? 'new_sale' : 'resale') ? 'before'
      : r.contractMonth >= '2025-09-01' && r.contractMonth < '2026-09-01' && r.saleType === 'resale' ? 'after' : null;
    if (!window) continue;
    if (!groups.has(r.project)) groups.set(r.project, { project: r.project, distanceM, before: [], after: [] });
    groups.get(r.project)[window].push(r);
  }
  const eligible = [...groups.values()].filter((g) => g.before.length >= 5 && g.after.length >= 5);
  const summarize = (g) => ({
    project: g.project, distanceM: Math.round(g.distanceM),
    beforeN: g.before.length, afterN: g.after.length,
    beforeMedianPsf: median(g.before.map((r) => r.psf)), afterMedianPsf: median(g.after.map((r) => r.psf)),
    beforeMedianArea: median(g.before.map((r) => r.areaSqm)), afterMedianArea: median(g.after.map((r) => r.areaSqm)),
    changePct: change(median(g.before.map((r) => r.psf)), median(g.after.map((r) => r.psf))),
  });
  const target = eligible.find((g) => g.project === project);
  if (!target) throw new Error('Insufficient target observations');
  const targetSummary = summarize(target);
  const peers = eligible.filter((g) => g.project !== project).map(summarize).sort((a, b) => a.project.localeCompare(b.project));
  if (!peers.length) throw new Error('No comparison projects');
  const referenceBefore = median(peers.map((g) => g.beforeMedianPsf));
  const referenceAfter = median(peers.map((g) => g.afterMedianPsf));
  const premiumBeforePct = change(referenceBefore, targetSummary.beforeMedianPsf);
  const premiumAfterPct = change(referenceAfter, targetSummary.afterMedianPsf);
  return {
    areaSqm: [minArea, maxArea], target: targetSummary, peers,
    reference: { beforeMedianOfProjectMediansPsf: referenceBefore, afterMedianOfProjectMediansPsf: referenceAfter,
      beforeN: peers.reduce((n, g) => n + g.beforeN, 0), afterN: peers.reduce((n, g) => n + g.afterN, 0),
      medianProjectChangePct: median(peers.map((g) => g.changePct)) },
    premiumBeforePct, premiumAfterPct, premiumChangePercentagePoints: premiumAfterPct - premiumBeforePct,
    observedTargetResales: target.after.map((r) => ({ month: r.contractMonth, areaSqm: r.areaSqm, floorRange: r.floorRange, psf: r.psf }))
      .sort((a, b) => a.month.localeCompare(b.month) || a.psf - b.psf),
  };
}

console.log(JSON.stringify({
  digest: snapshot.digest, generatedAt: snapshot.generatedAt,
  before: ['2021-11', '2022-10'], after: ['2025-09', '2026-08'],
  method: '99-year strata apartment/condo single-unit sales; project-coordinate radius 1,500m; minimum five transactions per window; target new sales then resales, peers resales in both; equal-project reference; no unit matching or causal interpretation',
  main: analyze(80, 120), sensitivity: analyze(50, 120),
}, null, 2));
