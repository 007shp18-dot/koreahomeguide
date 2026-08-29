'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildBrandContract } = require('../scripts/v2-migration/brand-contract.cjs');
const { auditMethodologyCopy } = require('../scripts/v2-migration/audit-methodology-copy.cjs');

test('locks the approved signedprice identity', () => {
  assert.deepEqual(buildBrandContract(), {
    brand: 'signedprice',
    domain: 'signedprice.com',
    casing: 'lowercase-public',
    colors: { ink:'#0f172a', white:'#ffffff', accent:'#2563eb', accentLight:'#60a5fa', muted:'#64748b' },
    descriptors: [
      'Real prices. Local rules. Trusted experts.',
      'Real prices. Better property decisions.',
      'Global property intelligence and transaction network.'
    ],
    logoAssets: ['logo-mark.svg', 'logo-mark-16.svg', 'logo-mark-inverse.svg', 'logo-mark-mono.svg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'og-image.svg'],
    ogRules: { defaultClaim: 'Property intelligence for Seoul, Singapore and Dubai', requireMarketCapabilityEvidence: true },
  });
});

test('finds the current misleading statutory-rate label', () => {
  const findings = auditMethodologyCopy(process.cwd());
  assert.ok(findings.some((item) => item.file === 'deposit-conversion.js' && item.code === 'fixed_rate_called_statutory'));
});

test('matches only fixed five-percent statutory or legal comparison rates', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'signedprice-copy-audit-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const fixtures = {
    '01-percent.js': "const comparison = { rate: '5%', label: 'statutory reference' };\n",
    '02-percent-words.js': "const comparison = { rate: '5 percent', label: 'legal rate' };\n",
    '03-percent-english.js': "const comparison = { rate: 'five percent', label: 'statutory' };\n",
    '04-decimal.js': "const comparison = { annualRate: 0.050, label: 'legal conversion rate' };\n",
    '05-chinese.js': "const comparison = { 年率: '百分之五', label: '法定参考年率' };\n",
    '06-separated.js': "const comparison = {\n  comparisonRate: 0.05,\n  label: 'legal'\n};\n",
    '07-negative-four.js': "const comparison = { rate: '4%', label: 'statutory reference' };\n",
    '08-negative-decimal.js': "const comparison = { annualRate: 0.06, label: 'legal conversion rate' };\n",
    '09-negative-variable.js': "const comparison = { annualRate: getRate(), label: 'statutory reference' };\n",
    '10-negative-unrelated.js': "const note = 'legal advice'; const occupancy = '5%';\n"
  };
  for (const [file, source] of Object.entries(fixtures)) fs.writeFileSync(path.join(root, file), source);

  const findings = auditMethodologyCopy(root);
  assert.equal(findings.length, 6);
  assert.deepEqual(findings.map((item) => item.file), [
    '01-percent.js', '02-percent-words.js', '03-percent-english.js',
    '04-decimal.js', '05-chinese.js', '06-separated.js'
  ]);
  for (const finding of findings) {
    assert.deepEqual(Object.keys(finding), ['file', 'line', 'code', 'excerpt']);
    assert.equal(finding.line, 1 + (finding.file === '06-separated.js' ? 2 : 0));
    assert.equal(finding.code, 'fixed_rate_called_statutory');
    assert.ok(finding.excerpt.length > 0 && finding.excerpt.length <= 240);
  }
  assert.deepEqual(auditMethodologyCopy(root), findings);
});

test('includes production sources while excluding tests, artifacts, dependencies, and internal paths', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'signedprice-copy-audit-exclusions-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = "const comparison = { rate: '5%', label: 'statutory reference' };\n";
  fs.writeFileSync(path.join(root, 'production.js'), source);
  for (const directory of ['tests', 'artifacts', 'node_modules', 'internal', '.git']) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
    fs.writeFileSync(path.join(root, directory, 'hidden.js'), source);
  }

  const findings = auditMethodologyCopy(root);
  assert.deepEqual(findings, [{
    file: 'production.js', line: 1, code: 'fixed_rate_called_statutory', excerpt: source.trim()
  }]);
});

test('retains the three known production labels through fixed-rate dataflow', () => {
  assert.deepEqual(
    auditMethodologyCopy(process.cwd()).map(({ file, line, code }) => ({ file, line, code })),
    [
      { file: 'deposit-conversion.js', line: 18, code: 'fixed_rate_called_statutory' },
      { file: 'rent-check-ui-utils.js', line: 284, code: 'fixed_rate_called_statutory' },
      { file: 'zh/rent-check-ui-utils.js', line: 277, code: 'fixed_rate_called_statutory' }
    ]
  );
});

test('follows fixed-rate definition and aliases into user-visible labels', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'signedprice-copy-audit-dataflow-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(root, 'deposit-conversion.js'), [
    'const DEPOSIT_CONVERSION_REFERENCE = {',
    '  annualRate: 0.050,',
    "  basis: 'statutory conversion reference'",
    '};'
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(root, 'lib', 'rent-check-core.cjs'), [
    "const { DEPOSIT_CONVERSION_REFERENCE } = require('../deposit-conversion.js');",
    'const conversionAnnualRate = DEPOSIT_CONVERSION_REFERENCE.annualRate;',
    'module.exports = { conversionAnnualRate };'
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(root, 'rent-check-ui-utils.js'), [
    'function label(result) {',
    '  const rate = Number(result && result.conversionAnnualRate);',
    "  return `At ${(rate * 100).toFixed(1)}%/year statutory reference`;",
    '}'
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(root, 'zh-ui.js'), [
    'function label(result) {',
    '  const rate = Number(result && result.conversionAnnualRate);',
    "  return `按法定参考年率 ${(rate * 100).toFixed(1)}%`;",
    '}'
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(root, 'dynamic-ui.js'), [
    'function label(result) {',
    '  const rate = Number(result && result.runtimeRate);',
    "  return `At ${(rate * 100).toFixed(1)}%/year statutory reference`;",
    '}'
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(root, 'dynamic-source.js'), [
    'const runtimeRate = getRate();',
    "const label = 'statutory conversion reference';",
    'module.exports = { runtimeRate, label };'
  ].join('\n') + '\n');

  const findings = auditMethodologyCopy(root);
  assert.deepEqual(findings.map(({ file, line, code }) => ({ file, line, code })), [
    { file: 'deposit-conversion.js', line: 3, code: 'fixed_rate_called_statutory' },
    { file: 'rent-check-ui-utils.js', line: 3, code: 'fixed_rate_called_statutory' },
    { file: 'zh-ui.js', line: 3, code: 'fixed_rate_called_statutory' }
  ]);
});
