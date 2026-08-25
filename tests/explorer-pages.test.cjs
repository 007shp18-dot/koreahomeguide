const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const utils = require('../explore/explorer-utils.js');
const config = require('../providers/seoul-config.cjs');

test('explorer utility exposes locale-aware housing labels', () => {
  assert.equal(utils.propertyTypeLabel('villa','en'), 'Low-rise multifamily / Villa (연립·다세대)');
  assert.equal(utils.propertyTypeLabel('villa','zh-CN'), '低层多户住宅 / Villa（연립·다세대）');
});

test('provider district codes remain unchanged after catalog adoption', () => {
  assert.equal(config.SEOUL_DISTRICTS['11680'], 'Gangnam-gu');
  assert.equal(config.SEOUL_DISTRICT_SLUGS['gangnam-gu'], '11680');
});

test('explorer page is a sparse, indexable Seoul rent-data surface rather than a listings search', () => {
  const html = fs.readFileSync('explore/index.html','utf8');
  assert.match(html, /<title>Seoul Rent Explorer \| Official Building-Level Rental Data<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/koreahomeguide\.com\/explore\/"/);
  assert.match(html, /SEOUL RENT EXPLORER/);
  assert.match(html, /Compare neighborhoods before you choose\./);
  assert.match(html, /Official signed rental transactions — not live listings\./);
  for (const code of ['11680','11440','11170','11200','11560']) assert.match(html, new RegExp(`value="${code}"`));
  for (const type of ['apartment','officetel','villa']) assert.match(html, new RegExp(`value="${type}"`));
  for (const id of ['metricRent','metricDeposit','metricContracts','metricChange','buildingList']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /<script defer src="\/privacy-consent\.js"><\/script>/);
  assert.doesNotMatch(html, /For rent|Book a viewing|Contact landlord/i);
});

test('explorer runtime calls area API, supports FX presentation, and links to building detail', () => {
  const js = fs.readFileSync('explore/app.js','utf8');
  assert.match(js, /\/api\/explore-area/);
  assert.match(js, /\/api\/fx/);
  assert.match(js, /buildBuildingDetailUrl/);
  assert.match(js, /quarterChangePct/);
});

test('building detail URL helper preserves the selected area, type, and normalized key safely', () => {
  assert.equal(
    utils.buildBuildingDetailUrl({ lawdCd:'11680', type:'officetel', buildingKey:'강남 푸르지오시티' }),
    '/explore/building/?lawdCd=11680&type=officetel&buildingKey=%EA%B0%95%EB%82%A8+%ED%91%B8%EB%A5%B4%EC%A7%80%EC%98%A4%EC%8B%9C%ED%8B%B0'
  );
});

test('explorer includes a compact neighborhood drill-down and persists dong state in API and URLs', () => {
  const html = fs.readFileSync('explore/index.html','utf8');
  const js = fs.readFileSync('explore/app.js','utf8');
  assert.match(html, /COMPARE NEIGHBORHOODS/);
  assert.match(html, /id="dongList"/);
  assert.match(js, /\/api\/explore-dong/);
  assert.match(js, /query\.get\('dong'\)/);
  assert.match(js, /View neighborhood/);
  assert.match(js, /params\.set\('dong'/);
});

test('building detail URL helper can retain dong context without changing old links', () => {
  assert.equal(
    utils.buildBuildingDetailUrl({ lawdCd:'11440', type:'villa', dong:'연남동', buildingKey:'연남동::트윈빌라' }),
    '/explore/building/?lawdCd=11440&type=villa&dong=%EC%97%B0%EB%82%A8%EB%8F%99&buildingKey=%EC%97%B0%EB%82%A8%EB%8F%99%3A%3A%ED%8A%B8%EC%9C%88%EB%B9%8C%EB%9D%BC'
  );
});

test('building detail renders dong metadata and preserves dong when returning to explorer', () => {
  const js = fs.readFileSync('explore/building/app.js','utf8');
  const html = fs.readFileSync('explore/building/index.html','utf8');
  assert.match(js, /data\.dong/);
  assert.match(js, /params\.set\('dong'/);
  assert.match(html, /Back to Rent Explorer/);
});
