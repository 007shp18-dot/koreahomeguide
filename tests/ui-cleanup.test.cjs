const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  renderBuildingPage
} = require('../seo/seo-page-renderer.cjs');

const read = rel => fs.readFileSync(require('node:path').join(__dirname, '..', rel), 'utf8');

function buildingFixture(lang='en') {
  const detail = {
    buildingName:'Twin Villa', buildingKey:'연남동::twin villa', dong:'연남동', contractCount:8,
    medianMonthlyRentWon:650000, medianDepositWon:20000000, typicalAreaSqm:24.1,
    monthlyTrend:[{month:'2026-06',count:3,medianMonthlyRentWon:630000},{month:'2026-07',count:5,medianMonthlyRentWon:650000}],
    recentTransactions:[{contractDate:'2026-07-30',areaSqm:24.1,depositWon:20000000,monthlyRentWon:650000}]
  };
  return {
    lang, areaCode:'11440', districtName:'Mapo-gu', dong:'연남동', propertyType:'villa',
    summary:{ medianMonthlyRentWon:700000 }, detail, fxRates:{USD:0.00072,CNY:0.0052}
  };
}

test('homepage prioritizes one simple Find a Home action and trims primary navigation', () => {
  const html = read('index.html');
  assert.match(html, /Find a home in Seoul with real rent data\./);
  assert.match(html, /<nav[^>]*>[\s\S]*Explore[\s\S]*Rent Check[\s\S]*Guides[\s\S]*<\/nav>/);
  assert.doesNotMatch(html, /<nav[^>]*>[\s\S]*Real Prices[\s\S]*<\/nav>/);
  assert.doesNotMatch(html, /<nav[^>]*>[\s\S]*Calculator[\s\S]*<\/nav>/);
  assert.match(html, /class="advanced-filter"/);
  assert.match(html, /Deposit budget \(optional\)/);
});

test('Chinese homepage mirrors the simplified navigation and optional deposit filter', () => {
  const html = read('zh/index.html');
  assert.match(html, /用真实租金数据，在首尔找到适合你的家/);
  assert.match(html, /class="advanced-filter"/);
  assert.match(html, /押金预算（可选）/);
  assert.doesNotMatch(html, /<nav[^>]*>[\s\S]*官方租金数据[\s\S]*<\/nav>/);
  assert.doesNotMatch(html, /<nav[^>]*>[\s\S]*计算器[\s\S]*<\/nav>/);
});

test('Explorer presents neighborhoods as the primary result cards instead of a building table by default', () => {
  const html = read('explore/index.html');
  const app = read('explore/app.js');
  assert.match(html, /Compare neighborhoods/);
  assert.match(html, /id="dongList"/);
  assert.match(app, /class="neighborhood-card/);
  assert.match(app, /View neighborhood/);
  assert.doesNotMatch(app, /class="dong-chip-wrap"/);
  assert.match(html, /class="building-section"[^>]*hidden/);
});

test('Chinese Explorer uses the same neighborhood-first result pattern', () => {
  const html = read('zh/explore/index.html');
  const app = read('zh/explore/app.js');
  assert.match(html, /比较街区/);
  assert.match(app, /class="neighborhood-card/);
  assert.match(app, /查看街区/);
  assert.match(html, /class="building-section"[^>]*hidden/);
});

test('building page puts the four core metrics and rent-check CTA before deeper data sections', () => {
  const html = renderBuildingPage(buildingFixture('en'));
  assert.match(html, /class="seo-building-hero"/);
  assert.match(html, /Typical monthly rent/);
  assert.match(html, /Typical deposit/);
  assert.match(html, /Typical size/);
  assert.match(html, /Recent contracts/);
  assert.match(html, /class="seo-action primary"[^>]*>Check a rent quote<\/a>/);
  assert.match(html, /href="#rent-trend"/);
  assert.match(html, /href="#recent-contracts"/);
  assert.ok(html.indexOf('Check a rent quote') < html.indexOf('id="rent-trend"'));
  assert.ok(html.indexOf('Check a rent quote') < html.indexOf('id="recent-contracts"'));
});

test('Chinese building page keeps the same hierarchy with localized CTA', () => {
  const html = renderBuildingPage(buildingFixture('zh'));
  assert.match(html, /class="seo-building-hero"/);
  assert.match(html, /典型月租/);
  assert.match(html, /典型押金/);
  assert.match(html, /典型面积/);
  assert.match(html, /近期成交/);
  assert.match(html, />检查租金报价<\/a>/);
});
