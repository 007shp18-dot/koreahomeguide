const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('share card is a 1200 by 630 privacy-safe artifact', () => {
  const card = require('../result-share-card.js');
  const svg = card.createCardSvg({
    verdict:'Above recent levels', evidence:'Strong', comparableCount:'24', nextAction:'Check the contract.',
    depositWon:99_000_000, monthlyRentWon:9_999_999, email:'private@example.com'
  }, 'en');
  assert.match(svg, /width="1200" height="630"/);
  assert.match(svg, /Above recent levels/);
  assert.match(svg, /24 official signed contracts/);
  assert.doesNotMatch(svg, /99000000|9999999|private@example\.com/);
  assert.match(fs.readFileSync('lead-capture.js','utf8'), /data-download-card/);
});

test('district compare is static, KRW-first and uses the existing Explorer endpoint', () => {
  const html = fs.readFileSync('compare/index.html','utf8');
  const app = fs.readFileSync('compare/app.js','utf8');
  assert.match(html, /Compare two Seoul rent markets/);
  assert.match(html, /id="compareAreaA"/);
  assert.match(html, /id="compareAreaB"/);
  assert.match(html, /Deposit-adjusted ₩\/㎡/);
  assert.match(app, /\/api\/explore-area\?/);
  assert.match(app, /Promise\.all/);
  assert.doesNotMatch(app, /\/api\/compare/);
  const zh = fs.readFileSync('zh/compare/index.html','utf8');
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/compare\/"/);
  assert.match(zh, /比较首尔两个租赁市场/);
  assert.match(zh, /src="\/compare\/app\.js"/);
  assert.match(app, /document\.documentElement\.lang/);
});

test('embed snapshot keeps a crawlable credit and reports its height', () => {
  const html = fs.readFileSync('embed/index.html','utf8');
  const app = fs.readFileSync('embed/app.js','utf8');
  const loader = fs.readFileSync('embed.js','utf8');
  assert.match(html, /href="https:\/\/koreahomeguide\.com\/explore\/"/);
  assert.match(app, /\/api\/explore-area\?/);
  assert.match(app, /postMessage\(\{ type:'khg:embed-height'/);
  assert.match(loader, /data-khg-rent-snapshot/);
  assert.match(loader, /message\.data\.type (?:===|!==) 'khg:embed-height'/);
});

test('complete compare surface is discoverable without indexing the parameterized embed', () => {
  const sitemap = fs.readFileSync('sitemap-static.xml','utf8');
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/compare\//);
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/zh\/compare\//);
  assert.doesNotMatch(sitemap, /https:\/\/koreahomeguide\.com\/embed\//);
});
