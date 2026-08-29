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
  newContractMonthlyRentCount:10, renewalMonthlyRentCount:2, contractTypeCounts:{new:10,renewal:2,unknown:6},
  depositBands:[{minDepositWon:10000000,maxDepositWon:30000000,count:10,medianDepositWon:20000000,medianMonthlyRentWon:700000}],
  areaGroups:[{approxAreaSqm:25,count:10,medianAreaSqm:24.5,medianDepositWon:20000000,medianMonthlyRentWon:700000,depositBands:[{minDepositWon:10000000,maxDepositWon:30000000,count:10,medianDepositWon:20000000,medianMonthlyRentWon:700000}]}],
  typicalAreaSqm:24.5, quarterChangePct:4.2, monthsUsed:6, dataThroughMonth:'2026-07',
  recentTransactions:[
    { building:'A <Villa>', areaSqm:23.1, depositWon:20000000, monthlyRentWon:700000, contractDate:'2026-07-31', contractType:'new' },
    { building:'B House', areaSqm:25.0, depositWon:180000000, monthlyRentWon:0, contractDate:'2026-07-30' }
  ]
};
const buildings = [
  { buildingName:'A <Villa>', buildingKey:'연남동::a <villa>', dong:'연남동', contractCount:8, medianMonthlyRentWon:720000, medianDepositWon:20000000, typicalAreaSqm:23.5, depositBands:[{minDepositWon:10000000,maxDepositWon:30000000,count:8,medianDepositWon:20000000,medianMonthlyRentWon:720000}] },
  { buildingName:'B House', buildingKey:'연남동::b house', dong:'연남동', contractCount:2, medianMonthlyRentWon:650000, medianDepositWon:10000000, typicalAreaSqm:20, depositBands:[{minDepositWon:10000000,maxDepositWon:30000000,count:2,medianDepositWon:10000000,medianMonthlyRentWon:650000}] }
];
const fxRates = { USD:0.00072, CNY:0.0052 };

function base(lang='en') {
  return { lang, areaCode:'11440', districtName:'Mapo-gu', dong:'연남동', propertyType:'villa', summary, buildings, fxRates };
}

function datasetsFrom(html) {
  const raw = (html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/) || [])[1];
  assert.ok(raw, 'page must include JSON-LD');
  const graph = JSON.parse(raw)['@graph'];
  const datasets = [];
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (value['@type'] === 'Dataset') datasets.push(value);
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  };
  visit(graph);
  return datasets;
}

test('English Dong HTML has canonical, hreflang, index metadata, Dataset JSON-LD and nofollow Explorer building links', () => {
  const html = renderDongPage(base('en'));
  assert.match(html, /<nav><a href="\/explore\/">Explore<\/a><a href="\/tools\/seoul-rent-check\/">Rent Check<\/a><a href="\/guides\/">Guides<\/a><\/nav>/);
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/seoul\/mapo-gu\/yeonnam-dong\/villa\/">/);
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/seoul\/mapo-gu\/yeonnam-dong\/villa\/"/);
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, /<script defer src="\/privacy-consent\.js"><\/script>/);
  assert.doesNotMatch(html, /googletagmanager\.com/);
  assert.match(html, /Mapo-gu \(마포구\)/);
  assert.match(html, /Yeonnam-dong \(연남동\)/);
  assert.match(html, /Villa \/ low-rise multifamily \(연립·다세대\)/);
  const buildingUrl = routes.buildBuildingSeoUrl({ areaCode:'11440', dong:'연남동', propertyType:'villa', building:buildings[0], lang:'en' });
  assert.ok(!html.includes(`href="${buildingUrl}"`));
  assert.match(html, /href="\/explore\/building\/\?[^\"]+" rel="nofollow"/);
  assert.match(html, /src="\/acquisition-context\.js"/);
  assert.match(html, /src="\/acquisition-links\.js"/);
  assert.ok(html.indexOf('/acquisition-context.js') < html.indexOf('/acquisition-links.js'));
  assert.match(html, /Jul 31, 2026/);
  assert.match(html, /class="seo-money money-primary">₩700,000/);
  assert.match(html, /class="seo-fx fx-secondary">≈ \$504/); // 700,000 KRW at injected test rate
  assert.ok(!html.includes('A <Villa>'), 'dynamic building names must be escaped');
  assert.ok(html.includes('A &lt;Villa&gt;'));
});

test('Chinese Dong HTML is genuinely localized and keeps KRW primary', () => {
  const html = renderDongPage(base('zh'));
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /麻浦区（마포구）/);
  assert.match(html, /延南洞（연남동）/);
  assert.match(html, /租金行情/);
  assert.match(html, /2026年7月31日/);
  assert.match(html, /class="seo-money money-primary">₩700,000/);
  assert.match(html, /class="seo-fx fx-secondary">≈ ¥3,640/); // 700,000 KRW at injected test rate
  assert.match(html, /韩国国土交通部/);
  assert.doesNotMatch(html, /Median monthly rent/);
});

test('dynamic SEO cards suppress prices and medians below five observations', () => {
  const sparseBand = {
    minDepositWon:10_000_000,
    maxDepositWon:30_000_000,
    count:4,
    medianDepositWon:88_888_888,
    medianMonthlyRentWon:9_999_999
  };
  const sparseSummary = {
    ...summary,
    depositBands:[sparseBand],
    areaGroups:[{ approxAreaSqm:25, count:4, medianAreaSqm:24.5, medianDepositWon:88_888_888, medianMonthlyRentWon:9_999_999, depositBands:[sparseBand] }]
  };

  const en = renderDongPage({ ...base('en'), summary:sparseSummary });
  const zh = renderDongPage({ ...base('zh'), summary:sparseSummary });

  assert.match(en, /Under 5 contracts/);
  assert.match(zh, /少于 5 份合同/);
  assert.doesNotMatch(en, /₩9,999,999|₩88,888,888|Median observed size/);
  assert.doesNotMatch(zh, /₩9,999,999|₩88,888,888|实际面积中位数/);
});

test('sufficient dynamic SEO area cards lead with rent and keep count as context', () => {
  const en = renderDongPage(base('en'));
  const zh = renderDongPage(base('zh'));
  assert.match(en, /Around 25\.0㎡<\/span><strong><span class="seo-money money-primary">₩700,000/);
  assert.match(en, /10 contracts.*Median deposit/s);
  assert.match(zh, /约 25\.0㎡<\/span><strong><span class="seo-money money-primary">₩700,000/);
  assert.match(zh, /10 份合同.*押金中位数/s);
});

test('dynamic evidence rows carry localized mobile labels', () => {
  const en = renderDongPage(base('en'));
  const zh = renderDongPage(base('zh'));
  assert.match(en, /data-label="Building"/);
  assert.match(en, /data-label="Monthly rent"/);
  assert.match(en, /data-label="Contract date"/);
  assert.match(zh, /data-label="建筑"/);
  assert.match(zh, /data-label="月租"/);
  assert.match(zh, /data-label="签约日期"/);
});

test('dynamic evidence tables become mobile cards without a forced wide table', () => {
  const html = renderDongPage(base('en'));
  assert.match(html, /@media\(max-width:640px\)\{[^}]*\.seo-table\{min-width:0/);
  assert.match(html, /\.seo-table td::before\{content:attr\(data-label\)/);
  assert.match(html, /\.seo-table thead\{display:none/);
});

test('every Dataset includes a description', () => {
  for (const lang of ['en', 'zh']) {
    for (const dataset of datasetsFrom(renderDongPage(base(lang)))) {
      assert.ok(String(dataset.description || '').trim(), `${lang}: ${dataset.name} description`);
    }
  }
});

test('every Dataset description stays within Google’s 50–5000 character range', () => {
  for (const lang of ['en', 'zh']) {
    for (const dataset of datasetsFrom(renderDongPage(base(lang)))) {
      const length = String(dataset.description || '').length;
      assert.ok(length >= 50 && length <= 5000, `${lang}: ${dataset.name} description length ${length}`);
    }
  }
});

test('every Dataset declares the official public-data license URL', () => {
  const license = 'https://www.data.go.kr/ugs/selectPortalPolicyView.do';
  for (const lang of ['en', 'zh']) {
    for (const dataset of datasetsFrom(renderDongPage(base(lang)))) {
      assert.equal(dataset.license, license, `${lang}: ${dataset.name} license`);
    }
  }
});

test('every Dataset creator uses a Google-supported object type', () => {
  for (const lang of ['en', 'zh']) {
    for (const dataset of datasetsFrom(renderDongPage(base(lang)))) {
      assert.ok(['Person', 'Organization'].includes(dataset.creator && dataset.creator['@type']), `${lang}: ${dataset.name} creator type`);
    }
  }
});

test('source Dataset preserves official MOLIT provenance without claiming source ownership', () => {
  const [derived, source] = datasetsFrom(renderDongPage(base('en')));
  assert.equal(derived.creator.name, 'KoreaHomeGuide');
  assert.equal(source.creator.name, 'Ministry of Land, Infrastructure and Transport, Republic of Korea');
});

test('English Dong HTML omits Chinese hreflang outside localized districts', () => {
  const html = renderDongPage({
    ...base('en'),
    areaCode:'11620',
    districtName:'Gwanak-gu',
    dong:'신림동'
  });
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/seoul\/gwanak-gu\//);
  assert.doesNotMatch(html, /hreflang="zh-CN"/);
  assert.match(html, /class="language-link" href="\/zh\/explore\/\?lawdCd=11620/);
});

test('building pages stay out of search regardless of transaction depth', () => {
  assert.equal(isBuildingIndexable({ contractCount:3, medianMonthlyRentWon:700000 }), false);
  assert.equal(isBuildingIndexable({ contractCount:2, medianMonthlyRentWon:700000 }), false);
  assert.equal(isBuildingIndexable({ contractCount:5, medianMonthlyRentWon:null, medianDepositWon:null }), false);
});

test('building page includes contextual rent sections and remains noindex', () => {
  const detail = {
    ...buildings[0], contractCount:4, quarterChangePct:3.1, medianJeonseDepositWon:180000000, newContractMonthlyRentCount:3, renewalMonthlyRentCount:1, contractTypeCounts:{new:3,renewal:1,unknown:0}, areaGroups:[{approxAreaSqm:25,count:4,medianAreaSqm:23.5,depositBands:buildings[0].depositBands}],
    monthlyTrend:[{month:'2026-05',count:1,medianMonthlyRentWon:680000},{month:'2026-06',count:1,medianMonthlyRentWon:700000},{month:'2026-07',count:2,medianMonthlyRentWon:720000}],
    recentTransactions:[{contractDate:'2026-07-30',areaSqm:23.5,depositWon:20000000,monthlyRentWon:720000,contractType:'new'}]
  };
  const html = renderBuildingPage({ ...base('en'), detail });
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /A &lt;Villa&gt;/);
  assert.match(html, /Monthly rent by deposit/i);
  assert.match(html, /New vs renewal/i);
  assert.match(html, /Back to Yeonnam-dong/);
  assert.match(html, /Check a rent quote/);
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
