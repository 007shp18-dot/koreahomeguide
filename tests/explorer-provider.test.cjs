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

test('dong summaries aggregate recent transactions and buildings without mixing neighborhoods', () => {
  const rows = [
    { building:'Twin Villa', buildingName:'Twin Villa', dong:'연남동', area:'20', deposit:'1000', monthlyRent:'60', contractDate:'2026-07-01', type:'villa' },
    { building:'Twin Villa', buildingName:'Twin Villa', dong:'연남동', area:'22', deposit:'1000', monthlyRent:'70', contractDate:'2026-06-01', type:'villa' },
    { building:'Twin Villa', buildingName:'Twin Villa', dong:'서교동', area:'30', deposit:'2000', monthlyRent:'90', contractDate:'2026-07-02', type:'villa' },
    { building:'Other House', buildingName:'Other House', dong:'서교동', area:'31', deposit:'2000', monthlyRent:'100', contractDate:'2026-06-02', type:'villa' }
  ];
  const dongs = utils.aggregateDongs(rows, { referenceDate:ref, months:6 });
  assert.equal(dongs.length, 2);
  const yeonnam = dongs.find(item => item.dong === '연남동');
  const seogyo = dongs.find(item => item.dong === '서교동');
  assert.equal(yeonnam.contractCount, 2);
  assert.equal(yeonnam.medianMonthlyRentWon, 650000);
  assert.equal(seogyo.contractCount, 2);

  const yeonnamBuildings = utils.aggregateBuildings(rows, { referenceDate:ref, months:6, dong:'연남동' });
  const seogyoBuildings = utils.aggregateBuildings(rows, { referenceDate:ref, months:6, dong:'서교동' });
  assert.equal(yeonnamBuildings.length, 1);
  assert.equal(seogyoBuildings.length, 2);
  assert.notEqual(yeonnamBuildings[0].buildingKey, seogyoBuildings.find(item => item.buildingName === 'Twin Villa').buildingKey);
  assert.match(yeonnamBuildings[0].buildingKey, /연남동/);
  assert.match(seogyoBuildings.find(item => item.buildingName === 'Twin Villa').buildingKey, /서교동/);
});

test('building detail resolves dong-qualified keys and preserves dong metadata', () => {
  const rows = [
    { building:'Twin Villa', buildingName:'Twin Villa', dong:'연남동', area:'20', deposit:'1000', monthlyRent:'60', contractDate:'2026-07-01', type:'villa' },
    { building:'Twin Villa', buildingName:'Twin Villa', dong:'서교동', area:'30', deposit:'2000', monthlyRent:'90', contractDate:'2026-07-02', type:'villa' }
  ];
  const key = utils.buildingKeyFromName('Twin Villa', '연남동');
  const detail = utils.buildBuildingDetail(rows, { buildingKey:key, referenceDate:ref, months:6 });
  assert.equal(detail.dong, '연남동');
  assert.equal(detail.contractCount, 1);
  assert.equal(detail.medianMonthlyRentWon, 600000);
});

test('building map eligibility is strict by housing type and address consistency', () => {
  const apartment = utils.aggregateBuildings([
    { building:'Named Apartment', buildingName:'Named Apartment', dong:'역삼동', area:'25', deposit:'1000', monthlyRent:'100', contractDate:'2026-07-01', type:'apartment' }
  ], { referenceDate:ref, months:6 })[0];
  assert.equal(apartment.mapLocation.basis, 'named-building');

  const sparseVilla = utils.aggregateBuildings([
    { building:'Safe Villa', buildingName:'Safe Villa', dong:'연남동', jibun:'123-4', area:'20', deposit:'1000', monthlyRent:'60', contractDate:'2026-07-01', type:'villa' },
    { building:'Safe Villa', buildingName:'Safe Villa', dong:'연남동', jibun:'123-4', area:'21', deposit:'1000', monthlyRent:'65', contractDate:'2026-06-01', type:'villa' }
  ], { referenceDate:ref, months:6 })[0];
  assert.equal(sparseVilla.mapLocation, null);

  const verifiedVillaRows = [
    { building:'Safe Villa', buildingName:'Safe Villa', dong:'연남동', jibun:'123-4', area:'20', deposit:'1000', monthlyRent:'60', contractDate:'2026-07-01', type:'villa' },
    { building:'Safe Villa', buildingName:'Safe Villa', dong:'연남동', jibun:'123-4', area:'21', deposit:'1000', monthlyRent:'65', contractDate:'2026-06-01', type:'villa' },
    { building:'Safe Villa', buildingName:'Safe Villa', dong:'연남동', jibun:'123-4', area:'22', deposit:'1000', monthlyRent:'70', contractDate:'2026-05-01', type:'villa' }
  ];
  const verifiedVilla = utils.aggregateBuildings(verifiedVillaRows, { referenceDate:ref, months:6 })[0];
  assert.deepEqual(verifiedVilla.mapLocation, {
    buildingName:'Safe Villa', dong:'연남동', jibun:'123-4', roadAddress:'', basis:'official-address'
  });

  const conflictingVilla = utils.aggregateBuildings([
    ...verifiedVillaRows,
    { ...verifiedVillaRows[2], jibun:'999-1', contractDate:'2026-04-01' }
  ], { referenceDate:ref, months:6 })[0];
  assert.equal(conflictingVilla.mapLocation, null);

  const detached = utils.aggregateBuildings([
    { building:'Detached Home', buildingName:'Detached Home', dong:'연남동', jibun:'123-4', area:'50', deposit:'1000', monthlyRent:'90', contractDate:'2026-07-01', type:'detached' },
    { building:'Detached Home', buildingName:'Detached Home', dong:'연남동', jibun:'123-4', area:'50', deposit:'1000', monthlyRent:'90', contractDate:'2026-06-01', type:'detached' },
    { building:'Detached Home', buildingName:'Detached Home', dong:'연남동', jibun:'123-4', area:'50', deposit:'1000', monthlyRent:'90', contractDate:'2026-05-01', type:'detached' }
  ], { referenceDate:ref, months:6 })[0];
  assert.equal(detached.mapLocation, null);
});
