const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('home navigation and footer discover the Rent Explorer', () => {
  const html = fs.readFileSync('index.html','utf8');
  assert.match(html, /href="\/explore\/"[^>]*>Explore Rents</);
  const matches = html.match(/href="\/explore\/"/g) || [];
  assert.ok(matches.length >= 2, 'home should link to explorer in navigation and footer');
});

test('all 15 rent SEO pages hand off to the explorer with matching district and property type', () => {
  const districtCodes = {
    'gangnam-gu':'11680','mapo-gu':'11440','yongsan-gu':'11170','seongdong-gu':'11200','yeongdeungpo-gu':'11560'
  };
  for (const [district, lawdCd] of Object.entries(districtCodes)) {
    for (const type of ['apartment','officetel','villa']) {
      const html = fs.readFileSync(path.join('rent',district,type,'index.html'),'utf8');
      const href = `/explore/?lawdCd=${lawdCd}&amp;type=${type}`;
      assert.ok(html.includes(href), `${district}/${type} should link to ${href}`);
    }
  }
});

test('migrated explorer leaves the sitemap and redirects while building detail stays unindexed', () => {
  const sitemap = fs.readFileSync('sitemap-static.xml','utf8');
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.doesNotMatch(sitemap, /https:\/\/koreahomeguide\.com\/explore\//);
  assert.doesNotMatch(sitemap, /https:\/\/koreahomeguide\.com\/explore\/building\//);
  assert.ok(config.redirects.some((redirect) => (
    redirect.source === '/explore/'
    && redirect.destination === 'https://www.signedprice.com/kr/seoul/explore/'
    && redirect.statusCode === 301
  )));
});
