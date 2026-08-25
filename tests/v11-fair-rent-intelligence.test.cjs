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

test('reliable Rent Check result returns P25, median, P75 and quote percentile from the same comparable set', () => {
  const result = core.buildResultForTier(reliableItems, quote, tier1);
  assert.equal(result.rating, 'fair');
  assert.equal(result.comparableCount, 5);
  assert.equal(result.p25ValueWon, 800_000);
  assert.equal(result.medianValueWon, 900_000);
  assert.equal(result.p75ValueWon, 1_000_000);
  assert.equal(result.percentileRank, 60);
});

test('insufficient result never exposes distribution intelligence', () => {
  const result = core.buildResultForTier(reliableItems.slice(0, 2), quote, tier1);
  assert.equal(result.rating, 'insufficient');
  assert.equal(result.p25ValueWon, null);
  assert.equal(result.p75ValueWon, null);
  assert.equal(result.percentileRank, null);
});

test('existing verdict threshold stays unchanged at plus/minus 10 percent', () => {
  assert.equal(core.rateDifference(-10), 'below');
  assert.equal(core.rateDifference(-9.9), 'fair');
  assert.equal(core.rateDifference(9.9), 'fair');
  assert.equal(core.rateDifference(10), 'above');
});

test('EN and ZH helpers provide localized percentile wording and hide it for insufficient data', () => {
  assert.equal(enUI.percentileSentence({ rating:'fair', percentileRank:60 }), 'This quote is around the 60th percentile of comparable signed contracts.');
  assert.equal(enUI.percentileSentence({ rating:'insufficient', percentileRank:null }), '');
  assert.equal(zhUI.percentileSentence({ rating:'fair', percentileRank:60 }), '这个报价约处于可比已签约成交的第 60 百分位。');
  assert.equal(zhUI.percentileSentence({ rating:'insufficient', percentileRank:null }), '');
});

test('EN and ZH apps create and render the Fair Rent Intelligence distribution panel', () => {
  const en = fs.readFileSync('tools/seoul-rent-check/app.js','utf8');
  const zh = fs.readFileSync('zh/tools/seoul-rent-check/app.js','utf8');
  for (const source of [en, zh]) {
    assert.match(source, /rentCheckDistribution/);
    assert.match(source, /rentCheckRange/);
    assert.match(source, /rentCheckPercentile/);
    assert.match(source, /p25ValueWon/);
    assert.match(source, /p75ValueWon/);
    assert.match(source, /percentileRank/);
    assert.match(source, /distribution\.hidden/);
  }
});

test('English percentile wording uses correct ordinal suffixes and jeonse wording', () => {
  assert.equal(enUI.percentileSentence({ rating:'below', percentileRank:1, comparisonMode:'monthly-rent' }), 'This quote is around the 1st percentile of comparable signed contracts.');
  assert.equal(enUI.percentileSentence({ rating:'above', percentileRank:22, comparisonMode:'jeonse-deposit' }), 'This jeonse deposit is around the 22nd percentile of comparable signed contracts.');
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
