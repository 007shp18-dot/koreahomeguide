const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const names = require('../building-name-utils.js');

function read(rel) { return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'); }

test('safe building display preserves Korean official name and uses known English brand/location names', () => {
  const value = names.getBuildingNameDisplay('마포래미안푸르지오', 'en');
  assert.equal(value.primary, 'Mapo Raemian Prugio');
  assert.equal(value.secondary, '마포래미안푸르지오');
  assert.equal(value.officialNameKo, '마포래미안푸르지오');
});

test('Chinese display uses the same safe non-translated Latin building name and preserves Korean official name', () => {
  const value = names.getBuildingNameDisplay('강남롯데캐슬', 'zh');
  assert.equal(value.primary, 'Gangnam Lotte Castle');
  assert.equal(value.secondary, '강남롯데캐슬');
});

test('unknown Korean building names are never meaning-translated or guessed', () => {
  const value = names.getBuildingNameDisplay('청운빌라', 'en');
  assert.equal(value.primary, '청운빌라');
  assert.equal(value.secondary, '');
});

test('already Latin building names remain unchanged without duplicate secondary labels', () => {
  const value = names.getBuildingNameDisplay('Gangnam Prugio City', 'en');
  assert.equal(value.primary, 'Gangnam Prugio City');
  assert.equal(value.secondary, '');
});

test('provider building summaries expose official and locale display names while retaining buildingName compatibility', () => {
  const provider = read('providers/provider-utils.cjs');
  assert.match(provider, /displayBuildingNameEn/);
  assert.match(provider, /displayBuildingNameZh/);
  assert.match(provider, /officialBuildingNameKo/);
});

test('explorer and building pages load shared building name display helper', () => {
  for (const rel of ['explore/index.html','zh/explore/index.html','explore/building/index.html','zh/explore/building/index.html']) {
    assert.match(read(rel), /\/building-name-utils\.js/);
  }
  assert.match(read('explore/app.js'), /getBuildingNameDisplay/);
  assert.match(read('zh/explore/app.js'), /getBuildingNameDisplay/);
  assert.match(read('explore/building/app.js'), /buildingOfficialName/);
  assert.match(read('zh/explore/building/app.js'), /buildingOfficialName/);
});

test('SEO renderer uses localized safe display name but retains the Korean official name', () => {
  const renderer = read('seo/seo-page-renderer.cjs');
  assert.match(renderer, /getBuildingNameDisplay/);
  assert.match(renderer, /seo-building-official/);
});

test('official rent market tables use the same localized building-name display rule', () => {
  assert.match(read('rent-market-page.js'), /getBuildingNameDisplay/);
  assert.match(read('zh/rent-market-page.js'), /getBuildingNameDisplay/);
  assert.match(read('rent/mapo-gu/apartment/index.html'), /\/building-name-utils\.js/);
  assert.match(read('zh/rent/mapo-gu/apartment/index.html'), /\/building-name-utils\.js/);
});
