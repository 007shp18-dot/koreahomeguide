const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDongSummary } = require('../providers/provider-utils.cjs');

const referenceDate = new Date('2026-08-24T00:00:00Z');

test('Dong summary exposes jeonse median and recent signed transactions for SEO rendering', () => {
  const rows = [
    { building:'A Villa', buildingName:'A Villa', dong:'연남동', area:'20', deposit:'1000', monthlyRent:'60', contractDate:'2026-07-01', type:'villa' },
    { building:'B Villa', buildingName:'B Villa', dong:'연남동', area:'22', deposit:'15000', monthlyRent:'0', contractDate:'2026-07-03', type:'villa' },
    { building:'C Villa', buildingName:'C Villa', dong:'연남동', area:'23', deposit:'17000', monthlyRent:'0', contractDate:'2026-06-03', type:'villa' },
    { building:'Other', buildingName:'Other', dong:'서교동', area:'24', deposit:'20000', monthlyRent:'0', contractDate:'2026-07-04', type:'villa' }
  ];
  const summary = buildDongSummary(rows, { dong:'연남동', referenceDate, months:6 });
  assert.equal(summary.jeonseCount, 2);
  assert.equal(summary.medianJeonseDepositWon, 160000000);
  assert.equal(summary.recentTransactions.length, 3);
  assert.equal(summary.recentTransactions[0].contractDate, '2026-07-03');
  assert.equal(summary.recentTransactions[0].building, 'B Villa');
});
