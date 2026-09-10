const test = require('node:test');
const assert = require('node:assert/strict');

const { parseItems } = require('../lib/real-price-core.cjs');
const { normalizeTransaction } = require('../lib/rent-check-core.cjs');
const {
  parseLeaseEnd,
  renewalDelta,
  observedFieldStats
} = require('../lib/rent-market-core.cjs');
const {
  aggregateBuildings,
  buildAreaSummary,
  buildDongSummary
} = require('../providers/provider-utils.cjs');

test('MOLIT rental parser recovers Korean and English build year and floor tags', () => {
  const xml = `<response><body><items>
    <item><aptNm>테스트</aptNm><umdNm>역삼동</umdNm><excluUseAr>40</excluUseAr>
      <deposit>1,000</deposit><monthlyRent>100</monthlyRent>
      <dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>3</dealDay>
      <건축년도>2005</건축년도><층>12</층>
    </item>
    <item><aptNm>테스트2</aptNm><umdNm>역삼동</umdNm><excluUseAr>45</excluUseAr>
      <deposit>2,000</deposit><monthlyRent>120</monthlyRent>
      <dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>4</dealDay>
      <buildYear>2010</buildYear><floor>8</floor>
    </item>
  </items></body></response>`;
  const rows = parseItems(xml, 'apartment');
  assert.deepEqual(rows.map(row => [row.buildYear, row.floor]), [['2005', '12'], ['2010', '8']]);
  assert.equal(normalizeTransaction(rows[0]).buildYear, 2005);
  assert.equal(normalizeTransaction(rows[0]).floor, 12);
});

test('lease end parsing accepts the observed YY.MM range and rejects invalid months', () => {
  assert.deepEqual(parseLeaseEnd('26.07~27.07'), { year:2027, month:7 });
  assert.equal(parseLeaseEnd('26.07~27.13'), null);
  assert.equal(parseLeaseEnd('2026.07~2027.07'), null);
  assert.equal(parseLeaseEnd(''), null);
});

test('renewal delta uses only like-for-like monthly-rent renewals', () => {
  const base = {
    contractType:'renewal',
    preDepositWon:10_000_000,
    depositWon:10_000_000,
    preMonthlyRentWon:1_000_000,
    monthlyRentWon:1_050_000
  };
  assert.equal(renewalDelta(base), 0.05);
  assert.equal(renewalDelta({ ...base, contractType:'new' }), null);
  assert.equal(renewalDelta({ ...base, depositWon:20_000_000 }), null);
  assert.equal(renewalDelta({ ...base, preMonthlyRentWon:0 }), null);
  assert.equal(renewalDelta({ ...base, preDepositWon:null, depositWon:0 }), null);
  assert.equal(renewalDelta({ ...base, preDepositWon:'', depositWon:0 }), null);
  assert.equal(renewalDelta({ ...base, preMonthlyRentWon:null }), null);
  assert.equal(renewalDelta({ ...base, preMonthlyRentWon:'' }), null);
});

test('observed field stats expose ranges, lease expiries and renewal distributions', () => {
  const rows = [
    { buildYear:2005, floor:12, contractTerm:'26.07~27.07', contractType:'renewal', preDepositWon:10_000_000, depositWon:10_000_000, preMonthlyRentWon:1_000_000, monthlyRentWon:1_050_000 },
    { buildYear:2007, floor:2, contractTerm:'26.08~27.08', contractType:'renewal', preDepositWon:10_000_000, depositWon:10_000_000, preMonthlyRentWon:1_000_000, monthlyRentWon:1_000_000 },
    { buildYear:2006, floor:8, contractTerm:'26.08~27.08', contractType:'renewal', preDepositWon:10_000_000, depositWon:10_000_000, preMonthlyRentWon:1_000_000, monthlyRentWon:1_100_000 },
    { buildYear:null, floor:null, contractTerm:'', contractType:'new', depositWon:10_000_000, monthlyRentWon:900_000 }
  ];
  assert.deepEqual(observedFieldStats(rows), {
    buildYearMin:2005,
    buildYearMax:2007,
    buildYearMedian:2006,
    floorMin:2,
    floorMax:12,
    leaseEndHistogram:{ '2027-07':1, '2027-08':2 },
    renewalDeltas:{ count:3, medianPct:5, p25Pct:2.5, p75Pct:7.5, zeroCount:1, overCapCount:1 }
  });
});

test('area, dong and building summaries retain recovered fields', () => {
  const rows = [
    { building:'테스트', buildingName:'테스트', dong:'역삼동', area:'40', deposit:'1,000', monthlyRent:'100', contractDate:'2026-07-03', type:'officetel', buildYear:'2005', floor:'12', contractType:'갱신', contractTerm:'26.07~27.07', preDeposit:'1,000', preMonthlyRent:'95' },
    { building:'테스트', buildingName:'테스트', dong:'역삼동', area:'42', deposit:'1,000', monthlyRent:'105', contractDate:'2026-07-04', type:'officetel', buildYear:'2005', floor:'8', contractType:'갱신', contractTerm:'26.08~27.08', preDeposit:'1,000', preMonthlyRent:'100' },
    { building:'테스트', buildingName:'테스트', dong:'역삼동', area:'44', deposit:'1,000', monthlyRent:'110', contractDate:'2026-07-05', type:'officetel', buildYear:'2005', floor:'4', contractType:'신규' }
  ];
  const options = { referenceDate:new Date('2026-08-29T00:00:00Z'), months:6 };
  const building = aggregateBuildings(rows, options)[0];
  const area = buildAreaSummary(rows, options);
  const dong = buildDongSummary(rows, { ...options, dong:'역삼동' });

  for (const summary of [building, area, dong]) {
    assert.equal(summary.buildYearMedian, 2005);
    assert.equal(summary.floorMin, 4);
    assert.equal(summary.floorMax, 12);
    assert.equal(summary.renewalDeltas.count, 2);
  }
  assert.equal(dong.recentTransactions[0].buildYear, 2005);
  assert.equal(dong.recentTransactions[0].floor, 4);
});
