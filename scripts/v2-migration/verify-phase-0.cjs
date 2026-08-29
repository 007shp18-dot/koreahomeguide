'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { collectStaticRoutes } = require('./collect-static-routes.cjs');
const { collectSeoContracts } = require('./collect-seo-contracts.cjs');
const { collectApiContracts, collectCalculationFixtures } = require('./collect-api-contracts.cjs');
const { auditMethodologyCopy } = require('./audit-methodology-copy.cjs');
const { buildBrandContract } = require('./brand-contract.cjs');
const { normalizeBrowserBaseline, PRODUCTION_BASE_URL } = require('./browser-baseline-schema.cjs');
const {
  buildLegacyTestFailureManifest,
  sortFailures
} = require('./legacy-test-contract.cjs');

const ARTIFACT_DIR = path.join('artifacts', 'v2-migration');
const REQUIRED_ARTIFACTS = Object.freeze([
  'korea-calculation-fixtures.json',
  'legacy-api-contracts.json',
  'legacy-browser-baseline.json',
  'legacy-seo-contracts.json',
  'legacy-static-routes.json',
  'legacy-test-baseline.txt',
  'legacy-test-failures.json',
  'methodology-copy-audit.json',
  'signedprice-brand-contract.json'
]);
const DETERMINISTIC_ARTIFACTS = Object.freeze([
  'korea-calculation-fixtures.json',
  'legacy-api-contracts.json',
  'legacy-test-failures.json',
  'legacy-seo-contracts.json',
  'legacy-static-routes.json',
  'methodology-copy-audit.json',
  'signedprice-brand-contract.json'
]);
function relativeArtifact(name) {
  return path.posix.join('artifacts', 'v2-migration', name);
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortJson(value[key])]));
  }
  return value;
}

function normalizedJson(value) {
  return `${JSON.stringify(sortJson(value))}\n`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function generatedArtifacts(rootDir, temporaryDir) {
  const routes = collectStaticRoutes(rootDir);
  const expected = {
    'legacy-static-routes.json': routes,
    'legacy-seo-contracts.json': collectSeoContracts(rootDir, routes),
    'legacy-api-contracts.json': collectApiContracts(rootDir),
    'korea-calculation-fixtures.json': collectCalculationFixtures(rootDir),
    'legacy-test-failures.json': buildLegacyTestFailureManifest(),
    'signedprice-brand-contract.json': buildBrandContract(),
    'methodology-copy-audit.json': auditMethodologyCopy(rootDir)
  };
  for (const name of DETERMINISTIC_ARTIFACTS) writeJson(path.join(temporaryDir, name), expected[name]);
  return expected;
}

function hasExpectedBox(box, expected) {
  return box
    && Object.entries(expected).every(([key, value]) => box[key] === value);
}

function hasExpectedQuery(url, expected) {
  try {
    const parsed = new URL(url);
    return Object.entries(expected).every(([key, value]) => parsed.searchParams.get(key) === value);
  } catch (_) {
    return false;
  }
}

function hasBrowserCoverage(artifact) {
  let evidence;
  try {
    evidence = normalizeBrowserBaseline(artifact);
  } catch (_) {
    return false;
  }
  const stable = evidence.explorer.selectionStability;
  return normalizedJson(evidence) === normalizedJson(artifact)
    && ['control-browser-cloud-chrome', 'playwright-chromium'].includes(evidence.runner)
    && evidence.sourceRevision === '4acbcca6476eabd9033915578f8c532cb2f581c8'
    && evidence.targetBaseUrl === PRODUCTION_BASE_URL
    && Number.isFinite(Date.parse(evidence.capturedAt))
    && evidence.explorer.pageAvailable === true
    && evidence.explorer.selectedDong === '노량진동'
    && hasExpectedQuery(evidence.explorer.url, { lawdCd:'11590', type:'officetel', dong:'노량진동' })
    && hasExpectedBox(evidence.explorer.viewport, { width:1363, height:936 })
    && hasExpectedBox(evidence.explorer.mapBox, { x:37, y:55, width:1274, height:826 })
    && Number.isFinite(stable.durationMs)
    && stable.durationMs >= 10_000
    && stable.urlBeforeIdle === evidence.explorer.url
    && stable.urlAfterIdle === evidence.explorer.url
    && hasExpectedQuery(stable.urlBeforeIdle, { lawdCd:'11590', type:'officetel', dong:'노량진동' })
    && evidence.explorer.buildingCount === 7
    && hasExpectedBox(evidence.explorer.dialogBox, { x:142, y:56, width:1080, height:824 })
    && evidence.explorer.streetView.stateAt2Seconds === 'loading'
    && evidence.explorer.streetView.stateAt8Seconds === 'ready'
    && hasExpectedBox(evidence.explorer.streetView.boxAt2Seconds, { x:302, y:210, width:760, height:428 })
    && normalizedJson(evidence.explorer.streetView.boxAt2Seconds) === normalizedJson(evidence.explorer.streetView.boxAt8Seconds)
    && evidence.buildingModal.closeButtonVisible === true
    && evidence.buildingModal.closeEscapeFocus.overlayHidden === true
    && evidence.buildingModal.closeEscapeFocus.activeElementLabel === 'Open 노량진 드림스퀘어 복합빌딩 building status'
    && evidence.rentCheck.pageAvailable === true
    && hasExpectedQuery(evidence.rentCheck.url, { lawdCd:'11590', type:'officetel', area:'24.13' })
    && evidence.rentCheck.selectedDistrictControl === '11590'
    && evidence.rentCheck.selectedDistrictLabel === 'Dongjak-gu (동작구)'
    && evidence.rentCheck.selectedType === 'officetel'
    && evidence.rentCheck.status.state === 'idle'
    && Number.isFinite(evidence.rentCheck.pageScrollWidth)
    && Number.isFinite(evidence.rentCheck.viewport.width)
    && evidence.rentCheck.pageScrollWidth <= evidence.rentCheck.viewport.width
    && ['area', 'type', 'size'].every((field) => evidence.rentCheck.fieldBoxes[field].height === 84)
    && evidence.rentCheck.resultHidden === true
    && evidence.rentCheck.leadCaptureHidden === true
    && evidence.rentCheck.disclosures.length === 4;
}

function parseLegacyTestOutput(text) {
  if (typeof text !== 'string') throw new TypeError('legacy test output must be a string');
  const summary = {};
  for (const label of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) {
    const match = text.match(new RegExp(`^ℹ ${label} (\\d+)$`, 'm'));
    if (!match) throw new TypeError(`legacy test output is missing ${label} summary`);
    summary[label] = Number(match[1]);
  }
  const failures = [...text.matchAll(
    /^test at (tests\/[^:\n]+):\d+:\d+\n[✖x] (.+?) \([^\n]*\)$/gm
  )].map((match) => ({ file:match[1], title:match[2] }));
  return { summary, failures:sortFailures(failures) };
}

function normalizeSuiteEvidence(value) {
  if (!value || typeof value !== 'object') throw new TypeError('suite evidence must be an object');
  const summary = {};
  for (const label of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) {
    const count = value.summary?.[label];
    if (!Number.isInteger(count) || count < 0) throw new TypeError(`suite evidence ${label} must be a non-negative integer`);
    summary[label] = count;
  }
  if (!Array.isArray(value.failures)) throw new TypeError('suite evidence failures must be an array');
  const failures = sortFailures(value.failures.map((failure) => {
    if (!failure || typeof failure.file !== 'string' || typeof failure.title !== 'string') {
      throw new TypeError('suite failure identities require file and title');
    }
    return failure;
  }));
  return { summary, failures };
}

function matchesSuiteEvidence(actual, expectedSummary, expectedFailures) {
  const normalized = normalizeSuiteEvidence(actual);
  return JSON.stringify(normalized.summary) === JSON.stringify(expectedSummary)
    && JSON.stringify(normalized.failures) === JSON.stringify(sortFailures(expectedFailures));
}

function hasLegacyTestCoverage(text, manifest) {
  try {
    return matchesSuiteEvidence(
      parseLegacyTestOutput(text),
      manifest.historicalSummary,
      manifest.failures
    );
  } catch (_) {
    return false;
  }
}

function listLegacyTestFiles(rootDir) {
  const testsDir = path.resolve(rootDir, 'tests');
  return fs.readdirSync(testsDir, { withFileTypes:true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.cjs'))
    .map((entry) => path.posix.join('tests', entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function runLegacyTestSuite(rootDir) {
  const { spawnSync } = require('node:child_process');
  const files = listLegacyTestFiles(rootDir);
  const run = spawnSync(process.execPath, ['--test', ...files], {
    cwd:path.resolve(rootDir),
    encoding:'utf8',
    maxBuffer:50 * 1024 * 1024
  });
  if (run.error) throw run.error;
  const output = `${run.stdout || ''}${run.stderr || ''}`;
  return { exitCode:run.status, evidence:parseLegacyTestOutput(output) };
}

/**
 * Verify that Phase 0's tracked migration evidence is present and that every
 * deterministic contract can be regenerated without changing its meaning.
 * The browser and legacy-suite artifacts are evidence captures, so their
 * required coverage fields are validated without re-running Production.
 *
 * @param {string} rootDir repository root
 * @param {{suiteEvidence?:{summary:object,failures:object[]}}} options explicit current-suite evidence
 * @returns {{ok:boolean, missing:string[], mismatches:string[]}}
 */
function verifyPhase0(rootDir, options = {}) {
  if (typeof rootDir !== 'string' || !rootDir) throw new TypeError('rootDir must be a non-empty string');
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const resolvedRoot = path.resolve(rootDir);
  const artifactRoot = path.join(resolvedRoot, ARTIFACT_DIR);
  const missing = REQUIRED_ARTIFACTS
    .filter((name) => !fs.existsSync(path.join(artifactRoot, name)))
    .map(relativeArtifact)
    .sort();
  const missingNames = new Set(missing.map((file) => path.posix.basename(file)));

  const mismatches = [];
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signedprice-phase-0-'));
  try {
    const presentDeterministicArtifacts = DETERMINISTIC_ARTIFACTS.filter((name) => !missingNames.has(name));
    let expected = null;
    if (presentDeterministicArtifacts.length > 0) {
      try {
        expected = generatedArtifacts(resolvedRoot, temporaryDir);
      } catch (_) {
        for (const name of presentDeterministicArtifacts) mismatches.push(relativeArtifact(name));
      }
    }
    if (expected) {
      for (const name of presentDeterministicArtifacts) {
        const actualFile = path.join(artifactRoot, name);
        const expectedFile = path.join(temporaryDir, name);
        try {
          const actualChecksum = sha256(normalizedJson(readJson(actualFile)));
          const expectedChecksum = sha256(normalizedJson(readJson(expectedFile)));
          if (actualChecksum !== expectedChecksum || normalizedJson(readJson(actualFile)) !== normalizedJson(expected[name])) {
            mismatches.push(relativeArtifact(name));
          }
        } catch (_) {
          mismatches.push(relativeArtifact(name));
        }
      }
    }
    if (!missingNames.has('legacy-browser-baseline.json')) {
      try {
        if (!hasBrowserCoverage(readJson(path.join(artifactRoot, 'legacy-browser-baseline.json')))) {
          mismatches.push(relativeArtifact('legacy-browser-baseline.json'));
        }
      } catch (_) {
        mismatches.push(relativeArtifact('legacy-browser-baseline.json'));
      }
    }
    if (!missingNames.has('legacy-test-baseline.txt') && !missingNames.has('legacy-test-failures.json')) {
      try {
        const manifest = readJson(path.join(artifactRoot, 'legacy-test-failures.json'));
        if (!hasLegacyTestCoverage(
          fs.readFileSync(path.join(artifactRoot, 'legacy-test-baseline.txt'), 'utf8'),
          manifest
        )) {
          mismatches.push(relativeArtifact('legacy-test-baseline.txt'));
        }
      } catch (_) {
        mismatches.push(relativeArtifact('legacy-test-baseline.txt'));
      }
    }
    if (Object.hasOwn(options, 'suiteEvidence') && !missingNames.has('legacy-test-failures.json')) {
      try {
        const manifest = readJson(path.join(artifactRoot, 'legacy-test-failures.json'));
        if (!matchesSuiteEvidence(options.suiteEvidence, manifest.currentSummary, manifest.failures)) {
          mismatches.push(relativeArtifact('legacy-test-failures.json'));
        }
      } catch (_) {
        mismatches.push(relativeArtifact('legacy-test-failures.json'));
      }
    }
  } finally {
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
  const uniqueMismatches = [...new Set(mismatches)].sort();
  return { ok: missing.length === 0 && uniqueMismatches.length === 0, missing, mismatches:uniqueMismatches };
}

if (require.main === module) {
  try {
    const rootDir = process.cwd();
    const suite = runLegacyTestSuite(rootDir);
    if (suite.exitCode !== 1) {
      throw new Error(`current legacy test suite exited ${suite.exitCode}; expected 1 for the locked failures`);
    }
    const result = verifyPhase0(rootDir, { suiteEvidence:suite.evidence });
    process.stdout.write(`${JSON.stringify({ ...result, suite:suite.evidence.summary })}\n`);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ ok:false, missing:[], mismatches:['current legacy test suite'], error:error.message })}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  listLegacyTestFiles,
  parseLegacyTestOutput,
  runLegacyTestSuite,
  verifyPhase0
};
