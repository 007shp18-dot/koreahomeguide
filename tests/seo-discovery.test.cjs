const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('homepage and sitemap expose guide hubs, expanded market pages, and Rent Explorer', () => {
  const home=fs.readFileSync('index.html','utf8');
  const zh=fs.readFileSync('zh/index.html','utf8');
  const sitemap=fs.readFileSync('sitemap-static.xml','utf8');
  assert.match(home, /\/explore\//);
  assert.match(home, /\/tools\/seoul-rent-check\//);
  assert.match(home, /\/guides\/wolse-vs-jeonse\//);
  assert.match(zh, /\/zh\/tools\/seoul-rent-check\//);
  assert.match(zh, /\/zh\/guides\/wolse-vs-jeonse\//);
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/guides\//);
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/privacy\//);
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/zh\/privacy\//);
  assert.equal((sitemap.match(/<url>/g)||[]).length,48);
  assert.equal(sitemap.includes('/api/'),false);
});

test('cold-start homepage guide section opens the real guide pages in both languages', () => {
  const home=fs.readFileSync('index.html','utf8');
  const zh=fs.readFileSync('zh/index.html','utf8');
  const enGrid=(home.match(/<div class="funnel-guides">([\s\S]*?)<\/div>/)||[])[1]||'';
  const zhGrid=(zh.match(/<div class="funnel-guides">([\s\S]*?)<\/div>/)||[])[1]||'';
  for(const href of ['/guides/wolse-vs-jeonse/','/guides/before-you-sign/','/guides/seoul-brokerage-fees/']) assert.match(enGrid,new RegExp(`href="${href.replaceAll('/','\\/')}"`));
  for(const href of ['/zh/guides/wolse-vs-jeonse/','/zh/guides/before-you-sign/','/zh/guides/seoul-brokerage-fees/']) assert.match(zhGrid,new RegExp(`href="${href.replaceAll('/','\\/')}"`));
});
