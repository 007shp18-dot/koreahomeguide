const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('English page advertises the Chinese alternate and sitemap lists /zh/', () => {
  const html=fs.readFileSync('index.html','utf8'); const sitemap=fs.readFileSync('sitemap-static.xml','utf8');
  assert.match(html,/hreflang="zh-CN"[^>]+https:\/\/koreahomeguide\.com\/zh\//);
  assert.match(html,/href="\/zh\/"[^>]*>中文</);
  assert.match(sitemap,/<loc>https:\/\/koreahomeguide\.com\/zh\/<\/loc>/);
});

test('Chinese cold-start page has localized metadata, consent-first analytics, language switch, and rental terminology', () => {
  const html=fs.readFileSync('zh/index.html','utf8');
  assert.match(html,/<html lang="zh-CN">/);
  assert.match(html,/<link rel="canonical" href="https:\/\/koreahomeguide\.com\/zh\/"/);
  assert.match(html,/hreflang="en"[^>]+https:\/\/koreahomeguide\.com\//);
  assert.match(html,/<script defer src="\/privacy-consent\.js"><\/script>/);
  assert.match(html,/检查这个租金/);
  assert.match(html,/href="\/"[^>]*>EN</);
  assert.match(html,/月租（Wolse）/);
  assert.match(html,/全租（Jeonse）/);
  assert.match(html,/data-lead-capture/);
});

test('Chinese runtime localizes Rent Check and emits the shared funnel event', () => {
  const app=fs.readFileSync('app.js','utf8'); const ui=fs.readFileSync('zh/rent-check-ui-utils.js','utf8');
  assert.match(app,/正在查找类似的官方成交记录/);
  assert.match(app,/khg:rent-check-result/);
  assert.match(app,/rent_check_start/);
  assert.match(app,/rent_check_result/);
  assert.match(ui,/above:\s*'高于近期成交水平'/);
  assert.match(ui,/fair:\s*'典型区间'/);
  assert.match(ui,/high:\s*'样本充分'/);
});
