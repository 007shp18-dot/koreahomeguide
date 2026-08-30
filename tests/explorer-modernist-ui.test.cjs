const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('both Explorer locales load the scoped Modernist layer after legacy styles', () => {
  for (const file of ['explore/index.html', 'zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    const legacy = html.indexOf('/styles.css?v=');
    const modernist = html.indexOf('/explore/explore-modernist.css?v=1');
    assert.ok(legacy >= 0, `${file} keeps the shared stylesheet`);
    assert.ok(modernist > legacy, `${file} loads the scoped override last`);
    assert.match(html, /family=Instrument\+Sans/);
    assert.match(html, /pretendardvariable-dynamic-subset\.css/);
    assert.match(html, /id="explorerMap"[^>]*role="application"/);
  }
});

test('Modernist Explorer uses the approved type stack and low-card geometry', () => {
  const css = fs.readFileSync('explore/explore-modernist.css', 'utf8');
  assert.match(css, /--kg-font-latin:\s*"Instrument Sans"/);
  assert.match(css, /--kg-font-korean:\s*"Pretendard Variable"/);
  assert.match(css, /--kg-font-chinese:\s*"Noto Sans SC"/);
  assert.match(css, /--kg-a5:\s*#1d4ed8/);
  assert.match(css, /\.map-first-workspace \.explorer-discovery-rail\{[^}]*right:0[^}]*width:380px[^}]*border-radius:0/);
  assert.match(css, /\.district-card\{[^}]*border-radius:0[^}]*box-shadow:none/);
  assert.match(css, /\.building-status-window\{[^}]*border-radius:0/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.map-first-workspace \.explorer-discovery-rail\{[^}]*max-height:64dvh/);
});

test('district presentation exposes an explicit insufficient-evidence state', () => {
  const app = fs.readFileSync('explore/app.js', 'utf8');
  const map = fs.readFileSync('explore/map.js', 'utf8');
  assert.match(app, /data-evidence="\$\{KHGExplorerDistrictMap\.evidenceState\(row\)\}"/);
  assert.match(map, /badge\.dataset\.evidence = KHGExplorerDistrictMap\.evidenceState\(row\)/);
  assert.match(map, /badge\.addEventListener\('click', selectDistrict\)/);
  assert.match(map, /Not shown/);
});
