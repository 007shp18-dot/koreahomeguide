const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { collectStaticRoutes } = require('../scripts/v2-migration/collect-static-routes.cjs');

test('collects stable public routes without test or artifact paths', () => {
  const routes = collectStaticRoutes(process.cwd());
  assert.ok(routes.some((route) => route.path === '/explore/'));
  assert.ok(routes.some((route) => route.path === '/tools/seoul-rent-check/'));
  assert.equal(routes.some((route) => route.path.startsWith('/tests/')), false);
  assert.deepEqual([...routes].sort((a, b) => a.path.localeCompare(b.path)), routes);
});

test('does not inventory nested worktree paths as public routes', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'v2-migration-routes-'));
  try {
    fs.mkdirSync(path.join(rootDir, 'public'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, '.worktrees', 'hidden'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'worktrees', 'hidden'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'public', 'index.html'), '<!doctype html>');
    fs.writeFileSync(path.join(rootDir, '.worktrees', 'hidden', 'index.html'), '<!doctype html>');
    fs.writeFileSync(path.join(rootDir, 'worktrees', 'hidden', 'index.html'), '<!doctype html>');

    assert.deepEqual(collectStaticRoutes(rootDir).map((route) => route.path), ['/public/']);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});
