// Run with --expose-gc and the existing TypeScript extension loader.
// Uses checked-in public artifacts only; never connects to a database.
import { performance } from 'node:perf_hooks';
import { singaporeSnapshotRepositoryFromEnvironment } from '../apps/web/lib/singapore/snapshot-repository.server.ts';
import { singaporeCheckEvidenceRepositoriesFromEnvironment } from '../apps/web/lib/singapore/check-evidence-repository.server.ts';
import { koreaEvidenceRepositoriesFromEnvironment } from '../apps/web/lib/public-market/korea-evidence-repositories.server.ts';

const start = performance.now();
function checkpoint(stage: string, evidence?: unknown) {
  global.gc?.();
  const memory = process.memoryUsage();
  console.log(JSON.stringify({
    stage, evidence, seconds: Math.round((performance.now() - start) / 100) / 10,
    heapMiB: Math.round(memory.heapUsed / 1024 ** 2),
    rssMiB: Math.round(memory.rss / 1024 ** 2),
    peakRssMiB: Math.round(process.resourceUsage().maxRSS / 1024),
  }));
}

checkpoint('start');
const singapore = await singaporeSnapshotRepositoryFromEnvironment();
if (singapore === null) throw new Error('Singapore evidence did not load.');
checkpoint('singapore-explore', singapore.getContext());
const check = await singaporeCheckEvidenceRepositoriesFromEnvironment();
if (Object.values(check.availability()).some(ready => !ready)) {
  throw new Error('Singapore Check evidence did not load.');
}
checkpoint('singapore-check', Object.fromEntries(
  (['ura-private-sale', 'hdb-resale', 'hdb-rent'] as const).map(market => [
    market, { records: check.get(market)?.recordCount, digest: check.get(market)?.digest },
  ]),
));
const korea = koreaEvidenceRepositoriesFromEnvironment();
if (korea.rent === null || korea.sale === null) throw new Error('Korea evidence did not load.');
checkpoint('korea-check', {
  rent: korea.rent.getArtifact().stats.sourceRecordCount,
  sale: korea.sale.getArtifact().stats.sourceRecordCount,
});
const strictKorea = koreaEvidenceRepositoriesFromEnvironment({ retainLastVerified: false });
for (let request = 0; request < 10; request += 1) {
  if (koreaEvidenceRepositoriesFromEnvironment({ retainLastVerified: false }) !== strictKorea) {
    throw new Error('Strict Check rebuilt immutable evidence on a warm request.');
  }
}
checkpoint('warm-korea-check');
const limit = process.argv.find(arg => arg.startsWith('--max-rss-mib='))?.split('=')[1];
if (limit !== undefined && process.resourceUsage().maxRSS / 1024 > Number(limit)) {
  throw new Error(`Snapshot loading exceeded the ${limit} MiB RSS budget.`);
}
