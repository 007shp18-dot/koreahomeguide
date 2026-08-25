const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildRelatedDongLinks,
  marketSnapshotHtml,
  enhanceDongHtml
} = require('../seo/dong-seo-v10-8.cjs');

const summary = {
  totalContracts: 18,
  medianMonthlyRentWon: 700000,
  medianDepositWon: 20000000,
  typicalAreaSqm: 24.5,
  dataThroughMonth: '2026-07',
  recentTransactions: [
    { building:'삼보빌', floor:3, contractDate:'2026-07-29' },
    { building:'삼보빌', floor:5, contractDate:'2026-07-29' }
  ]
};

test('Chinese market snapshot localizes dong and property type', () => {
  const html = marketSnapshotHtml({ lang:'zh', dong:'연남동', districtName:'Mapo-gu', propertyType:'villa', summary });
  assert.match(html, /延南洞 \(연남동\)/);
  assert.match(html, /低层住宅（联排\/多户住宅）/);
  assert.doesNotMatch(html, /연남동的villa页面/);
});

test('Chinese nearby neighborhood labels are localized, not raw Korean', () => {
  const html = buildRelatedDongLinks({ areaCode:'11440', dong:'연남동', propertyType:'villa', lang:'zh' });
  assert.match(html, /西桥洞 \(서교동\)/);
  assert.match(html, /望远洞 \(망원동\)/);
  assert.match(html, /合井洞 \(합정동\)/);
});

test('enhancement adds floor context and conservative duplicate transparency note', () => {
  const base = '<html><body><section class="seo-grid"><div>old</div></section><section class="seo-section"><h2>Monthly rent by deposit</h2></section><section class="seo-section"><h2>Recently signed contracts</h2><p>These are completed reported contracts.</p><div class="seo-table-wrap"><table class="seo-table"><thead><tr><th>Building</th><th>Type</th><th>Size</th><th>Deposit</th><th>Monthly rent</th><th>Contract date</th></tr></thead><tbody><tr><td>A</td><td>New</td><td>20㎡</td><td>10m</td><td>500k</td><td>Jul 29, 2026</td></tr><tr><td>A</td><td>New</td><td>20㎡</td><td>10m</td><td>500k</td><td>Jul 29, 2026</td></tr></tbody></table></div></section><section class="seo-section"><h2>Continue comparing</h2></section></body></html>';
  const html = enhanceDongHtml(base, { lang:'en', areaCode:'11440', districtName:'Mapo-gu', dong:'연남동', propertyType:'villa', summary });
  assert.match(html, /<th>Floor<\/th><th>Contract date<\/th>/);
  assert.match(html, /<td>3F<\/td><td>Jul 29, 2026<\/td>/);
  assert.match(html, /<td>5F<\/td><td>Jul 29, 2026<\/td>/);
  assert.match(html, /Identical-looking rows can represent separate reported contracts/);
  const rowCount = (html.match(/<tbody><tr>|<\/tr><tr>/g) || []).length;
  assert.equal(rowCount, 2, 'ambiguous rows must not be heuristically collapsed');
});
