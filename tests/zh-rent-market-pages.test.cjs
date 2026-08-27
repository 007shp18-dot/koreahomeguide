const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const districts = {
  'gangnam-gu': { code: '11680', zh: '江南区' },
  'mapo-gu': { code: '11440', zh: '麻浦区' },
  'yongsan-gu': { code: '11170', zh: '龙山区' },
  'seongdong-gu': { code: '11200', zh: '城东区' },
  'yeongdeungpo-gu': { code: '11560', zh: '永登浦区' }
};
const types = ['apartment','officetel','villa'];

test('all 15 Chinese rent market pages exist and are localized', () => {
  const titles = new Set();
  for (const [district, meta] of Object.entries(districts)) {
    for (const type of types) {
      const file = `zh/rent/${district}/${type}/index.html`;
      assert.equal(fs.existsSync(file), true, file);
      const html = fs.readFileSync(file, 'utf8');
      assert.match(html, /<html lang="zh-CN">/);
      assert.match(html, new RegExp(`data-lawd-cd="${meta.code}"`));
      assert.match(html, new RegExp(`data-property-type="${type}"`));
      assert.match(html, new RegExp(`https://koreahomeguide.com/zh/rent/${district}/${type}/`));
      assert.match(html, new RegExp(`hreflang="en" href="https://koreahomeguide.com/rent/${district}/${type}/"`));
      assert.match(html, new RegExp(`hreflang="zh-CN" href="https://koreahomeguide.com/zh/rent/${district}/${type}/"`));
      assert.match(html, /<option value="KRW" selected>/);
      assert.match(html, /\/zh\/explore\/\?lawdCd=/);
      assert.match(html, /\/zh\/tools\/seoul-rent-check\//);
      assert.match(html, /\/zh\/tools\/brokerage-fee-calculator\//);
      assert.match(html, /\/zh\/rent-market-page\.js/);
      assert.match(html, new RegExp(meta.zh));
      assert.match(html, /韩国国土交通部|国土交通部/);
      assert.doesNotMatch(html, /OFFICIAL RENTAL TRANSACTIONS|Recently signed|How rent changes by size|What renters should know/);
      const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
      assert.ok(title && !titles.has(title), `unique title: ${file}`);
      titles.add(title);
      const chineseChars = (html.match(/[\u3400-\u9fff]/g) || []).length;
      assert.ok(chineseChars >= 450, `substantial Chinese copy: ${file} (${chineseChars})`);
    }
  }
});

test('Chinese market runtime renders Chinese states and keeps CNY locale', () => {
  const file = 'zh/rent-market-page.js';
  assert.equal(fs.existsSync(file), true, file);
  const js = fs.readFileSync(file, 'utf8');
  assert.match(js, /zh-CN/);
  assert.match(js, /正在加载官方租赁成交数据/);
  assert.match(js, /月租合同/);
  assert.match(js, /近 3 个月/);
  assert.match(js, /\/api\/rent-market/);
  assert.match(js, /areaGroups/);
  assert.match(js, /recentContracts/);
});

test('sitemap includes all 15 Chinese rent market pages', () => {
  const xml = fs.readFileSync('sitemap-static.xml','utf8');
  for (const district of Object.keys(districts)) {
    for (const type of types) {
      assert.match(xml, new RegExp(`<loc>https://koreahomeguide.com/zh/rent/${district}/${type}/<\\/loc>`));
    }
  }
});

test('English market pages point to their exact Chinese counterparts', () => {
  for (const district of Object.keys(districts)) {
    for (const type of types) {
      const file = `rent/${district}/${type}/index.html`;
      const html = fs.readFileSync(file, 'utf8');
      assert.match(html, new RegExp(`hreflang="zh-CN" href="https://koreahomeguide.com/zh/rent/${district}/${type}/"`));
      assert.match(html, new RegExp(`class="language-link" href="/zh/rent/${district}/${type}/"`));
    }
  }
});
