const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderDongPage } = require('../seo/seo-page-renderer.cjs');

const CORE_FILES = [
  'index.html', 'zh/index.html',
  'tools/seoul-rent-check/index.html', 'zh/tools/seoul-rent-check/index.html',
  'explore/index.html', 'zh/explore/index.html'
];
const imageUrl = 'https://koreahomeguide.com/assets/og/og-default.png';

test('core public pages declare one large social image', () => {
  for (const file of CORE_FILES) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.equal((html.match(/property="og:image"/g) || []).length, 1, file);
    assert.match(html, new RegExp(`property="og:image" content="${imageUrl.replace(/[./]/g, '\\$&')}"`), file);
    assert.match(html, /property="og:image:width" content="1200"/, file);
    assert.match(html, /property="og:image:height" content="630"/, file);
    assert.match(html, /name="twitter:card" content="summary_large_image"/, file);
  }
});

test('home social titles state the localized rent-fairness proposition', () => {
  assert.match(fs.readFileSync('index.html', 'utf8'), /property="og:title" content="Is your Seoul rent actually fair\? \| KoreaHomeGuide"/);
  assert.match(fs.readFileSync('zh/index.html', 'utf8'), /property="og:title" content="你的首尔租金报价真的合理吗？ \| KoreaHomeGuide"/);
});

test('dynamic market pages keep page-specific titles with the shared image', () => {
  const html = renderDongPage({
    lang:'en', areaCode:'11440', districtName:'Mapo-gu', dong:'연남동', propertyType:'villa', fxRates:{},
    summary:{
      totalContracts:3, contractCount:3, monthlyRentCount:3, jeonseCount:0,
      medianMonthlyRentWon:800000, medianDepositWon:10000000, medianJeonseDepositWon:null,
      typicalAreaSqm:25, quarterChangePct:0, monthsUsed:6, dataThroughMonth:'2026-07',
      recentTransactions:[], depositBands:[], areaGroups:[], contractTypeCounts:{new:3,renewal:0,unknown:0}
    },
    buildings:[]
  });
  assert.match(html, /property="og:title" content="[^"]*Yeonnam-dong[^"]*"/);
  assert.match(html, new RegExp(`property="og:image" content="${imageUrl.replace(/[./]/g, '\\$&')}"`));
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});

test('share-image source and rendered asset are present', () => {
  const svg = fs.readFileSync(path.join(__dirname, '..', 'assets/og/og-default.svg'), 'utf8');
  assert.match(svg, /viewBox="0 0 1200 630"/);
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'assets/og/og-default.png')), true);
});
