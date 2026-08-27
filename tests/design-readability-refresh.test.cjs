const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('core Chinese heroes use a CJK-safe size, weight, spacing, and mobile scale', () => {
  const css = fs.readFileSync('styles.css','utf8');
  assert.match(css, /html\[lang="zh-CN"\] \.core-ui \.funnel-hero h1[^\{]*\{[^}]*font-size:clamp\(42px,4\.6vw,52px\)[^}]*font-weight:700[^}]*line-height:1\.14/);
  assert.match(css, /html\[lang="zh-CN"\] \.core-ui h1,html\[lang="zh-CN"\] \.core-ui h2,html\[lang="zh-CN"\] \.core-ui h3\{letter-spacing:-\.012em\}/);
  assert.match(css, /@media\(max-width:760px\)[^]*html\[lang="zh-CN"\] \.core-ui \.funnel-hero h1[^\{]*\{[^}]*font-size:clamp\(34px,9\.5vw,40px\)/);
});

test('core actions stay blue while map status colors retain accessible semantic contrast', () => {
  const css = fs.readFileSync('styles.css','utf8');
  const map = fs.readFileSync('explore/map-controller.js','utf8');
  assert.match(css, /--accent:#2563eb/);
  assert.match(css, /\.site-header\{[^}]*background:rgba\(255,255,255/);
  assert.match(css, /\.explorer-map-legend i\.is-limited\{[^}]*#b45309/);
  assert.match(css, /\.explorer-map-legend i\.is-outside\{[^}]*#64748b/);
  assert.match(map, /limited:'[^']*#b45309/);
  assert.match(map, /outside:'[^']*#64748b/);
});
