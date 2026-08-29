const test = require('node:test');
const assert = require('node:assert/strict');
const { buildBuildingMarketPosition, buildBuildingDetail } = require('../providers/provider-utils.cjs');
const { parseItems } = require('../lib/real-price-core.cjs');

function rentRow({ building, dong = '역삼동', area = 40, deposit = 1000, rent, date = '2026-07-10', type = 'officetel' }) {
  return { building, buildingName:building, dong, area, deposit, monthlyRent:rent, contractDate:date, type };
}

test('building market position deposit-adjusts area-matched comparables and exposes evidence counts', () => {
  const rows = [
    rentRow({ building:'선택빌딩', rent:100 }),
    rentRow({ building:'선택빌딩', deposit:2000, rent:96, date:'2026-06-10' }),
    rentRow({ building:'선택빌딩', deposit:500, rent:102, date:'2026-05-10' })
  ];
  for (let index = 0; index < 24; index += 1) {
    rows.push(rentRow({
      building:`비교${Math.floor(index / 3) + 1}`,
      dong:index < 12 ? '역삼동' : '논현동',
      deposit:index % 2 ? 2000 : 1000,
      rent:80 + index * 2,
      date:index % 3 === 0 ? '2026-07-12' : index % 3 === 1 ? '2026-06-12' : '2026-05-12'
    }));
  }

  const result = buildBuildingMarketPosition(rows, {
    buildingKey:'역삼동::선택빌딩',
    referenceDate:new Date('2026-08-29T00:00:00Z'),
    months:6
  });

  assert.deepEqual(result.buildingRepresentative, {
    depositWon:10_000_000,
    monthlyRentWon:1_000_000,
    areaSqm:40,
    adjustedPerSqmWon:26_042,
    contractCount:3
  });
  assert.equal(result.dong.status, 'sufficient');
  assert.equal(result.dong.comparableCount, 12);
  assert.equal(result.dong.buildingCount, 4);
  assert.equal(result.dong.percentile, 0.83);
  assert.equal(result.district.status, 'sufficient');
  assert.equal(result.district.comparableCount, 24);
  assert.equal(result.district.buildingCount, 8);
  assert.equal(result.district.percentile, 0.42);
});

test('market gauge ranks the same adjusted square-metre metric shown beside it', () => {
  const rows = [
    rentRow({ building:'선택빌딩', rent:100, area:40 }),
    rentRow({ building:'선택빌딩', rent:100, area:40, date:'2026-06-10' }),
    rentRow({ building:'선택빌딩', rent:100, area:40, date:'2026-05-10' })
  ];
  for (let index = 0; index < 24; index += 1) {
    rows.push(rentRow({
      building:`비교${Math.floor(index / 3) + 1}`,
      dong:index < 12 ? '역삼동' : '논현동',
      rent:100,
      area:index % 2 ? 32 : 48,
      date:index % 3 === 0 ? '2026-07-12' : index % 3 === 1 ? '2026-06-12' : '2026-05-12'
    }));
  }
  const result = buildBuildingMarketPosition(rows, {
    buildingKey:'역삼동::선택빌딩', referenceDate:new Date('2026-08-29T00:00:00Z')
  });
  assert.equal(result.dong.medianAdjustedPerSqmWon, 27_127);
  assert.equal(result.dong.percentile, 0.5);
});

test('building market position withholds claims below evidence thresholds', () => {
  const rows = [
    rentRow({ building:'선택빌딩', rent:100 }),
    rentRow({ building:'선택빌딩', rent:105, date:'2026-06-10' }),
    rentRow({ building:'비교1', rent:95 }),
    rentRow({ building:'비교2', rent:110 })
  ];
  const result = buildBuildingMarketPosition(rows, {
    buildingKey:'역삼동::선택빌딩',
    referenceDate:new Date('2026-08-29T00:00:00Z')
  });
  assert.equal(result.buildingRepresentative, null);
  assert.deepEqual(result.dong, {
    status:'insufficient',
    percentile:null,
    comparableCount:2,
    buildingCount:2,
    medianAdjustedPerSqmWon:null,
    reason:'minimum-evidence'
  });
  assert.equal(result.district.status, 'insufficient');
});

test('building detail exposes the market position additively', () => {
  const rows = [
    rentRow({ building:'선택빌딩', rent:100 }),
    rentRow({ building:'선택빌딩', rent:105, date:'2026-06-10' }),
    rentRow({ building:'선택빌딩', rent:95, date:'2026-05-10' })
  ];
  const detail = buildBuildingDetail(rows, {
    buildingKey:'역삼동::선택빌딩',
    referenceDate:new Date('2026-08-29T00:00:00Z')
  });
  assert.equal(detail.marketPosition.buildingRepresentative.contractCount, 3);
  assert.equal(detail.profile.status, 'unavailable');
});

test('rental parser preserves floor and legal-region identifiers for exact profile matching', () => {
  const xml = '<response><body><items><item><aptNm>테스트</aptNm><umdNm>역삼동</umdNm><jibun>1-2</jibun><excluUseAr>40</excluUseAr><deposit>1,000</deposit><monthlyRent>100</monthlyRent><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>3</dealDay><floor>12</floor><sggCd>11680</sggCd><umdCd>10100</umdCd></item></items></body></response>';
  const [row] = parseItems(xml, 'apartment');
  assert.equal(row.floor, '12');
  assert.equal(row.sggCd, '11680');
  assert.equal(row.umdCd, '10100');
});
