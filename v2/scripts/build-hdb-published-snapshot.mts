import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import {
  buildHdbPublishedSnapshot,
  parseHdbSnapshot,
  stringifyHdbPublishedSnapshot,
} from '@signedprice/singapore-property';

const [inputPath, outputPath] = process.argv.slice(2);
if (inputPath === undefined || outputPath === undefined) throw new Error('input and output paths are required');
const published = buildHdbPublishedSnapshot(parseHdbSnapshot(readFileSync(inputPath, 'utf8')));
const serialized = stringifyHdbPublishedSnapshot(published);
writeFileSync(outputPath, gzipSync(serialized, { level: 9, mtime: 0 }));
process.stdout.write(JSON.stringify({
  bytes: Buffer.byteLength(serialized),
  gzipBytes: readFileSync(outputPath).byteLength,
  sha256: createHash('sha256').update(serialized).digest('hex'),
  digest: published.digest,
  blocks: published.blocks.length,
  towns: published.towns.length,
}));
