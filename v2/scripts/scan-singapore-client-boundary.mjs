import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const markers = Object.freeze([
  ['URA environment name', /SIGNEDPRICE_URA_ACCESS_KEY/],
  ['URA token endpoint', /insertNewToken\.action/],
  ['URA data endpoint', /invokeUraDS/],
  ['URA access header', /AccessKey/],
  ['URA token header', /\bToken\b/],
  ['sentinel key', /test-only-key|sentinel-ura-key/],
]);

async function filesBelow(directory) {
  const output = [];
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return output;
    throw error;
  }
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...await filesBelow(path));
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

function isClientManifest(path) {
  return /(?:client-reference-manifest|build-manifest|react-loadable-manifest|clientMiddlewareManifest)/i
    .test(path.split(sep).join('/'));
}

export async function scanSingaporeClientBoundary(nextDirectory) {
  const root = resolve(nextDirectory);
  const staticFiles = await filesBelow(resolve(root, 'static'));
  const manifests = (await filesBelow(root)).filter(isClientManifest);
  const findings = [];
  for (const path of [...new Set([...staticFiles, ...manifests])].sort()) {
    const contents = await readFile(path, 'utf8');
    for (const [marker, pattern] of markers) {
      if (pattern.test(contents)) findings.push({
        file: relative(root, path).split(sep).join('/'), marker,
      });
    }
  }
  return findings;
}

async function main() {
  const findings = await scanSingaporeClientBoundary(process.argv[2] ?? 'apps/web/.next');
  if (findings.length === 0) {
    process.stdout.write('Singapore client boundary scan passed.\n');
    return;
  }
  for (const finding of findings) process.stderr.write(`${finding.file}: ${finding.marker}\n`);
  process.exitCode = 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}
