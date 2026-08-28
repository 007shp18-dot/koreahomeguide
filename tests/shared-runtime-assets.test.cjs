const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function scriptSources(relativePath) {
  const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1]);
}

function assertPagesLoadRuntime(pages, runtime) {
  assert.ok(fs.existsSync(path.join(root, runtime.replace(/^\//, ''))), `${runtime} must exist`);
  for (const page of pages) {
    assert.ok(
      scriptSources(page).includes(runtime),
      `${page} must load the canonical ${runtime} runtime`
    );
  }
}

test('all Rent Check entrypoints load one shared runtime', () => {
  assertPagesLoadRuntime([
    'index.html',
    'tools/seoul-rent-check/index.html',
    'zh/index.html',
    'zh/tools/seoul-rent-check/index.html'
  ], '/app.js');
});

test('both brokerage calculator locales load one shared runtime', () => {
  assertPagesLoadRuntime([
    'tools/brokerage-fee-calculator/index.html',
    'zh/tools/brokerage-fee-calculator/index.html'
  ], '/tools/brokerage-fee-calculator/app.js');
});
