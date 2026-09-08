// Root/operator entrypoint. Default is a plan only; --execute makes one bounded
// official request and atomically activates its validated snapshot.
import { parseJapanScope } from '../apps/web/lib/japan/source.server';
import { createJapanRepository, japanSqlPort, readJapanPublication } from '../apps/web/lib/japan/repository.server';
import { refreshJapan } from '../apps/web/lib/japan/refresh.server';

const args = process.argv.slice(2);
const query = new URLSearchParams();
for (const arg of args) {
  if (arg === '--execute' || arg === '--verify' || arg === '--allow-large-reduction') continue;
  const match = /^--(city|year|quarter)=(.+)$/.exec(arg);
  if (!match || query.has(match[1])) throw new Error('Use --city=13103 --year=2025 --quarter=4 [--execute|--verify].');
  query.set(match[1], match[2]);
}
const scope = parseJapanScope(query);
if (args.includes('--execute') && args.includes('--verify')) throw new Error('Choose execute or verify.');
if (!args.includes('--execute') && !args.includes('--verify')) {
  process.stdout.write(JSON.stringify({ action: 'plan', scope, migration: '0015_japan_area_releases.sql',
    source: 'MLIT XIT001, English, classification 01', publicPath: `/jp/tokyo/?${new URLSearchParams(scope)}`,
    requiredEnvironmentNames: ['DATABASE_URL','SIGNEDPRICE_REINFOLIB_API_KEY'],
    next: 'Apply the reviewed migration using the existing migration runner, then repeat with --execute.' }) + '\n');
} else {
  const port = japanSqlPort();
  if (!port) throw new Error('DATABASE_URL is required.');
  if (args.includes('--verify')) {
    const data = await readJapanPublication(scope, { q: '', type: '', minArea: null, maxArea: null, page: 1, release: null }, port);
    process.stdout.write(JSON.stringify({ scope, published: data !== null, releaseId: data?.releaseId,
      received: data?.sourceCount, visible: data?.filteredCount, firstPageRows: data?.records.length,
      sourceAsOf: data?.retrievedAt, currency: 'JPY', periodPrecision: 'quarter' }) + '\n');
  } else {
    const key = process.env.SIGNEDPRICE_REINFOLIB_API_KEY?.trim();
    if (!key) throw new Error('SIGNEDPRICE_REINFOLIB_API_KEY is required.');
    const result = await refreshJapan(createJapanRepository(port), scope, key,
      { allowLargeReduction: args.includes('--allow-large-reduction') });
    process.stdout.write(JSON.stringify(result) + '\n');
    if (result.state !== 'ready') process.exitCode = 1;
  }
}
