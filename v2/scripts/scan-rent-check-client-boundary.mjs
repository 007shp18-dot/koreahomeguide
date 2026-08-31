import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKERS = Object.freeze([
  Object.freeze({
    marker: 'credential marker',
    pattern: /DATA_GO_KR_SERVICE_KEY|\bservice[-_]?key\b|\bapi[-_]?key\b|\bevidence[-_]?ref\b/i,
  }),
  Object.freeze({ marker: 'MOLIT raw endpoint', pattern: /apis\.data\.go\.kr/i }),
  Object.freeze({ marker: 'MOLIT endpoint family', pattern: /RTMSDataSvc/i }),
  Object.freeze({ marker: 'rights evidence URL', pattern: /(?:https?:\/\/)?(?:www\.)?data\.go\.kr\/data\//i }),
  Object.freeze({
    marker: 'area artifact environment',
    pattern: /SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT/,
  }),
  Object.freeze({
    marker: 'area artifact contract',
    pattern: /signedprice-public-area-summary-v1/,
  }),
  Object.freeze({ marker: 'raw source record', pattern: /sourceRecordId/ }),
  Object.freeze({ marker: 'temporary area job', pattern: /public-area-summary-job/ }),
  Object.freeze({
    marker: 'conversion artifact environment',
    pattern: /SIGNEDPRICE_CONVERSION_CURVE_(?:ARTIFACT|PERIOD|SHA256)/,
  }),
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
  const normalized = path.split(sep).join('/');
  return /(?:client-reference-manifest|build-manifest|react-loadable-manifest|clientMiddlewareManifest)/i
    .test(normalized);
}

export async function scanRentCheckClientBoundary(nextDirectory) {
  const root = resolve(nextDirectory);
  const staticFiles = await filesBelow(resolve(root, 'static'));
  const manifestFiles = (await filesBelow(root)).filter(isClientManifest);
  const files = [...new Set([...staticFiles, ...manifestFiles])].sort();
  const findings = [];

  for (const path of files) {
    const contents = await readFile(path, 'utf8');
    for (const { marker, pattern } of MARKERS) {
      if (pattern.test(contents)) {
        findings.push({
          file: relative(root, path).split(sep).join('/'),
          marker,
        });
      }
    }
  }
  return findings;
}

async function main() {
  const nextDirectory = process.argv[2] ?? 'apps/web/.next';
  const findings = await scanRentCheckClientBoundary(nextDirectory);
  if (findings.length === 0) {
    process.stdout.write('Rent Check client boundary scan passed.\n');
    return;
  }
  for (const finding of findings) {
    process.stderr.write(`${finding.file}: ${finding.marker}\n`);
  }
  process.exitCode = 1;
}

if (process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}
