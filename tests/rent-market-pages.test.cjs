const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const districts = {
  'gangnam-gu':'11680', 'mapo-gu':'11440', 'yongsan-gu':'11170', 'seongdong-gu':'11200', 'yeongdeungpo-gu':'11560'
};
const types = ['apartment','officetel','villa'];

test('all 15 rent pages exist with unique canonical, district code, type, and substantial copy', () => {
  const titles = new Set();
  for (const [district, code] of Object.entries(districts)) {
    for (const type of types) {
      const file = `rent/${district}/${type}/index.html`;
      assert.equal(fs.existsSync(file), true, file);
      const html = fs.readFileSync(file,'utf8');
      assert.match(html, new RegExp(`data-lawd-cd="${code}"`));
      assert.match(html, new RegExp(`data-property-type="${type}"`));
      assert.match(html, new RegExp(`https://koreahomeguide.com/rent/${district}/${type}/`));
      assert.match(html, /rent-market-page\.js/);
      const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
      assert.ok(title && !titles.has(title), `unique title: ${file}`);
      titles.add(title);
      assert.ok(html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length >= 180, `substantial copy: ${file}`);
      assert.match(html, /\/tools\/seoul-rent-check\//);
      assert.match(html, /\/tools\/brokerage-fee-calculator\//);
    }
  }
});

test('rent market runtime calls the shared API and renders contextual area groups plus recent contracts', () => {
  const js = fs.readFileSync('rent-market-page.js','utf8');
  assert.match(js, /\/api\/rent-market/);
  assert.match(js, /areaGroups/);
  assert.match(js, /recentContracts/);
  assert.match(js, /quarterChangePct/);
});
