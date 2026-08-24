const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('Chinese Rent Explorer pages exist with Chinese locale and reciprocal hreflang', () => {
  const explorer = read('zh/explore/index.html');
  const building = read('zh/explore/building/index.html');
  assert.match(explorer, /<html lang="zh-CN">/);
  assert.match(explorer, /hreflang="en" href="https:\/\/koreahomeguide\.com\/explore\/"/);
  assert.match(explorer, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/explore\/"/);
  assert.match(explorer, /首尔租金探索/);
  assert.match(building, /<html lang="zh-CN">/);
  assert.match(building, /建筑租金数据/);
});

test('Chinese explorer uses Chinese UI scripts and links building details inside zh path', () => {
  const explorer = read('zh/explore/index.html');
  const app = read('zh/explore/app.js');
  assert.match(explorer, /src="\/zh\/explore\/app\.js"/);
  assert.match(app, /\/zh\/explore\/building\//);
  assert.match(app, /查看建筑/);
  assert.match(app, /没有实时房源/);
});

test('Chinese building page keeps the flow inside Chinese Rent Check and preserves query for language switching', () => {
  const html = read('zh/explore/building/index.html');
  const app = read('zh/explore/building/app.js');
  assert.match(html, /id="languageSwitch"/);
  assert.match(app, /\/zh\/tools\/seoul-rent-check\//);
  assert.match(app, /\/explore\/building\//);
  assert.match(app, /languageSwitch\.href/);
  assert.match(app, /检查这个租金/);
});

test('sitemap indexes Chinese Rent Explorer but not query-string building detail pages', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/zh\/explore\//);
  assert.doesNotMatch(sitemap, /explore\/building\//);
});

test('English explorer language links point to matching Chinese explorer pages', () => {
  const explorer = read('explore/index.html');
  const building = read('explore/building/index.html');
  assert.match(explorer, /href="\/zh\/explore\/"[^>]*>中文/);
  assert.match(building, /id="languageSwitch"[^>]*href="\/zh\/explore\/building\/"/);
});

test('Chinese Rent Check loads the shared prefill parser and applies explorer query values', () => {
  const html = read('zh/tools/seoul-rent-check/index.html');
  const app = read('zh/tools/seoul-rent-check/app.js');
  assert.match(html, /src="\/tools\/seoul-rent-check\/prefill-utils\.js"/);
  assert.match(app, /function applyExplorerPrefill\(/);
  assert.match(app, /readRentCheckPrefill\(location\.search\)/);
  assert.match(app, /applyExplorerPrefill\(\)/);
});
