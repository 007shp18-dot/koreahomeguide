const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  MIN_DONG_CONTRACTS,
  isDongIndexable,
  buildRelatedDongLinks,
  enhanceDongHtml
} = require('../seo/dong-seo-v10-8.cjs');

const summary = {
  totalContracts:18,
  medianMonthlyRentWon:700000,
  medianDepositWon:20000000,
  typicalAreaSqm:24.5,
  dataThroughMonth:'2026-07'
};

test('Dong index-quality gate requires at least ten reported contracts', () => {
  assert.equal(MIN_DONG_CONTRACTS, 10);
  assert.equal(isDongIndexable({ contractCount:9 }), false);
  assert.equal(isDongIndexable({ contractCount:10 }), true);
  assert.equal(isDongIndexable({ totalContracts:18 }), true);
});

test('related neighborhood links stay inside the same curated district', () => {
  const html = buildRelatedDongLinks({ areaCode:'11440', dong:'연남동', propertyType:'villa', lang:'en' });
  assert.match(html, /seogyo-dong\/villa/);
  assert.match(html, /mangwon-dong\/villa/);
  assert.doesNotMatch(html, /yeoksam-dong/);
  assert.doesNotMatch(html, /yeonnam-dong\/villa/);
});

test('Dong page enhancement adds search-first metrics, market snapshot and nearby links', () => {
  const base = '<html><head><title>Yeonnam-dong Villa Rent Prices | Seoul</title></head><body><h1>Yeonnam-dong Villa / Low-rise (연립·다세대) Rent Prices</h1><section class="seo-grid"><div>old metrics</div></section><section class="seo-section"><h2>Monthly rent by deposit</h2></section><section class="seo-section"><h2>Continue comparing</h2></section></body></html>';
  const html = enhanceDongHtml(base, { lang:'en', areaCode:'11440', districtName:'Mapo-gu', dong:'연남동', propertyType:'villa', summary });
  assert.match(html, /Rent Market \| Seoul/);
  assert.match(html, /Median monthly rent/);
  assert.match(html, /₩700,000/);
  assert.match(html, /Median deposit/);
  assert.match(html, /₩20,000,000/);
  assert.match(html, /Median size/);
  assert.match(html, /24\.5㎡/);
  assert.match(html, /Market snapshot/);
  assert.match(html, /18 reported villa contracts through Jul 2026/);
  assert.match(html, /Nearby neighborhoods/);
  assert.match(html, /seogyo-dong\/villa/);
  assert.doesNotMatch(html, /old metrics/);
});

test('Chinese enhancement keeps localized title and inserts localized modules', () => {
  const base = '<html><body><h1>延南洞 低层住宅租金行情</h1><section class="seo-grid"><div>旧指标</div></section><section class="seo-section"><h2>按押金区间看月租</h2></section><section class="seo-section"><h2>继续比较</h2></section></body></html>';
  const html = enhanceDongHtml(base, { lang:'zh', areaCode:'11440', districtName:'Mapo-gu', dong:'연남동', propertyType:'villa', summary });
  assert.match(html, /月租中位数/);
  assert.match(html, /市场概览/);
  assert.match(html, /附近街区/);
  assert.match(html, /2026年7月/);
  assert.doesNotMatch(html, /Rent Market/);
});

test('page endpoint and sitemap consume the same Dong quality helper', () => {
  const pageApi = fs.readFileSync('api/seo-dong-page.js','utf8');
  const sitemapApi = fs.readFileSync('api/sitemap-market.js','utf8');
  assert.match(pageApi, /isDongIndexable\(summary\)/);
  assert.match(sitemapApi, /isDongIndexable\(item\)/);
  assert.doesNotMatch(pageApi, /< 1/);
});
