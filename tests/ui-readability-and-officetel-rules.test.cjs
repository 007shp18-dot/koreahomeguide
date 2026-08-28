const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { calculateBrokerageFee } = require('../brokerage-utils.js');
const { renderDongPage } = require('../seo/seo-page-renderer.cjs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('qualifying residential-facility officetel uses 0.4% without the housing KRW 300,000 cap', () => {
  const fee = calculateBrokerageFee({
    propertyType: 'officetel',
    depositWon: 10_000_000,
    monthlyRentWon: 800_000,
  });

  assert.deepEqual(fee, {
    transactionValueWon: 90_000_000,
    maxRate: 0.004,
    capWon: null,
    maxFeeWon: 360_000,
  });
});

test('officetel outside the 85 sqm and residential-facility rule uses the negotiable 0.9% ceiling', () => {
  const fee = calculateBrokerageFee({
    propertyType: 'officetel-other',
    depositWon: 10_000_000,
    monthlyRentWon: 800_000,
  });

  assert.deepEqual(fee, {
    transactionValueWon: 90_000_000,
    maxRate: 0.009,
    capWon: null,
    maxFeeWon: 810_000,
  });
});

test('English and Chinese calculators expose both officetel legal branches', () => {
  const en = read('tools/brokerage-fee-calculator/index.html');
  const zh = read('zh/tools/brokerage-fee-calculator/index.html');

  assert.match(en, /value="officetel">Officetel \(오피스텔\) ≤85㎡ \+ required residential facilities/);
  assert.match(en, /value="officetel-other">Officetel outside those requirements — up to 0\.9%/);
  assert.match(zh, /value="officetel">Officetel（오피스텔）≤85㎡ \+ 必备住宅设施/);
  assert.match(zh, /value="officetel-other">不符合上述条件的 Officetel — 最高 0\.9%/);
});

test('homepage Rent Check gives area and housing-type selectors dedicated width hooks', () => {
  const html = read('index.html');
  assert.match(html, /class="field rent-check-area-field"[^>]*><span>Area<\/span>/);
  assert.match(html, /class="field rent-check-property-field"[^>]*><span>Housing type<\/span>/);
});

test('homepage Rent Check submit action keeps the shared full-height button rule', () => {
  const css = read('styles.css');
  assert.match(
    css,
    /\.rent-check-form \.search-button\{[^}]*height:52px/
  );
});

test('Dong building rows render name, metadata, deposit, and monthly rent as separate readable groups', () => {
  const html = renderDongPage({
    lang: 'en',
    areaCode: '11680',
    districtName: 'Gangnam-gu',
    dong: '역삼동',
    propertyType: 'officetel',
    fxRates: { USD: 0.00072 },
    summary: {
      dataThroughMonth: '2026-07',
      totalContracts: 16,
      newContractMonthlyRentCount: 12,
      renewalMonthlyRentCount: 2,
      medianJeonseDepositWon: 200_000_000,
      depositBands: [],
      areaGroups: [],
      contractTypeCounts: {},
      recentTransactions: [],
    },
    buildings: [{
      buildingName: '강남 IBC 오피스텔',
      buildingKey: '역삼동::강남 ibc 오피스텔',
      contractCount: 15,
      typicalAreaSqm: 27.9,
      depositBands: [{
        minDepositWon: 10_000_000,
        maxDepositWon: 30_000_000,
        count: 15,
        medianMonthlyRentWon: 970_000,
      }],
    }],
  });

  assert.match(html, /class="seo-building-main"/);
  assert.match(html, /class="seo-building-meta"/);
  assert.match(html, /class="seo-building-price-context"/);
  assert.match(html, /class="seo-context-label">Deposit<\/span>/);
  assert.match(html, /class="seo-context-label">Monthly rent<\/span>/);
});
