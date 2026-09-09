// Replay captured, successful URA envelopes through the production collector.
// No provider credentials are needed for replay. Writes require --apply and an
// explicitly supplied DATABASE_URL; use an isolated Neon branch first.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { collectSingaporeEvidence } from '../lib/market-data/singapore-collector.server.ts';
import { createMarketRefreshRepository } from '../lib/market-data/refresh-repository.server.ts';

const inputDirectory = process.argv.find((arg) => arg.startsWith('--input-dir='))?.slice(12);
if (!inputDirectory) throw new Error('Supply --input-dir containing successful sale1..4 and rentYYqN envelopes.');
const apply = process.argv.includes('--apply');
const reference = new Date(process.argv.find((arg) => arg.startsWith('--reference='))?.slice(12) ?? new Date().toISOString());
const load = async (name: string) => JSON.parse(await readFile(resolve(inputDirectory, `${name}.json`), 'utf8'));
const sql = apply ? neon(process.env.DATABASE_URL ?? '') : null;
const repository = sql === null ? null : createMarketRefreshRepository({
  query: (statement, parameters = []) => sql.query(statement, [...parameters]),
  transaction: (statements) => sql.transaction(statements.map(({ statement, parameters = [] }) => sql.query(statement, [...parameters]))),
});
for (const job of ['sg-private-sale', 'sg-private-rent'] as const) {
  const batch = await collectSingaporeEvidence({
    job, accessKey: 'captured-response-replay', reference,
    fetchSaleEnvelopes: () => Promise.all([1, 2, 3, 4].map((number) => load(`sale${number}`))),
    fetchRentalEnvelope: (quarter) => load(`rent${quarter}`),
  });
  await writeFile(resolve(inputDirectory, `${job}-normalized.json`), JSON.stringify(batch));
  console.log(JSON.stringify({ job, state: 'parsed', records: batch.records.length,
    projects: new Set(batch.records.map((row) => row.entity?.id)).size,
    scope: batch.reconciliationMonths }));
  if (repository) {
    const run = await repository.start(job);
    if (!run) throw new Error('A refresh is already running.');
    try {
      const first = await repository.persist(run, batch);
      await repository.succeed(run, first, batch.sourceAsOf);
      console.log(JSON.stringify({ job, state: 'persisted', ...first }));
      const repeat = await repository.start(job);
      if (!repeat) throw new Error('Repeat verification could not acquire lease.');
      try {
        const second = await repository.persist(repeat, batch);
        await repository.succeed(repeat, second, batch.sourceAsOf);
        console.log(JSON.stringify({ job, state: 'repeated', ...second }));
        if (second.inserted !== 0 || second.updated !== 0) throw new Error('Replay is not idempotent.');
      } catch (error) { await repository.fail(repeat, 'verification_failed'); throw error; }
    } catch (error) { await repository.fail(run, 'verification_failed'); throw error; }
  }
}
