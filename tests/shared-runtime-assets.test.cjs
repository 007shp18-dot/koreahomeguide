const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const deprecatedRuntimePaths = [
  '/zh/app.js',
  '/zh/tools/seoul-rent-check/app.js',
  '/zh/tools/brokerage-fee-calculator/app.js'
];

function scriptSources(relativePath) {
  const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1].split(/[?#]/, 1)[0]);
}

function assertPagesLoadRuntime(pages, runtime) {
  assert.ok(fs.existsSync(path.join(root, runtime.replace(/^\//, ''))), `${runtime} must exist`);
  for (const page of pages) {
    const sources = scriptSources(page);
    assert.equal(
      sources.filter(source => source === runtime).length,
      1,
      `${page} must load the canonical ${runtime} runtime exactly once`
    );
    for (const deprecated of deprecatedRuntimePaths) {
      assert.ok(!sources.includes(deprecated), `${page} must not load deprecated ${deprecated}`);
    }
  }
}

test('English and Chinese home pages load one shared Rent Check runtime', () => {
  assertPagesLoadRuntime(['index.html', 'zh/index.html'], '/app.js');
});

test('English and Chinese Rent Check tool pages load one shared tool runtime', () => {
  assertPagesLoadRuntime(
    ['tools/seoul-rent-check/index.html', 'zh/tools/seoul-rent-check/index.html'],
    '/tools/seoul-rent-check/app.js'
  );
});

test('English and Chinese brokerage calculator pages load one shared runtime', () => {
  assertPagesLoadRuntime(
    ['tools/brokerage-fee-calculator/index.html', 'zh/tools/brokerage-fee-calculator/index.html'],
    '/tools/brokerage-fee-calculator/app.js'
  );
});

test('deprecated locale runtime copies stay removed', () => {
  for (const runtime of deprecatedRuntimePaths) {
    assert.ok(!fs.existsSync(path.join(root, runtime.replace(/^\//, ''))), `${runtime} must stay removed`);
  }
});

test('home and tool Rent Check runtimes stay distinct', () => {
  const homeRuntime = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const toolRuntime = fs.readFileSync(path.join(root, 'tools/seoul-rent-check/app.js'), 'utf8');
  assert.notEqual(homeRuntime, toolRuntime);
});
