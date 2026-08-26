const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const affectedScripts = [
  'app.js',
  'zh/app.js',
  'explore/app.js',
  'zh/explore/app.js',
  'explore/building/app.js',
  'zh/explore/building/app.js',
  'rent-market-page.js',
  'zh/rent-market-page.js',
  'tools/seoul-rent-check/app.js',
  'zh/tools/seoul-rent-check/app.js'
];

test('date formatter renders English and Chinese calendar dates without timezone shifts', () => {
  const KHGDate = require('../date-utils.js');
  assert.equal(KHGDate.formatDate('2026-07-31', 'en-US'), 'Jul 31, 2026');
  assert.equal(KHGDate.formatMonth('2026-07', 'en-US'), 'Jul 2026');
  assert.equal(KHGDate.formatDate('2026-07-31', 'zh-CN'), '2026年7月31日');
  assert.equal(KHGDate.formatMonth('2026-07', 'zh-CN'), '2026年7月');
  assert.equal(KHGDate.formatDate('', 'en-US'), '—');
  assert.equal(KHGDate.formatMonth('bad-value', 'zh-CN'), '—');
});

test('all transaction UIs use the shared locale-aware date formatter', () => {
  for (const file of affectedScripts) {
    const js = fs.readFileSync(file, 'utf8');
    assert.match(js, /KHGDate\./, file);
    assert.doesNotMatch(js, /\$\{item\.contractDate\s*\|\|/, file);
  }
  const enBuilding = fs.readFileSync('explore/building/app.js', 'utf8');
  const zhBuilding = fs.readFileSync('zh/explore/building/app.js', 'utf8');
  assert.doesNotMatch(enBuilding, /point\.month\.slice\(5\)/);
  assert.doesNotMatch(zhBuilding, /point\.month\.slice\(5\)/);
});

test('pages that render transaction dates load date-utils before their app script', () => {
  const pages = [
    ['index.html', '/app.js'],
    ['zh/index.html', '/zh/app.js'],
    ['explore/index.html', '/explore/app.js'],
    ['zh/explore/index.html', '/zh/explore/app.js'],
    ['explore/building/index.html', '/explore/building/app.js'],
    ['zh/explore/building/index.html', '/zh/explore/building/app.js'],
    ['tools/seoul-rent-check/index.html', '/tools/seoul-rent-check/app.js'],
    ['zh/tools/seoul-rent-check/index.html', '/zh/tools/seoul-rent-check/app.js']
  ];
  for (const [file, appSrc] of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const datePos = html.indexOf('<script src="/date-utils.js"></script>');
    const appPos = html.indexOf(`<script src="${appSrc}"></script>`);
    assert.ok(datePos >= 0, `${file} loads date-utils`);
    assert.ok(appPos > datePos, `${file} loads date-utils before app`);
  }

  for (const root of ['rent', 'zh/rent']) {
    const files = [];
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(full);
        else if (entry.name === 'index.html') files.push(full);
      }
    };
    walk(root);
    const expectedPages = root === 'rent' ? 30 : 15;
    assert.equal(files.length, expectedPages, `${root} has ${expectedPages} market pages`);
    for (const file of files) {
      const html = fs.readFileSync(file, 'utf8');
      const datePos = html.indexOf('<script src="/date-utils.js"></script>');
      const runtime = root.startsWith('zh/') ? '/zh/rent-market-page.js' : '/rent-market-page.js';
      const appPos = html.indexOf(`<script src="${runtime}"></script>`);
      assert.ok(datePos >= 0, `${file} loads date-utils`);
      assert.ok(appPos > datePos, `${file} loads date-utils before market runtime`);
    }
  }
});
