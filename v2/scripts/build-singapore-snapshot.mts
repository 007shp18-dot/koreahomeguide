import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  SG_URA_PRIVATE_SALE_RIGHTS,
  assertSingaporePublicationRights,
  buildSingaporeSnapshot,
  createUraClient,
  parseSingaporeSnapshot,
  parseUraPrivateSaleEnvelope,
  readUraCredential,
  stringifySingaporeSnapshot,
  type SingaporePublicationRights,
  type SingaporeSnapshot,
  type UraCredential,
  type UraFetch,
} from '@signedprice/singapore-property';

type RunnerOptions = Readonly<{
  outputPath: string;
  credential: UraCredential;
  fetch?: UraFetch;
  now?: () => Date;
  rights?: SingaporePublicationRights;
  log?: (line: string) => void;
}>;

export async function runSingaporeSnapshotBuild(options: RunnerOptions): Promise<SingaporeSnapshot> {
  const rights = options.rights ?? SG_URA_PRIVATE_SALE_RIGHTS;
  assertSingaporePublicationRights(rights);
  const client = createUraClient({ ...options.credential, fetch: options.fetch });
  const batches = await client.fetchPrivateResidentialTransactions();
  const records = batches.flatMap((batch, index) => parseUraPrivateSaleEnvelope(batch, index + 1));
  const snapshot = buildSingaporeSnapshot({
    records,
    generatedAt: (options.now ?? (() => new Date()))().toISOString(),
    rights,
  });
  const serialized = stringifySingaporeSnapshot(snapshot);
  const verified = parseSingaporeSnapshot(serialized);
  await mkdir(dirname(resolve(options.outputPath)), { recursive: true });
  await writeFile(resolve(options.outputPath), serialized, { encoding: 'utf8', flag: 'wx' });
  (options.log ?? console.log)([
    verified.version,
    verified.generatedAt,
    `${verified.period.from}..${verified.period.to}`,
    `${verified.totals.projects} projects`,
    `${verified.totals.transactions} transactions`,
    `${verified.totals.excluded} excluded`,
    `${Buffer.byteLength(serialized, 'utf8')} bytes`,
    verified.digest,
  ].join(' | '));
  return verified;
}

async function main(): Promise<void> {
  const outputPath = process.argv[2];
  if (outputPath === undefined) {
    process.stderr.write('Singapore snapshot build failed.\n');
    process.exitCode = 1;
    return;
  }
  try {
    await runSingaporeSnapshotBuild({ outputPath, credential: readUraCredential() });
  } catch {
    process.stderr.write('Singapore snapshot build failed.\n');
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  await main();
}
