const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const realPrice = require('../lib/real-price-core.cjs');
const rentCore = require('../lib/rent-check-core.cjs');
const marketCore = require('../lib/rent-market-core.cjs');
const providerUtils = require('../providers/provider-utils.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const { PROPERTY_TYPES } = require('../providers/seoul-config.cjs');

const ref = new Date('2026-08-24T00:00:00Z');

function rentRow({ building='e편한세상영등포아델포레', dong='대림동', area=59.97, deposit=15000, rent=220, date='2026-07-10', contractType='신규', type='apartment' } = {}) {
  return {
    building,
    buildingName:building,
    dong,
    area:String(area),
    deposit:String(deposit),
    monthlyRent:String(rent),
    contractDate:date,
    contractType,
    contractTerm:'2026.07~2028.07',
    useRRRight:contractType === '갱신' ? '사용' : '',
    preDeposit:contractType === '갱신' ? '14,000' : '',
    preMonthlyRent:contractType === '갱신' ? '200' : '',
    type
  };
}

test('rental XML parser preserves contract context fields and detached endpoint exists', () => {
  const xml = `<response><body><items><item>
    <aptNm>e편한세상영등포아델포레</aptNm><umdNm>대림동</umdNm><excluUseAr>59.97</excluUseAr>
    <dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>10</dealDay>
    <deposit>15,000</deposit><monthlyRent>220</monthlyRent>
    <contractTerm>2026.07~2028.07</contractTerm><contractType>신규</contractType><useRRRight></useRRRight>
    <preDeposit>14,000</preDeposit><preMonthlyRent>200</preMonthlyRent>
  </item></items></body></response>`;
  const [row] = realPrice.parseItems(xml, 'apartment');
  assert.equal(row.contractType, '신규');
  assert.equal(row.contractTerm, '2026.07~2028.07');
  assert.equal(row.preDeposit, '14,000');
  assert.equal(row.preMonthlyRent, '200');
  assert.match(realPrice.endpointForType('detached'), /RTMSDataSvcSHRent/);
});

test('normalized rent transactions retain new/renewal context in KRW', () => {
  const normalized = rentCore.normalizeTransaction(rentRow({ contractType:'갱신' }));
  assert.equal(normalized.contractType, 'renewal');
  assert.equal(normalized.preDepositWon, 140_000_000);
  assert.equal(normalized.preMonthlyRentWon, 2_000_000);
  assert.equal(normalized.useRRRight, '사용');
});

test('market stats segment monthly rent by deposit instead of implying a synthetic median pair', () => {
  const rows = [
    rentRow({ deposit:1000, rent:100, area:59.9, date:'2026-07-01' }),
    rentRow({ deposit:1000, rent:110, area:60.1, date:'2026-06-01' }),
    rentRow({ deposit:15000, rent:59, area:59.97, date:'2026-07-02' }),
    rentRow({ deposit:15000, rent:220, area:59.97, date:'2026-06-02' }),
    rentRow({ deposit:75000, rent:25, area:84.99, date:'2026-07-03' }),
    rentRow({ deposit:25000, rent:220, area:84.96, date:'2026-06-03', contractType:'갱신' })
  ];
  const stats = marketCore.buildRentMarketStats(rows, { referenceDate:ref, months:6 });
  assert.ok(Array.isArray(stats.depositBands));
  const low = stats.depositBands.find(b => b.minDepositWon === 10_000_000 && b.maxDepositWon === 30_000_000);
  const mid = stats.depositBands.find(b => b.minDepositWon === 100_000_000 && b.maxDepositWon === 200_000_000);
  assert.equal(low.medianMonthlyRentWon, 1_050_000);
  assert.equal(mid.medianMonthlyRentWon, 1_395_000);
  assert.ok(Array.isArray(stats.areaGroups));
  assert.deepEqual(stats.areaGroups.map(g => g.approxAreaSqm), [60, 85]);
  assert.equal(stats.contractTypeCounts.new, 5);
  assert.equal(stats.contractTypeCounts.renewal, 1);
});

test('building detail includes contextual rent bands and separates apartment sale transactions by area', () => {
  const rentRows = [
    rentRow({ deposit:15000, rent:59, area:59.97, date:'2026-07-02' }),
    rentRow({ deposit:15000, rent:220, area:59.97, date:'2026-06-02' }),
    rentRow({ deposit:75000, rent:25, area:84.99, date:'2026-07-03' }),
    rentRow({ deposit:25000, rent:220, area:84.96, date:'2026-06-03' })
  ];
  const saleRows = [
    { building:'e편한세상영등포아델포레', buildingName:'e편한세상영등포아델포레', dong:'대림동', areaSqm:59.97, dealAmountWon:1_465_000_000, contractDate:'2026-07-12', floor:12 },
    { building:'e편한세상영등포아델포레', buildingName:'e편한세상영등포아델포레', dong:'대림동', areaSqm:84.96, dealAmountWon:1_650_000_000, contractDate:'2026-06-20', floor:18 }
  ];
  const key = providerUtils.buildingKeyFromName('e편한세상영등포아델포레', '대림동');
  const detail = providerUtils.buildBuildingDetail(rentRows, { buildingKey:key, referenceDate:ref, months:6, saleRows });
  assert.equal(detail.areaGroups.length, 2);
  assert.equal(detail.saleSummary.contractCount, 2);
  assert.equal(detail.saleSummary.areaGroups[0].approxAreaSqm, 60);
  assert.equal(detail.saleSummary.areaGroups[0].medianSalePriceWon, 1_465_000_000);
  assert.equal(detail.saleSummary.areaGroups[1].approxAreaSqm, 85);
});

test('apartment provider treats sale API as optional and non-fatal', async () => {
  const rents = [rentRow()];
  let saleCalls = 0;
  const provider = createKoreaHousingProvider({
    serviceKey:'test-key',
    referenceDate:ref,
    fetchMonth:async () => rents,
    fetchSaleMonth:async () => { saleCalls += 1; throw new Error('not authorized'); }
  });
  const key = providerUtils.buildingKeyFromName('e편한세상영등포아델포레', '대림동');
  const detail = await provider.getBuildingDetail({ areaCode:'11560', propertyType:'apartment', buildingKey:key, months:6 });
  assert.ok(detail);
  assert.equal(detail.saleSummary, null);
  assert.ok(saleCalls >= 1);
});

test('property taxonomy distinguishes low-rise rowhouse/multifamily from detached/multi-family', () => {
  assert.ok(PROPERTY_TYPES.includes('detached'));
  const catalog = require('../location-catalog.js');
  assert.equal(catalog.propertyTypeLabel('villa','en'), 'Low-rise multifamily / Villa (연립·다세대)');
  assert.equal(catalog.propertyTypeLabel('detached','en'), 'Detached & multi-unit house (단독·다가구)');
  const home = fs.readFileSync('index.html','utf8');
  assert.match(home, /value="detached"/);
  const zh = fs.readFileSync('zh/index.html','utf8');
  assert.match(zh, /value="detached"/);
});

test('building detail UI labels contextual rent and apartment sales rather than a synthetic typical pair', () => {
  const html = fs.readFileSync('explore/building/index.html','utf8');
  assert.match(html, /Monthly rent by deposit/i);
  assert.match(html, /By floor area/i);
  assert.match(html, /New vs renewal/i);
  assert.match(html, /Recent apartment sales/i);
  assert.doesNotMatch(html, /<span>Typical monthly rent<\/span>/i);
  assert.doesNotMatch(html, /<span>Typical deposit<\/span>/i);
});


test('Rent Check prefers identified new contracts when enough comparable new contracts exist', () => {
  const quote = { depositWon:10_000_000, rentWon:1_000_000, areaSqm:60, propertyType:'apartment', referenceDate:ref };
  const rows = [
    rentRow({ deposit:1000, rent:95, area:60, date:'2026-07-01', contractType:'신규' }),
    rentRow({ deposit:1000, rent:100, area:60, date:'2026-07-02', contractType:'신규' }),
    rentRow({ deposit:1000, rent:105, area:60, date:'2026-07-03', contractType:'신규' }),
    rentRow({ deposit:1000, rent:110, area:60, date:'2026-06-01', contractType:'신규' }),
    rentRow({ deposit:1000, rent:115, area:60, date:'2026-06-02', contractType:'신규' }),
    rentRow({ deposit:1000, rent:40, area:60, date:'2026-07-04', contractType:'갱신' })
  ];
  const result = rentCore.buildRentCheckResult(rows, quote);
  assert.equal(result.comparableCount, 5);
  assert.equal(result.medianValueWon, 1_050_000);
  assert.ok(result.comparables.every(row => row.contractType === 'new'));
});

test('Explorer budget filtering matches rent and deposit from the same deposit band', () => {
  const utils = require('../explore/explorer-utils.js');
  const items = [
    { dong:'A', medianMonthlyRentWon:500_000, medianDepositWon:10_000_000, depositBands:[
      { medianDepositWon:10_000_000, medianMonthlyRentWon:1_200_000 },
      { medianDepositWon:100_000_000, medianMonthlyRentWon:500_000 }
    ]},
    { dong:'B', depositBands:[{ medianDepositWon:20_000_000, medianMonthlyRentWon:800_000 }]}
  ];
  const filtered = utils.filterDongsByBudget(items, { maxRent:900_000, maxDeposit:30_000_000 });
  assert.deepEqual(filtered.map(x => x.dong), ['B']);
});

test('static rent market pages use contextual rent sections instead of a synthetic median rent/deposit headline pair', () => {
  for (const path of ['rent/mapo-gu/villa/index.html','rent/yeongdeungpo-gu/apartment/index.html','zh/rent/mapo-gu/villa/index.html']) {
    const html = fs.readFileSync(path,'utf8');
    assert.match(html, /depositBandGrid/);
    assert.doesNotMatch(html, /<span>Median monthly rent<\/span>/i);
    assert.doesNotMatch(html, /<span>Median deposit<\/span>/i);
  }
});

test('Dong summaries retain new/renewal status for recent transaction rendering', () => {
  const rows = [
    rentRow({ building:'A', dong:'연남동', contractType:'신규', date:'2026-07-03' }),
    rentRow({ building:'B', dong:'연남동', contractType:'갱신', date:'2026-07-02' })
  ];
  const summary = providerUtils.buildDongSummary(rows, { dong:'연남동', referenceDate:ref, months:6 });
  assert.equal(summary.recentTransactions[0].contractType, 'new');
  assert.equal(summary.recentTransactions[1].contractType, 'renewal');
});


test('dynamic Dong SEO renders deposit-context rent and contract mix instead of synthetic medians', () => {
  const { renderDongPage } = require('../seo/seo-page-renderer.cjs');
  const summary = {
    dong:'대림동', totalContracts:8, contractCount:8, newContractMonthlyRentCount:5, renewalMonthlyRentCount:2,
    medianJeonseDepositWon:600_000_000, dataThroughMonth:'2026-07', quarterChangePct:null,
    depositBands:[{ minDepositWon:100_000_000, maxDepositWon:200_000_000, count:4, medianDepositWon:150_000_000, medianMonthlyRentWon:1_395_000, minMonthlyRentWon:590_000, maxMonthlyRentWon:2_200_000 }],
    recentTransactions:[{ building:'e편한세상영등포아델포레', areaSqm:59.97, depositWon:150_000_000, monthlyRentWon:2_200_000, contractDate:'2026-07-10', contractType:'new' }]
  };
  const html = renderDongPage({ lang:'en', areaCode:'11560', districtName:'Yeongdeungpo-gu', dong:'대림동', propertyType:'apartment', summary, buildings:[], fxRates:{} });
  assert.match(html, /Monthly rent by deposit/i);
  assert.match(html, /New monthly-rent contracts/i);
  assert.match(html, /Renewal contracts/i);
  assert.doesNotMatch(html, />Median monthly rent</i);
  assert.doesNotMatch(html, />Median deposit</i);
});

test('dynamic building SEO separates area/deposit rent context, contract types and apartment sale prices', () => {
  const { renderBuildingPage } = require('../seo/seo-page-renderer.cjs');
  const summary = { contextualMedianMonthlyRentWon:1_300_000, depositBands:[], contractCount:20 };
  const detail = {
    buildingName:'e편한세상영등포아델포레', buildingKey:'대림동::e편한세상영등포아델포레', dong:'대림동', contractCount:8,
    newContractMonthlyRentCount:5, renewalMonthlyRentCount:2, medianJeonseDepositWon:620_000_000, typicalAreaSqm:72,
    depositBands:[{ minDepositWon:100_000_000, maxDepositWon:200_000_000, count:3, medianDepositWon:150_000_000, medianMonthlyRentWon:2_200_000, minMonthlyRentWon:590_000, maxMonthlyRentWon:2_200_000 }],
    areaGroups:[
      { approxAreaSqm:60, count:3, medianAreaSqm:59.97, depositBands:[{ minDepositWon:100_000_000, maxDepositWon:200_000_000, count:3, medianDepositWon:150_000_000, medianMonthlyRentWon:2_200_000 }] },
      { approxAreaSqm:85, count:2, medianAreaSqm:84.96, depositBands:[{ minDepositWon:200_000_000, maxDepositWon:400_000_000, count:2, medianDepositWon:250_000_000, medianMonthlyRentWon:2_200_000 }] }
    ],
    contractTypeCounts:{new:5,renewal:2,unknown:1},
    monthlyTrend:[{month:'2026-07',count:3,medianMonthlyRentWon:1_000_000}],
    recentTransactions:[
      {contractDate:'2026-07-10',areaSqm:59.97,depositWon:150_000_000,monthlyRentWon:2_200_000,contractType:'new'},
      {contractDate:'2026-07-09',areaSqm:84.96,depositWon:250_000_000,monthlyRentWon:2_200_000,contractType:'renewal'}
    ],
    saleSummary:{ contractCount:2, areaGroups:[
      {approxAreaSqm:60,count:1,medianAreaSqm:59.97,medianSalePriceWon:1_465_000_000,latestSalePriceWon:1_465_000_000,latestContractDate:'2026-07-12'},
      {approxAreaSqm:85,count:1,medianAreaSqm:84.96,medianSalePriceWon:1_650_000_000,latestSalePriceWon:1_650_000_000,latestContractDate:'2026-06-20'}
    ], recentSales:[{areaSqm:59.97,dealAmountWon:1_465_000_000,contractDate:'2026-07-12',floor:12}] }
  };
  const html = renderBuildingPage({ lang:'en', areaCode:'11560', districtName:'Yeongdeungpo-gu', dong:'대림동', propertyType:'apartment', summary, detail, fxRates:{} });
  assert.match(html, /Monthly rent by deposit/i);
  assert.match(html, /By floor area/i);
  assert.match(html, /New vs renewal/i);
  assert.match(html, /Recent apartment sales/i);
  assert.match(html, /₩1,465,000,000/);
  assert.doesNotMatch(html, /Typical monthly rent/i);
  assert.doesNotMatch(html, /Typical deposit/i);
  assert.match(html, /deposit=150000000/);
  assert.match(html, /rent=2200000/);
  assert.match(html, /area=59\.97/);
});


test('district market runtime uses area groups with deposit context instead of legacy size-only medians', () => {
  const en = fs.readFileSync('rent-market-page.js','utf8');
  const zh = fs.readFileSync('zh/rent-market-page.js','utf8');
  assert.match(en, /renderAreaGroups\(data\.areaGroups/);
  assert.match(zh, /renderAreaGroups\(data\.areaGroups/);
  assert.doesNotMatch(en, /renderSizeBands\(data\.sizeBands/);
  assert.doesNotMatch(zh, /renderSizeBands\(data\.sizeBands/);
});

test('district market pages label unconditioned quarter change as a raw all-deposit signal', () => {
  const en = fs.readFileSync('rent/mapo-gu/villa/index.html','utf8');
  const zh = fs.readFileSync('zh/rent/mapo-gu/villa/index.html','utf8');
  assert.match(en, /Raw monthly-rent direction/i);
  assert.match(zh, /原始月租走势/);
  assert.doesNotMatch(en, /<span>Recent direction<\/span>/);
});


test('Studio fallback uses the detached/multi-family public category with an explicit caveat', () => {
  const enUi = require('../rent-check-ui-utils.js');
  const zhUi = require('../zh/rent-check-ui-utils.js');
  assert.equal(enUi.mapRentCheckType('studio').officialType, 'detached');
  assert.equal(zhUi.mapRentCheckType('studio').officialType, 'detached');
  const en = fs.readFileSync('tools/seoul-rent-check/index.html','utf8');
  const zh = fs.readFileSync('zh/tools/seoul-rent-check/index.html','utf8');
  assert.match(en, /Detached &amp; multi-unit house.*closest/i);
  assert.match(en, /actual registered housing type/i);
  assert.match(zh, /独栋及多户住宅/);
  assert.match(zh, /实际登记的住宅类型/);
  const app = fs.readFileSync('app.js','utf8');
  const zhApp = fs.readFileSync('zh/app.js','utf8');
  assert.match(app, /mapRentCheckType\(type\.value\)/);
  assert.match(zhApp, /mapRentCheckType\(type\.value\)/);
});
