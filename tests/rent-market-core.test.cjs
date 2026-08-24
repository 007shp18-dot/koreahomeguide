const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRentMarketStats } = require('../lib/rent-market-core.cjs');

test('buildRentMarketStats separates monthly rent from jeonse and uses completed months only', () => {
  const items = [
    { building:'A', area:'25', deposit:'1,000', monthlyRent:'80', contractDate:'2026-07-10', type:'officetel' },
    { building:'B', area:'28', deposit:'2,000', monthlyRent:'100', contractDate:'2026-06-10', type:'officetel' },
    { building:'C', area:'30', deposit:'10,000', monthlyRent:'0', contractDate:'2026-05-10', type:'officetel' },
    { building:'Current month', area:'25', deposit:'1,000', monthlyRent:'500', contractDate:'2026-08-03', type:'officetel' }
  ];
  const stats = buildRentMarketStats(items, { referenceDate:new Date('2026-08-24T00:00:00Z'), months:6 });
  assert.equal(stats.totalContracts, 3);
  assert.equal(stats.monthlyRentCount, 2);
  assert.equal(stats.medianMonthlyRentWon, 900000);
  assert.equal(stats.medianDepositWon, 15000000);
  assert.equal(stats.jeonseCount, 1);
  assert.equal(stats.medianJeonseDepositWon, 100000000);
  assert.equal(stats.dataThroughMonth, '2026-07');
});
