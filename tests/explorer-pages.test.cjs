const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const utils = require('../explore/explorer-utils.js');

test('explorer page is a sparse, indexable Seoul rent-data surface rather than a listings search', () => {
  const html = fs.readFileSync('explore/index.html','utf8');
  assert.match(html, /<title>Seoul Rent Explorer \| Official Building-Level Rental Data<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/koreahomeguide\.com\/explore\/"/);
  assert.match(html, /SEOUL RENT EXPLORER/);
  assert.match(html, /Understand Seoul rent before you sign\./);
  assert.match(html, /Official signed rental transactions — not live listings\./);
  for (const code of ['11680','11440','11170','11200','11560']) assert.match(html, new RegExp(`value="${code}"`));
  for (const type of ['apartment','officetel','villa']) assert.match(html, new RegExp(`value="${type}"`));
  for (const id of ['metricRent','metricDeposit','metricContracts','metricChange','buildingList']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /G-6SXH5BREDP/);
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
