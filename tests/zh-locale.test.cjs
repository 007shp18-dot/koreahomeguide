const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('English page advertises the Chinese alternate and sitemap lists /zh/', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  assert.match(html, /hreflang="zh-CN"[^>]+https:\/\/koreahomeguide\.com\/zh\//);
  assert.match(html, /href="\/zh\/"[^>]*>中文</);
  assert.match(sitemap, /<loc>https:\/\/koreahomeguide\.com\/zh\/<\/loc>/);
});

test('Chinese page has localized metadata, GA4, and language switch', () => {
  assert.ok(fs.existsSync('zh/index.html'));
  const html = fs.readFileSync('zh/index.html', 'utf8');
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/zh\/"/);
  assert.match(html, /hreflang="en"[^>]+https:\/\/koreahomeguide\.com\//);
  assert.match(html, /hreflang="zh-CN"[^>]+https:\/\/koreahomeguide\.com\/zh\//);
  assert.match(html, /G-6SXH5BREDP/);
  assert.match(html, /检查这个租金/);
  assert.match(html, /href="\/"[^>]*>EN</);
  assert.match(html, /月租（Wolse）/);
  assert.match(html, /全租（Jeonse）/);
});

test('Chinese runtime localizes dynamic Rent Check and data statuses', () => {
  assert.ok(fs.existsSync('zh/app.js'));
  assert.ok(fs.existsSync('zh/rent-check-ui-utils.js'));
  const app = fs.readFileSync('zh/app.js', 'utf8');
  const ui = fs.readFileSync('zh/rent-check-ui-utils.js', 'utf8');
  assert.match(app, /正在查找类似的官方成交记录/);
  assert.match(app, /已加载/);
  assert.match(app, /window\.location\.href = `\/zh\/explore\/\?/);
  assert.match(ui, /above:\s*'高于近期成交水平'/);
  assert.match(ui, /fair:\s*'价格合理'/);
  assert.match(ui, /可信度高/);
});
