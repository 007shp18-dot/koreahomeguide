const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = require('../lib/real-price-core.cjs');

test('rent-market API exists and wires six-month market stats with caching', () => {
  assert.equal(fs.existsSync('api/rent-market.js'), true);
  const source = fs.readFileSync('api/rent-market.js','utf8');
  assert.match(source, /buildRentMarketStats/);
  assert.match(source, /completedMonths/);
  assert.match(source, /s-maxage=3600/);
});

test('fetchRentalMonth follows pagination so market medians are not based on a truncated month', async () => {
  assert.equal(typeof core.fetchRentalMonth, 'function');
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const pageNo = new URL(url).searchParams.get('pageNo');
    const body = pageNo === '1'
      ? '<response><header><resultCode>000</resultCode></header><body><totalCount>2</totalCount><items><item><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>1</dealDay><offiNm>A</offiNm><excluUseAr>25</excluUseAr><deposit>1,000</deposit><monthlyRent>80</monthlyRent></item></items></body></response>'
      : '<response><header><resultCode>000</resultCode></header><body><totalCount>2</totalCount><items><item><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>2</dealDay><offiNm>B</offiNm><excluUseAr>26</excluUseAr><deposit>1,000</deposit><monthlyRent>90</monthlyRent></item></items></body></response>';
    return { ok:true, status:200, text:async () => body };
  };
  const rows = await core.fetchRentalMonth({ serviceKey:'key', type:'officetel', lawdCd:'11680', dealYmd:'202607', fetchImpl, pageSize:1 });
  assert.equal(rows.length, 2);
  assert.equal(calls.length, 2);
});
