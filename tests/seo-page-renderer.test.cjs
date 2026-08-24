const test = require('node:test');
const assert = require('node:assert/strict');
const {
  renderDongPage,
  renderBuildingPage,
  renderErrorPage,
  isBuildingIndexable
} = require('../seo/seo-page-renderer.cjs');
const routes = require('../seo/seo-route-utils.cjs');

const summary = {
  dong:'연남동', totalContracts:18, contractCount:18, monthlyRentCount:12, jeonseCount:6,
  medianMonthlyRentWon:700000, medianDepositWon:20000000, medianJeonseDepositWon:180000000,
  typicalAreaSqm:24.5, quarterChangePct:4.2, monthsUsed:6, dataThroughMonth:'2026-07',
  recentTransactions:[
    { building:'A <Villa>', areaSqm:23.1, depositWon:20000000, monthlyRentWon:700000, contractDate:'2026-07-31' },
    { building:'B House', areaSqm:25.0, depositWon:180000000, monthlyRentWon:0, contractDate:'2026-07-30' }
  ]
};
const buildings = [
  { buildingName:'A <Villa>', buildingKey:'연남동::a <villa>', dong:'연남동', contractCount:8, medianMonthlyRentWon:720000, medianDepositWon:20000000, typicalAreaSqm:23.5 },
  { buildingName:'B House', buildingKey:'연남동::b house', dong:'연남동', contractCount:2, medianMonthlyRentWon:650000, medianDepositWon:10000000, typicalAreaSqm:20 }
];
const fxRates = { USD:0.00072, CNY:0.0052 };

function base(lang='en') {
  return { lang, areaCode:'11440', districtName:'Mapo-gu', dong:'연남동', propertyType:'villa', summary, buildings, fxRates };
}

test('English Dong HTML has canonical, hreflang, index metadata, Dataset JSON-LD and plain building anchors', () => {
  const html = renderDongPage(base('en'));
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/seoul\/mapo-gu\/yeonnam-dong\/villa\/">/);
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/seoul\/mapo-gu\/yeonnam-dong\/villa\/"/);
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, /G-6SXH5BREDP/);
  const buildingUrl = routes.buildBuildingSeoUrl({ areaCode:'11440', dong:'연남동', propertyType:'villa', building:buildings[0], lang:'en' });
  assert.ok(html.includes(`href="${buildingUrl}"`));
  assert.match(html, /Jul 31, 2026/);
  assert.match(html, /\$504/); // 700,000 KRW at injected test rate
  assert.ok(!html.includes('A <Villa>'), 'dynamic building names must be escaped');
  assert.ok(html.includes('A &lt;Villa&gt;'));
});

test('Chinese Dong HTML is genuinely localized and uses CNY as primary display', () => {
  const html = renderDongPage(base('zh'));
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /延南洞 \(연남동\)/);
  assert.match(html, /租金行情/);
  assert.match(html, /2026年7月31日/);
  assert.match(html, /¥3,640/); // 700,000 KRW at injected test rate
  assert.match(html, /韩国国土交通部/);
  assert.doesNotMatch(html, /Median monthly rent/);
});

test('building quality gate indexes substantive pages and noindexes sparse pages', () => {
  assert.equal(isBuildingIndexable({ contractCount:3, medianMonthlyRentWon:700000 }), true);
  assert.equal(isBuildingIndexable({ contractCount:2, medianMonthlyRentWon:700000 }), false);
  assert.equal(isBuildingIndexable({ contractCount:5, medianMonthlyRentWon:null, medianDepositWon:null }), false);
});

test('building page includes Dong comparison, recent contracts, back link and quality-gated robots', () => {
  const detail = {
    ...buildings[0], contractCount:4, quarterChangePct:3.1,
    monthlyTrend:[{month:'2026-05',count:1,medianMonthlyRentWon:680000},{month:'2026-06',count:1,medianMonthlyRentWon:700000},{month:'2026-07',count:2,medianMonthlyRentWon:720000}],
    recentTransactions:[{contractDate:'2026-07-30',areaSqm:23.5,depositWon:20000000,monthlyRentWon:720000}]
  };
  const html = renderBuildingPage({ ...base('en'), detail });
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.match(html, /A &lt;Villa&gt;/);
  assert.match(html, /about 2\.9% above the Yeonnam-dong median/i);
  assert.match(html, /Back to Yeonnam-dong/);
  assert.match(html, /Check this rent/);
  assert.match(html, /Jul 2026/);

  const sparse = renderBuildingPage({ ...base('en'), detail:{ ...detail, contractCount:2 } });
  assert.match(sparse, /<meta name="robots" content="noindex,follow">/);
});

test('error pages are noindex and neutral', () => {
  const html = renderErrorPage({ lang:'zh', status:503, title:'数据暂时不可用', message:'请稍后再试。' });
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /数据暂时不可用/);
});

test('SEO page copy never claims current availability or a listing marketplace', () => {
  const combined = renderDongPage(base('en')) + renderBuildingPage({ ...base('en'), detail:{ ...buildings[0], contractCount:4, recentTransactions:[], monthlyTrend:[] } });
  assert.doesNotMatch(combined, /available now|browse listings|contact landlord|book a viewing|current listings/i);
});
