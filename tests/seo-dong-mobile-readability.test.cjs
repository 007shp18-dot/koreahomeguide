const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderDongPage } = require('../seo/seo-page-renderer.cjs');

const summary = {
  totalContracts: 24,
  medianMonthlyRentWon: 1_200_000,
  medianDepositWon: 50_000_000,
  typicalAreaSqm: 59.8,
  dataThroughMonth: '2026-07',
  depositBands: [],
  areaGroups: [],
  contractTypeCounts: {},
  recentTransactions: [],
};

const buildings = [{
  buildingName: '신길센트럴자이',
  buildingKey: '신길동::신길센트럴자이',
  contractCount: 17,
  monthlyRentCount: 12,
  typicalAreaSqm: 59.8,
  depositBands: [],
}];

function render(lang = 'en') {
  return renderDongPage({
    lang,
    areaCode: '11560',
    districtName: 'Yeongdeungpo-gu',
    dong: '신길동',
    propertyType: 'apartment',
    summary,
    buildings,
    fxRates: {},
  });
}

test('Dong hero keeps the visible mobile heading short and moves context below it', () => {
  const en = render('en');
  const zh = render('zh');

  assert.match(en, /<h1>Apartment rents in Singil-dong<\/h1>/);
  assert.match(en, /class="seo-location-meta"[^>]*><span>신길동<\/span><span>Yeongdeungpo-gu<\/span>/);
  assert.doesNotMatch(en, /<h1>[^<]*\(신길동\)[^<]*Apartment[^<]*Rent Market<\/h1>/);

  assert.match(zh, /<h1>Singil-dong 公寓租金<\/h1>/);
  assert.match(zh, /class="seo-location-meta"[^>]*><span>신길동<\/span><span>永登浦区<\/span>/);
});

test('Dong building section avoids repeating the long bilingual location in its heading', () => {
  assert.match(render('en'), /<section class="seo-section"><h2>Buildings<\/h2>/);
  assert.match(render('zh'), /<section class="seo-section"><h2>建筑<\/h2>/);
});

test('building area and contract count are rendered as stable labeled columns', () => {
  const en = render('en');
  assert.match(en, /class="seo-building-meta"><span><small>Typical size<\/small><strong>59\.8㎡<\/strong><\/span><span><small>Contracts<\/small><strong>17<\/strong><\/span><\/div>/);
});

test('mobile CSS keeps Dong metrics in two columns and avoids arbitrary heading breaks', () => {
  const html = render('en');
  const css = fs.readFileSync('styles.css', 'utf8');

  assert.match(html, /@media\(max-width:420px\)\{\.seo-grid:not\(\.seo-dong-core-metrics\):not\(\.seo-core-metrics\)\{grid-template-columns:1fr\}/);
  assert.match(css, /\.seo-page\.product-layout \.seo-hero h1\{[^}]*overflow-wrap:normal[^}]*word-break:normal/);
  assert.match(css, /\.seo-page\.product-layout \.seo-building-meta\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
