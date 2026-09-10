import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const markers = Object.freeze([
  ['station endpoint environment', /SEOUL_STATION_ENDPOINT/],
  ['school endpoint environment', /KOREA_SCHOOL_ENDPOINT/],
  ['coordinate endpoint environment', /KOREA_BUILDING_COORDINATE_ENDPOINT/],
  ['proximity builder', /build-korea-proximity/],
  ['proximity artifact staging', /signedprice-korea-proximity-v1/],
]);

async function filesBelow(directory) {
  const files = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function isClientManifest(path) {
  return /(?:client-reference-manifest|build-manifest|react-loadable-manifest|clientMiddlewareManifest)/i
    .test(path.split(sep).join('/'));
}

export async function scanKoreaProximityClientBoundary(nextDirectory) {
  const root = resolve(nextDirectory);
  const staticFiles = await filesBelow(resolve(root, 'static'));
  const manifests = (await filesBelow(root)).filter(isClientManifest);
  const findings = [];
  for (const path of [...new Set([...staticFiles, ...manifests])].sort()) {
    const contents = await readFile(path, 'utf8');
    for (const [marker, pattern] of markers) {
      if (pattern.test(contents)) findings.push({ file: relative(root, path).split(sep).join('/'), marker });
    }
  }
  return findings;
}

function importsFrom(source) {
  return [...source.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g)]
    .map((match) => match[1]).filter((specifier) => specifier.startsWith('.'));
}

async function resolveImport(path) {
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, `${path}.mts`, join(path, 'index.ts'), join(path, 'index.tsx')]) {
    try { await readFile(candidate, 'utf8'); return candidate; } catch (error) {
      if (!error || typeof error !== 'object' || error.code !== 'ENOENT') throw error;
    }
  }
  return undefined;
}

export async function scanKoreaProximitySourceBoundary(sourceRoot) {
  const root = resolve(sourceRoot);
  const files = await filesBelow(root);
  const findings = [];
  for (const entry of files.filter((file) => /\.(?:ts|tsx|mts)$/.test(file))) {
    const source = await readFile(entry, 'utf8');
    if (!/^\s*['"]use client['"]/m.test(source)) continue;
    const pending = [entry];
    const seen = new Set();
    while (pending.length > 0) {
      const current = pending.pop();
      if (!current || seen.has(current)) continue;
      seen.add(current);
      if (/build-korea-proximity(?:\.mts)?/.test(current)) {
        findings.push({ file: relative(root, entry).split(sep).join('/'), marker: 'server builder import' });
        break;
      }
      const currentSource = await readFile(current, 'utf8');
      for (const specifier of importsFrom(currentSource)) {
        const resolved = await resolveImport(resolve(dirname(current), specifier));
        if (resolved) pending.push(resolved);
      }
    }
  }
  return findings.sort((left, right) => left.file.localeCompare(right.file));
}

async function main() {
  try { await readFile(resolve(process.argv[2] ?? 'apps/web/.next', 'build-manifest.json'), 'utf8'); } catch { throw new Error('Korea proximity client boundary requires a production build manifest.'); }
  const findings = await scanKoreaProximityClientBoundary(process.argv[2] ?? 'apps/web/.next');
  findings.push(...await scanKoreaProximitySourceBoundary('apps/web'));
  if (findings.length === 0) {
    process.stdout.write('Korea proximity client boundary scan passed.\n');
    return;
  }
  for (const finding of findings) process.stderr.write(`${finding.file}: ${finding.marker}\n`);
  process.exitCode = 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main();
