const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderBuildingPage, renderDongPage } = require('../seo/seo-page-renderer.cjs');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

function fixture(lang='en') {
  const summary = {
    totalContracts: 40, contractCount: 40, newContractMonthlyRentCount: 22, renewalMonthlyRentCount: 5,
    medianJeonseDepositWon: 300000000,
    contractTypeCounts:{new:22,renewal:5,unknown:13},
    depositBands:[{minDepositWon:10000000,maxDepositWon:30000000,count:12,medianDepositWon:20000000,medianMonthlyRentWon:750000}],
    areaGroups:[{approxAreaSqm:25,count:12,medianAreaSqm:24.8,depositBands:[{minDepositWon:10000000,maxDepositWon:30000000,count:12,medianDepositWon:20000000,medianMonthlyRentWon:750000}]}],
    recentTransactions:[{building:'Twin Villa',contractDate:'2026-07-30',areaSqm:24.8,depositWon:20000000,monthlyRentWon:750000,contractType:'new'}]
  };
  const detail = {
    buildingName:'Twin Villa',buildingKey:'연남동::twin villa',dong:'연남동',contractCount:8,newContractMonthlyRentCount:6,renewalMonthlyRentCount:1,
    medianJeonseDepositWon:180000000,typicalAreaSqm:24.1,contractTypeCounts:{new:6,renewal:1,unknown:1},
    depositBands:summary.depositBands,areaGroups:summary.areaGroups,monthlyTrend:[{month:'2026-07',count:5,medianMonthlyRentWon:750000}],recentTransactions:summary.recentTransactions
  };
  return {lang, areaCode:'11440',districtName:'Mapo-gu',dong:'연남동',propertyType:'villa',summary,detail,buildings:[detail],fxRates:{USD:.00072,CNY:.0052}};
}

test('interactive building page has expansion-safe product layout and context rail', () => {
  const html = read('explore/building/index.html');
  assert.match(html, /class="product-layout building-product-layout"/);
  assert.match(html, /class="context-rail"/);
  assert.match(html, /data-slot="sidebar"/);
  assert.match(html, /id="buildingContracts"/);
  assert.match(html, /class="building-rent-check-card/);
});

test('Chinese interactive building page mirrors the context layout', () => {
  const html = read('zh/explore/building/index.html');
  assert.match(html, /class="product-layout building-product-layout"/);
  assert.match(html, /class="context-rail"/);
});

test('server-rendered building and dong pages use the same product layout primitives', () => {
  const f = fixture('en');
  const building = renderBuildingPage(f);
  const dong = renderDongPage(f);
  assert.match(building, /class="seo-page seo-building-page product-layout"/);
  assert.match(building, /class="product-main"/);
  assert.match(building, /class="context-rail"/);
  assert.match(building, /data-slot="sidebar"/);
  assert.match(dong, /class="seo-page product-layout"/);
  assert.match(dong, /class="context-rail"/);
});
