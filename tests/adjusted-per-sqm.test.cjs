const test = require('node:test');
const assert = require('node:assert/strict');
const {
  adjustedMonthlyPerSqmWon,
  aggregateDongs,
  aggregateBuildings,
  buildAreaSummary,
  buildBuildingMarketPosition,
  buildBuildingDetail
} = require('../providers/provider-utils.cjs');

const referenceDate = new Date('2026-08-29T00:00:00Z');

function rentRow({
  building,
  dong = '역삼동',
  area = 40,
  deposit = 1000,
  rent = 100,
  date = '2026-07-10'
}) {
  return {
    building,
    buildingName:building,
    dong,
    area,
    deposit,
    monthlyRent:rent,
    contractDate:date,
    type:'officetel'
  };
}

test('deposit-adjusted square-metre cost normalizes annual deposit opportunity cost', () => {
  assert.equal(adjustedMonthlyPerSqmWon({
    monthlyRentWon:1_000_000,
    depositWon:10_000_000,
    areaSqm:40
  }), 26_042);
  assert.equal(adjustedMonthlyPerSqmWon({
    monthlyRentWon:900_000,
    depositWon:34_000_000,
    areaSqm:40
  }), 26_042);
});

test('deposit-adjusted square-metre cost rejects invalid or zero areas and negative money', () => {
  assert.equal(adjustedMonthlyPerSqmWon({ monthlyRentWon:1_000_000, depositWon:10_000_000, areaSqm:0 }), null);
  assert.equal(adjustedMonthlyPerSqmWon({ monthlyRentWon:1_000_000, depositWon:10_000_000, areaSqm:'x' }), null);
  assert.equal(adjustedMonthlyPerSqmWon({ monthlyRentWon:-1, depositWon:10_000_000, areaSqm:40 }), null);
  assert.equal(adjustedMonthlyPerSqmWon({ monthlyRentWon:1_000_000, depositWon:-1, areaSqm:40 }), null);
});

test('building summaries expose a median deposit-adjusted square-metre value', () => {
  const summaries = aggregateBuildings([
    rentRow({ building:'선택빌딩', rent:100, deposit:1000, area:40 }),
    rentRow({ building:'선택빌딩', rent:90, deposit:3400, area:40, date:'2026-06-10' }),
    rentRow({ building:'선택빌딩', rent:80, deposit:1000, area:40, date:'2026-05-10' })
  ], { referenceDate, months:6 });

  assert.equal(summaries[0].adjustedPerSqmWon, 26_042);
});

test('adjusted summaries include zero-rent jeonse rows and building medians need three contracts', () => {
  const jeonse = rentRow({ building:'전세빌딩', rent:0, deposit:12_000, area:40 });
  const twoRows = aggregateBuildings([
    jeonse,
    rentRow({ building:'전세빌딩', rent:0, deposit:9_600, area:40, date:'2026-06-10' })
  ], { referenceDate, months:6 });
  assert.equal(twoRows[0].adjustedPerSqmWon, null);

  const rows = [
    jeonse,
    rentRow({ building:'전세빌딩', rent:0, deposit:9_600, area:40, date:'2026-06-10' }),
    rentRow({ building:'전세빌딩', rent:0, deposit:7_200, area:40, date:'2026-05-10' })
  ];
  assert.equal(aggregateBuildings(rows, { referenceDate, months:6 })[0].adjustedPerSqmWon, 10_000);
  assert.equal(aggregateDongs(rows, { referenceDate, months:6 })[0].adjustedPerSqmWon, 10_000);
  assert.equal(buildAreaSummary(rows, { referenceDate, months:6 }).adjustedPerSqmWon, 10_000);
});

test('area and neighborhood summaries use the same adjusted square-metre definition', () => {
  const rows = [
    rentRow({ building:'A', rent:100, deposit:1000, area:40 }),
    rentRow({ building:'B', rent:90, deposit:3400, area:40, date:'2026-06-10' }),
    rentRow({ building:'C', rent:80, deposit:1000, area:40, date:'2026-05-10' })
  ];
  assert.equal(aggregateDongs(rows, { referenceDate, months:6 })[0].adjustedPerSqmWon, 26_042);
  assert.equal(buildAreaSummary(rows, { referenceDate, months:6 }).adjustedPerSqmWon, 26_042);
});

test('building market comparison returns comparable adjusted medians only with sufficient evidence', () => {
  const rows = [
    rentRow({ building:'선택빌딩', rent:100 }),
    rentRow({ building:'선택빌딩', rent:100, date:'2026-06-10' }),
    rentRow({ building:'선택빌딩', rent:100, date:'2026-05-10' })
  ];
  for (let index = 0; index < 24; index += 1) {
    rows.push(rentRow({
      building:`비교${Math.floor(index / 3) + 1}`,
      dong:index < 12 ? '역삼동' : '논현동',
      rent:80 + index * 2,
      date:index % 3 === 0 ? '2026-07-12' : index % 3 === 1 ? '2026-06-12' : '2026-05-12'
    }));
  }

  const position = buildBuildingMarketPosition(rows, {
    buildingKey:'역삼동::선택빌딩',
    referenceDate,
    months:6
  });

  assert.equal(position.buildingRepresentative.adjustedPerSqmWon, 26_042);
  assert.equal(position.dong.medianAdjustedPerSqmWon, 23_792);
  assert.equal(position.district.medianAdjustedPerSqmWon, 26_792);
  assert.equal(position.dong.percentile, 0.92);
  assert.equal(position.district.percentile, 0.46);

  const limited = buildBuildingDetail([
    rentRow({ building:'한건빌딩' }),
    rentRow({ building:'비교1', rent:90 })
  ], { buildingKey:'역삼동::한건빌딩', referenceDate, months:6 });
  assert.equal(limited.marketPosition.buildingRepresentative, null);
  assert.equal(limited.marketPosition.dong.medianAdjustedPerSqmWon, null);
  assert.equal(limited.recentTransactions[0].adjustedPerSqmWon, 26_042);
});
