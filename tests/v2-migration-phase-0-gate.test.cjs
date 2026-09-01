'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  listLegacyTestFiles,
  parseLegacyTestOutput,
  verifyPhase0
} = require('../scripts/v2-migration/verify-phase-0.cjs');

const ROOT = path.resolve(__dirname, '..');
const CURRENT_SUMMARY = Object.freeze({
  tests:905, pass:882, fail:23, cancelled:0, skipped:0, todo:0
});

function historicalFailureEvidence(rootDir = ROOT) {
  const output = fs.readFileSync(
    path.join(rootDir, 'artifacts', 'v2-migration', 'legacy-test-baseline.txt'),
    'utf8'
  );
  const failures = [...output.matchAll(
    /^test at (tests\/[^:\n]+):\d+:\d+\n[✖x] (.+?) \([^\n]*\)$/gm
  )].map((match) => ({ file:match[1], title:match[2] }));
  return { summary:{ ...CURRENT_SUMMARY }, failures };
}

function copyPhaseZeroRoot(t) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signedprice-phase-0-'));
  fs.cpSync(ROOT, tempDir, {
    recursive: true,
    filter(source) {
      const name = path.basename(source);
      return name !== 'node_modules' && name !== '.git';
    }
  });
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
  return tempDir;
}

test('phase zero artifacts form a complete reproducible baseline', () => {
  const result = verifyPhase0(ROOT);

  assert.deepEqual(result, { ok: true, missing: [], mismatches: [] });

  const currentEvidence = historicalFailureEvidence();
  assert.deepEqual(verifyPhase0(ROOT, { suiteEvidence:currentEvidence }), result);

  const replacementEvidence = JSON.parse(JSON.stringify(currentEvidence));
  replacementEvidence.failures[0].title = 'replacement failure with the same total';
  assert.deepEqual(verifyPhase0(ROOT, { suiteEvidence:replacementEvidence }), {
    ok:false,
    missing:[],
    mismatches:['artifacts/v2-migration/legacy-test-failures.json']
  });

  const testFiles = listLegacyTestFiles(ROOT);
  assert.equal(testFiles.length > 0, true);
  assert.equal(testFiles.every((file) => /^tests\/[^/]+\.test\.cjs$/.test(file)), true);
  assert.equal(testFiles.includes('tests/v2-migration-phase-0-gate.test.cjs'), true);

  const parsed = parseLegacyTestOutput([
    '✖ replacement failure with the same total (1ms)',
    'ℹ tests 905',
    'ℹ pass 882',
    'ℹ fail 23',
    'ℹ cancelled 0',
    'ℹ skipped 0',
    'ℹ todo 0',
    '',
    'test at tests/replacement.test.cjs:10:1',
    '✖ replacement failure with the same total (1ms)'
  ].join('\n'));
  assert.deepEqual(parsed, {
    summary:{ ...CURRENT_SUMMARY },
    failures:[{ file:'tests/replacement.test.cjs', title:'replacement failure with the same total' }]
  });
});

test('phase zero gate reports a missing artifact alongside a changed contract', (t) => {
  const tempDir = copyPhaseZeroRoot(t);
  fs.unlinkSync(path.join(tempDir, 'artifacts', 'v2-migration', 'legacy-static-routes.json'));
  const artifact = path.join(tempDir, 'artifacts', 'v2-migration', 'signedprice-brand-contract.json');
  const contract = JSON.parse(fs.readFileSync(artifact, 'utf8'));
  contract.brand = 'changed-brand';
  fs.writeFileSync(artifact, `${JSON.stringify(contract, null, 2)}\n`, 'utf8');

  const result = verifyPhase0(tempDir);

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['artifacts/v2-migration/legacy-static-routes.json']);
  assert.deepEqual(result.mismatches, ['artifacts/v2-migration/signedprice-brand-contract.json']);

  const apiArtifact = path.join(tempDir, 'artifacts', 'v2-migration', 'legacy-api-contracts.json');
  const originalApiArtifact = fs.readFileSync(apiArtifact, 'utf8');
  fs.appendFileSync(path.join(tempDir, 'api', 'fx.js'), '\n// unreviewed API drift\n');
  assert.deepEqual(verifyPhase0(tempDir).mismatches, [
    'artifacts/v2-migration/legacy-api-contracts.json',
    'artifacts/v2-migration/signedprice-brand-contract.json'
  ]);
  fs.writeFileSync(apiArtifact, originalApiArtifact, 'utf8');

  const calculationArtifact = path.join(tempDir, 'artifacts', 'v2-migration', 'korea-calculation-fixtures.json');
  const originalCalculationArtifact = fs.readFileSync(calculationArtifact, 'utf8');
  fs.appendFileSync(path.join(tempDir, 'lib', 'rent-check-core.cjs'), '\n// unreviewed calculation drift\n');
  assert.deepEqual(verifyPhase0(tempDir).mismatches, [
    'artifacts/v2-migration/korea-calculation-fixtures.json',
    'artifacts/v2-migration/legacy-api-contracts.json',
    'artifacts/v2-migration/signedprice-brand-contract.json'
  ]);
  fs.writeFileSync(calculationArtifact, originalCalculationArtifact, 'utf8');
});

test('phase zero gate identifies changed contracts and incomplete browser evidence', (t) => {
  const {
    normalizeBrowserBaseline,
    resolveBrowserEvidencePath
  } = require('../scripts/v2-migration/browser-baseline-schema.cjs');
  const tempDir = copyPhaseZeroRoot(t);
  const artifact = path.join(tempDir, 'artifacts', 'v2-migration', 'signedprice-brand-contract.json');
  const originalContract = fs.readFileSync(artifact, 'utf8');
  const contract = JSON.parse(originalContract);
  contract.brand = 'changed-brand';
  fs.writeFileSync(artifact, `${JSON.stringify(contract, null, 2)}\n`, 'utf8');

  const result = verifyPhase0(tempDir);

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.mismatches, ['artifacts/v2-migration/signedprice-brand-contract.json']);
  fs.writeFileSync(artifact, originalContract, 'utf8');

  const artifactPath = path.join(tempDir, 'artifacts', 'v2-migration', 'legacy-browser-baseline.json');
  const original = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  assert.deepEqual(normalizeBrowserBaseline(original), original);

  assert.throws(() => resolveBrowserEvidencePath(tempDir, {
    baseUrl:'http://127.0.0.1:9'
  }), /LEGACY_EVIDENCE_PATH/);
  assert.throws(() => resolveBrowserEvidencePath(tempDir, {
    baseUrl:'http://127.0.0.1:9',
    configuredPath:'artifacts/v2-migration/legacy-browser-baseline.json'
  }), /canonical browser evidence/);
  assert.equal(resolveBrowserEvidencePath(tempDir, {
    baseUrl:'http://127.0.0.1:9',
    configuredPath:'artifacts/v2-migration/invalid-base-browser-evidence.json'
  }), path.join(tempDir, 'artifacts', 'v2-migration', 'invalid-base-browser-evidence.json'));

  const mutations = [
    ['actual district control', (artifact) => { artifact.rentCheck.selectedDistrictControl = '11680'; }],
    ['captured ten-second stability', (artifact) => { delete artifact.explorer.selectionStability; }],
    ['stable dong selection', (artifact) => { artifact.explorer.url = 'https://koreahomeguide.com/explore/?lawdCd=11590&type=officetel'; }],
    ['central dialog bounds', (artifact) => { artifact.explorer.dialogBox.height = 823; }],
    ['Street View 2/8 second equality', (artifact) => { artifact.explorer.streetView.boxAt8Seconds.height = 426; }],
    ['Escape focus return', (artifact) => { artifact.buildingModal.closeEscapeFocus.activeElementLabel = ''; }],
    ['no horizontal overflow', (artifact) => { artifact.rentCheck.pageScrollWidth = 1364; }],
    ['finite viewport and overflow evidence', (artifact) => {
      artifact.rentCheck.viewport.width = null;
      artifact.rentCheck.pageScrollWidth = null;
    }],
    ['finite box dimensions', (artifact) => { artifact.explorer.mapBox.width = null; }],
    ['field layout height', (artifact) => { artifact.rentCheck.fieldBoxes.area.height = 83; }],
    ['hidden result and lead capture', (artifact) => { artifact.rentCheck.resultHidden = false; }]
  ];

  for (const [name, mutate] of mutations) {
    const artifact = JSON.parse(JSON.stringify(original));
    mutate(artifact);
    fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
    const result = verifyPhase0(tempDir);
    assert.deepEqual(result, {
      ok: false,
      missing: [],
      mismatches: ['artifacts/v2-migration/legacy-browser-baseline.json']
    }, name);
  }
});
