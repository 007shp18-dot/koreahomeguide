const test = require('node:test');
const assert = require('node:assert/strict');

const utils = require('../providers/provider-utils.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');

const ref = new Date('2026-08-24T00:00:00Z');

function row(building, date, rentManwon, depositManwon = 1000, area = 25, type = 'officetel') {
  return {
    building,
    area:String(area),
    deposit:String(depositManwon),
    monthlyRent:String(rentManwon),
    contractDate:date,
    type
  };
}

const sample = [
  row(' Gangnam   Prugio City ', '2026-07-10', 100, 1000, 24),
  row('Gangnam Prugio City', '2026-06-10', 120, 1000, 26),
  row('Gangnam Prugio City', '2026-05-10', 110, 1500, 25),
  row('Gangnam Prugio City', '2026-04-10', 80, 1000, 23),
  row('Gangnam Prugio City', '2026-03-10', 90, 1000, 25),
  row('Gangnam Prugio City', '2026-02-10', 100, 1000, 27),
  row('Gangnam Prugio City', '2026-07-12', 0, 10000, 25),
  row('Central Officetel', '2026-07-11', 70, 500, 18),
  row('Central Officetel', '2026-06-11', 80, 500, 20),
  row('-', '2026-07-01', 60, 500, 19)
];

test('provider utilities normalize building names and group the same building', () => {
  assert.equal(utils.normalizeBuildingName('  Gangnam   Prugio City  '), 'Gangnam Prugio City');
  assert.equal(utils.buildingKeyFromName(' Gangnam   Prugio City '), 'gangnam prugio city');
  const buildings = utils.aggregateBuildings(sample, { referenceDate:ref, months:6 });
  assert.equal(buildings.length, 2);
  const main = buildings.find(item => item.buildingName === 'Gangnam Prugio City');
  assert.ok(main);
  assert.equal(main.contractCount, 7);
  assert.equal(main.monthlyRentCount, 6);
  assert.equal(main.medianMonthlyRentWon, 1000000);
  assert.equal(main.medianDepositWon, 10000000);
  assert.equal(main.typicalAreaSqm, 25);
});


test('building ranking ignores rows where the public feed only has a dong fallback and no actual building name', () => {
  const rows = [
    { building:'Yeoksam-dong', buildingName:'', area:'20', deposit:'500', monthlyRent:'60', contractDate:'2026-07-05', type:'villa' },
    { building:'Named Villa', buildingName:'Named Villa', area:'22', deposit:'500', monthlyRent:'65', contractDate:'2026-07-06', type:'villa' }
  ];
  const buildings = utils.aggregateBuildings(rows, { referenceDate:ref, months:6 });
  assert.deepEqual(buildings.map(item => item.buildingName), ['Named Villa']);
});
test('building detail excludes zero-rent rows from monthly median and calculates 3-month change', () => {
  const key = utils.buildingKeyFromName('Gangnam Prugio City');
  const detail = utils.buildBuildingDetail(sample, { buildingKey:key, referenceDate:ref, months:6 });
  assert.ok(detail);
  assert.equal(detail.buildingName, 'Gangnam Prugio City');
  assert.equal(detail.medianMonthlyRentWon, 1000000);
  assert.equal(detail.quarterChangePct, 22.2);
  assert.equal(detail.recentTransactions[0].contractDate, '2026-07-12');
  assert.deepEqual(detail.monthlyTrend.map(point => point.month), ['2026-02','2026-03','2026-04','2026-05','2026-06','2026-07']);
  assert.equal(detail.monthlyTrend.at(-1).medianMonthlyRentWon, 1000000);
});

test('quarter change returns null when either 3-month window has fewer than three monthly-rent contracts', () => {
  const sparse = [
    row('Sparse', '2026-07-01', 100),
    row('Sparse', '2026-06-01', 110),
    row('Sparse', '2026-04-01', 90),
    row('Sparse', '2026-03-01', 95),
    row('Sparse', '2026-02-01', 100)
  ];
  const detail = utils.buildBuildingDetail(sparse, { buildingKey:'sparse', referenceDate:ref, months:6 });
  assert.equal(detail.quarterChangePct, null);
});

test('KoreaHousingProvider exposes city-neutral contract and reuses one six-month fetch per area', async () => {
  let calls = 0;
  const byMonth = new Map();
  for (const item of sample) {
    const key = item.contractDate.slice(0,7).replace('-','');
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(item);
  }
  const provider = createKoreaHousingProvider({
    serviceKey:'test-key',
    referenceDate:ref,
    fetchMonth:async ({ dealYmd }) => { calls += 1; return byMonth.get(dealYmd) || []; }
  });
  assert.equal(typeof provider.getAreaSummary, 'function');
  assert.equal(typeof provider.getBuildings, 'function');
  assert.equal(typeof provider.getBuildingDetail, 'function');

  const summary = await provider.getAreaSummary({ areaCode:'11680', propertyType:'officetel', months:6 });
  const buildings = await provider.getBuildings({ areaCode:'11680', propertyType:'officetel', months:6 });
  const detail = await provider.getBuildingDetail({ areaCode:'11680', propertyType:'officetel', buildingKey:'gangnam prugio city', months:6 });

  assert.equal(summary.totalContracts, 10);
  assert.equal(buildings[0].buildingName, 'Gangnam Prugio City');
  assert.equal(detail.buildingName, 'Gangnam Prugio City');
  assert.equal(calls, 6, 'provider should cache fetched six-month area rows within one instance');
});
