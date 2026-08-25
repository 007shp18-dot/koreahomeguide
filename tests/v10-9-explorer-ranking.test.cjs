const test = require('node:test');
const assert = require('node:assert/strict');
const Explorer = require('../explore/explorer-utils.js');

const neighborhoods = [
  {
    dong:'A동', contractCount:20,
    depositBands:[
      { medianMonthlyRentWon:700000, medianDepositWon:10000000, count:2 }
    ]
  },
  {
    dong:'B동', contractCount:18,
    depositBands:[
      { medianMonthlyRentWon:780000, medianDepositWon:10000000, count:8 }
    ]
  },
  {
    dong:'C동', contractCount:30,
    depositBands:[
      { medianMonthlyRentWon:950000, medianDepositWon:10000000, count:15 }
    ]
  }
];

test('budget-filtered neighborhoods are ranked by strongest matching contract evidence', () => {
  const result = Explorer.filterDongsByBudget(neighborhoods, { maxRent:800000, maxDeposit:10000000 });
  assert.deepEqual(result.map(item => item.dong), ['B동','A동']);
});

test('no budget filter preserves the provider order', () => {
  const result = Explorer.filterDongsByBudget(neighborhoods, {});
  assert.deepEqual(result.map(item => item.dong), ['A동','B동','C동']);
});

test('budget fit exposes matching-contract evidence for future recommendation UI', () => {
  const fit = Explorer.budgetFitForDong(neighborhoods[1], { maxRent:800000, maxDeposit:10000000 });
  assert.equal(fit.fits, true);
  assert.equal(fit.matchingContractCount, 8);
  assert.equal(fit.representativeBand.medianMonthlyRentWon, 780000);
});
