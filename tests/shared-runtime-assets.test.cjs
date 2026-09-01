const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function scriptSources(relativePath) {
  const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1].split(/[?#]/, 1)[0]);
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
