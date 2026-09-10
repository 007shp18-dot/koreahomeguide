const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const core = require('../lib/rent-check-core.cjs');
const enUI = require('../rent-check-ui-utils.js');
const zhUI = require('../zh/rent-check-ui-utils.js');

function rentalItem({ rent, date, contractType = '신규' }) {
  return {
    building:'Sample',
    area:'25',
    deposit:'1000',
    monthlyRent:String(rent),
    contractDate:date,
    type:'apartment',
    contractType
  };
}

const quote = {
  depositWon:10_000_000,
  rentWon:950_000,
  areaSqm:25,
  propertyType:'apartment',
  referenceDate:new Date('2026-08-25T00:00:00Z')
};

const tier1 = core.TIERS[0];
const reliableItems = [
  rentalItem({ rent:70, date:'2026-07-03' }),
  rentalItem({ rent:80, date:'2026-07-10' }),
  rentalItem({ rent:90, date:'2026-06-12' }),
  rentalItem({ rent:100, date:'2026-06-20' }),
  rentalItem({ rent:110, date:'2026-05-08' })
];

test('percentile uses linear interpolation and percentile rank is empirical <= asking share', () => {
  assert.equal(core.percentile([100, 200, 300, 400], 0.25), 175);
  assert.equal(core.percentile([100, 200, 300, 400], 0.75), 325);
  assert.equal(core.percentileRank([100, 200, 300, 400], 300), 75);
});

test('monthly-rent comparison converts each comparable to the entered deposit level', () => {
  assert.equal(core.DEPOSIT_CONVERSION_REFERENCE.annualRate, 0.05);
  assert.equal(core.DEPOSIT_CONVERSION_REFERENCE.asOf, '2026-08-27');
  assert.equal(
    core.monthlyRentAtDeposit(900_000, 12_000_000, 10_000_000),
    908_333.3333333334
  );
  assert.equal(
    core.monthlyRentAtDeposit(900_000, 8_000_000, 10_000_000),
    891_666.6666666666
  );
});

test('monthly-rent verdict reflects deposit differences inside the comparable band', () => {
  const items = [10_000_000, 10_500_000, 11_000_000, 11_500_000, 12_000_000].map((depositWon, index) => ({
    building:`Deposit ${index + 1}`,
    area:'25',
    deposit:String(depositWon / 10_000),
    monthlyRent:'90',
    contractDate:['2026-07-03','2026-07-10','2026-06-12','2026-06-20','2026-05-08'][index],
    type:'apartment',
    contractType:'신규'
  }));
  const result = core.buildResultForTier(items, { ...quote, rentWon:902_000 }, tier1);

  assert.equal(result.rating, 'below');
  assert.equal(result.comparisonMode, 'monthly-rent');
  assert.equal(result.comparisonBasis, 'deposit-adjusted-monthly-rent');
  assert.equal(result.conversionAnnualRate, 0.05);
  assert.equal(result.p25ValueWon, 902_083.3333333334);
  assert.equal(result.medianValueWon, 904_166.6666666666);
  assert.equal(result.p75ValueWon, 906_250);
});

test('non-positive deposit-adjusted rents are excluded before checking sample sufficiency', () => {
  const items = [75_000_000, 80_000_000, 100_000_000, 120_000_000, 125_000_000].map((depositWon, index) => ({
    building:`Low rent ${index + 1}`,
    area:'25',
    deposit:String(depositWon / 10_000),
    monthlyRent:'5',
    contractDate:['2026-07-03','2026-07-10','2026-06-12','2026-06-20','2026-05-08'][index],
    type:'apartment',
    contractType:'신규'
  }));
  const result = core.buildResultForTier(items, {
    ...quote,
    depositWon:100_000_000,
    rentWon:50_000
  }, tier1);

  assert.equal(result.rating, 'insufficient');
  assert.equal(result.comparableCount, 3);
  assert.equal(result.p25ValueWon, null);
  assert.equal(result.verdictBasis, null);
});

test('reliable Rent Check result returns P25, median, P75 and quote percentile from the same comparable set', () => {
  const result = core.buildResultForTier(reliableItems, quote, tier1);
  assert.equal(result.rating, 'fair');
  assert.equal(result.verdictBasis, 'typical-range');
  assert.equal(result.comparableCount, 5);
  assert.equal(result.minValueWon, 700_000);
  assert.equal(result.p25ValueWon, 800_000);
  assert.equal(result.medianValueWon, 900_000);
  assert.equal(result.p75ValueWon, 1_000_000);
  assert.equal(result.maxValueWon, 1_100_000);
  assert.equal(result.percentileRank, 60);
});

test('a reliable verdict follows the displayed P25-P75 typical range including its boundaries', () => {
  assert.equal(core.buildResultForTier(reliableItems, { ...quote, rentWon:700_000 }, tier1).rating, 'below');
  assert.equal(core.buildResultForTier(reliableItems, { ...quote, rentWon:800_000 }, tier1).rating, 'fair');
  assert.equal(core.buildResultForTier(reliableItems, { ...quote, rentWon:1_000_000 }, tier1).rating, 'fair');
  assert.equal(core.buildResultForTier(reliableItems, { ...quote, rentWon:1_100_000 }, tier1).rating, 'above');
});

test('insufficient result never exposes distribution intelligence', () => {
  const result = core.buildResultForTier(reliableItems.slice(0, 2), quote, tier1);
  assert.equal(result.rating, 'insufficient');
  assert.equal(result.verdictBasis, null);
  assert.equal(result.minValueWon, null);
  assert.equal(result.p25ValueWon, null);
  assert.equal(result.p75ValueWon, null);
  assert.equal(result.maxValueWon, null);
  assert.equal(result.percentileRank, null);
});

test('a low-confidence three-comparable verdict hides distribution intelligence', () => {
  const result = core.buildResultForTier(reliableItems.slice(0, 3), quote, core.TIERS[2]);
  assert.notEqual(result.rating, 'insufficient');
  assert.equal(result.verdictBasis, 'median-fallback');
  assert.equal(result.minValueWon, null);
  assert.equal(result.p25ValueWon, null);
  assert.equal(result.p75ValueWon, null);
  assert.equal(result.maxValueWon, null);
  assert.equal(result.percentileRank, null);
  assert.equal(enUI.hasDistribution(result), false);
  assert.equal(zhUI.hasDistribution(result), false);
});

test('three-to-four comparable fallback keeps the median plus/minus 10 percent threshold', () => {
  assert.equal(core.rateDifference(-10), 'below');
  assert.equal(core.rateDifference(-9.9), 'fair');
  assert.equal(core.rateDifference(9.9), 'fair');
  assert.equal(core.rateDifference(10), 'above');

  const fallback = core.buildResultForTier(reliableItems.slice(0, 3), quote, core.TIERS[2]);
  assert.equal(fallback.rating, 'above');
  assert.equal(fallback.verdictBasis, 'median-fallback');
});

test('EN and ZH helpers provide localized percentile wording and hide it for insufficient data', () => {
  const distribution = { rating:'fair', p25ValueWon:800_000, p75ValueWon:1_000_000, percentileRank:60 };
  assert.equal(enUI.percentileSentence(distribution), 'This quote is around the 60th percentile of comparable signed contracts.');
  assert.equal(enUI.percentileSentence({ rating:'insufficient', percentileRank:null }), '');
  assert.equal(zhUI.percentileSentence(distribution), '这个报价约处于可比已签约成交的第 60 百分位。');
  assert.equal(zhUI.percentileSentence({ rating:'insufficient', percentileRank:null }), '');
});

test('extreme percentile wording avoids false precision when comparable values tie', () => {
  const range = { rating:'above', p25ValueWon:800_000, p75ValueWon:1_000_000, percentileRank:100 };
  assert.equal(
    enUI.percentileSentence(range),
    'This quote is at or near the top of this comparable set.'
  );
  assert.equal(
    zhUI.percentileSentence(range),
    '这个报价处于或接近这组可比成交的最高水平。'
  );
});

test('EN and ZH apps create and render the compact comparable distribution', () => {
  const en = fs.readFileSync('tools/seoul-rent-check/app.js','utf8');
  const zh = fs.readFileSync('zh/tools/seoul-rent-check/app.js','utf8');
  for (const source of [en, zh]) {
    assert.match(source, /rentCheckDistribution/);
    assert.match(source, /rent-check-market-position/);
    assert.match(source, /data-market-p25/);
    assert.match(source, /data-market-median/);
    assert.match(source, /data-market-p75/);
    assert.match(source, /KHGRentCheckUI\.distributionModel\(data\)/);
    assert.match(source, /distribution\.hidden/);
  }
});

test('English percentile wording uses correct ordinal suffixes and jeonse wording', () => {
  const range = { p25ValueWon:800_000, p75ValueWon:1_000_000 };
  assert.equal(enUI.percentileSentence({ ...range, rating:'below', percentileRank:1, comparisonMode:'monthly-rent' }), 'This quote is around the 1st percentile of comparable signed contracts.');
  assert.equal(enUI.percentileSentence({ ...range, rating:'above', percentileRank:22, comparisonMode:'jeonse-deposit' }), 'This jeonse deposit is around the 22nd percentile of comparable signed contracts.');
});

test('jeonse intelligence derives percentiles from deposit values, not zero monthly rent', () => {
  const items = [
    { building:'J1', area:'25', deposit:'8000', monthlyRent:'0', contractDate:'2026-07-03', type:'apartment', contractType:'신규' },
    { building:'J2', area:'25', deposit:'9000', monthlyRent:'0', contractDate:'2026-07-10', type:'apartment', contractType:'신규' },
    { building:'J3', area:'25', deposit:'10000', monthlyRent:'0', contractDate:'2026-06-12', type:'apartment', contractType:'신규' },
    { building:'J4', area:'25', deposit:'11000', monthlyRent:'0', contractDate:'2026-06-20', type:'apartment', contractType:'신규' },
    { building:'J5', area:'25', deposit:'12000', monthlyRent:'0', contractDate:'2026-05-08', type:'apartment', contractType:'신규' }
  ];
  const result = core.buildResultForTier(items, { ...quote, depositWon:105_000_000, rentWon:0 }, tier1);
  assert.equal(result.comparisonMode, 'jeonse-deposit');
  assert.equal(result.p25ValueWon, 90_000_000);
  assert.equal(result.medianValueWon, 100_000_000);
  assert.equal(result.p75ValueWon, 110_000_000);
  assert.equal(result.percentileRank, 60);
});
