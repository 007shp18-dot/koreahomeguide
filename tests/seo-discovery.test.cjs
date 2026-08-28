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
  assert.equal((sitemap.match(/<url>/g)||[]).length,75);
  assert.equal(sitemap.includes('/api/'),false);
});

test('cold-start homepage guide section opens the real guide pages in both languages', () => {
  const home=fs.readFileSync('index.html','utf8');
  const zh=fs.readFileSync('zh/index.html','utf8');
  const enGrid=(home.match(/<div class="funnel-guides">([\s\S]*?)<\/div>/)||[])[1]||'';
  const zhGrid=(zh.match(/<div class="funnel-guides">([\s\S]*?)<\/div>/)||[])[1]||'';
  assert.equal((enGrid.match(/class="home-guide-row"/g)||[]).length,3);
  assert.equal((zhGrid.match(/class="home-guide-row"/g)||[]).length,3);
  for(const href of ['/guides/rent-apartment-korea-foreigner/','/guides/wolse-vs-jeonse/','/guides/before-you-sign/']) assert.match(enGrid,new RegExp(`href="${href.replaceAll('/','\\/')}"`));
  for(const href of ['/zh/guides/rent-apartment-korea-foreigner/','/zh/guides/wolse-vs-jeonse/','/zh/guides/before-you-sign/']) assert.match(zhGrid,new RegExp(`href="${href.replaceAll('/','\\/')}"`));
  assert.match(home, /class="funnel-guides-link" href="\/guides\/">View all 8 rental guides/);
  assert.match(zh, /class="funnel-guides-link" href="\/zh\/guides\/">查看全部 8 篇租房指南/);
});
