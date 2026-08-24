const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('homepage and sitemap expose Phase 1 SEO pages plus the v9 Rent Explorer', () => {
  const home = fs.readFileSync('index.html','utf8');
  const zh = fs.readFileSync('zh/index.html','utf8');
  const sitemap = fs.readFileSync('sitemap.xml','utf8');
  assert.match(home, /\/explore\//);
  assert.match(home, /\/tools\/seoul-rent-check\//);
  assert.match(home, /\/rent\/gangnam-gu\/officetel\//);
  assert.match(home, /\/guides\/wolse-vs-jeonse\//);
  assert.match(zh, /\/zh\/tools\/seoul-rent-check\//);
  assert.match(zh, /\/zh\/guides\/wolse-vs-jeonse\//);
  assert.equal((sitemap.match(/<url>/g) || []).length, 44);
  assert.equal(sitemap.includes('/api/'), false);
});

test('homepage guide cards open the real guide pages in both languages', () => {
  const home = fs.readFileSync('index.html','utf8');
  const zh = fs.readFileSync('zh/index.html','utf8');
  const enGrid = (home.match(/<div class="guide-grid">([\s\S]*?)<\/div>\s*<\/section>/) || [])[1] || '';
  const zhGrid = (zh.match(/<div class="guide-grid">([\s\S]*?)<\/div>\s*<\/section>/) || [])[1] || '';
  assert.match(enGrid, /href="\/guides\/wolse-vs-jeonse\//);
  assert.match(enGrid, /href="\/guides\/korea-rental-contract-checklist\//);
  assert.match(enGrid, /href="\/guides\/seoul-brokerage-fees\//);
  assert.match(zhGrid, /href="\/zh\/guides\/wolse-vs-jeonse\//);
  assert.match(zhGrid, /href="\/zh\/guides\/korea-rental-contract-checklist\//);
  assert.match(zhGrid, /href="\/zh\/guides\/seoul-brokerage-fees\//);
});
