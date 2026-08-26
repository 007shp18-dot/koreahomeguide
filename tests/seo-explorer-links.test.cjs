const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const client = require('../explore/explorer-utils.js');
const server = require('../seo/seo-route-utils.cjs');

test('Explorer URL helpers match server canonical Dong paths in EN and ZH', () => {
  assert.equal(
    client.buildDongSeoUrl({ lawdCd:'11440', type:'villa', dong:'연남동', lang:'en' }),
    server.buildDongSeoUrl({ areaCode:'11440', propertyType:'villa', dong:'연남동', lang:'en' })
  );
  assert.equal(
    client.buildDongSeoUrl({ lawdCd:'11440', type:'villa', dong:'연남동', lang:'zh' }),
    server.buildDongSeoUrl({ areaCode:'11440', propertyType:'villa', dong:'연남동', lang:'zh' })
  );
});

test('Explorer exposes the shared Chinese localization policy', () => {
  assert.equal(client.supportsZhIndexing('11440'), true);
  assert.equal(client.supportsZhIndexing('11620'), false);
});

test('Explorer URL helpers match server collision-safe building paths', () => {
  const input = { lawdCd:'11440', type:'villa', dong:'연남동', buildingName:'Twin Villa', buildingKey:'연남동::twin villa', lang:'en' };
  assert.equal(
    client.buildBuildingSeoUrl(input),
    server.buildBuildingSeoUrl({ areaCode:input.lawdCd, propertyType:input.type, dong:input.dong, building:{ buildingName:input.buildingName, buildingKey:input.buildingKey }, lang:'en' })
  );
});

test('EN Explorer keeps neighborhood SEO links but sends building actions only to the interactive view', () => {
  const source = fs.readFileSync('explore/app.js','utf8');
  assert.match(source, /buildDongSeoUrl/);
  assert.match(source, /View neighborhood/);
  assert.doesNotMatch(source, /buildBuildingSeoUrl/);
  assert.match(source, /Open building details/);
  assert.match(source, /buildBuildingDetailUrl/);
  assert.match(source, /<a rel="nofollow" href="\$\{escapeHtml\(interactiveHref\)\}"/);
});

test('ZH Explorer keeps localized neighborhood SEO links but sends building actions only to the interactive view', () => {
  const source = fs.readFileSync('zh/explore/app.js','utf8');
  assert.match(source, /buildDongSeoUrl/);
  assert.match(source, /supportsZhIndexing\(districtCode\)/);
  assert.match(source, /查看街区/);
  assert.doesNotMatch(source, /buildBuildingSeoUrl/);
  assert.match(source, /查看建筑成交/);
  assert.match(source, /\/zh\/explore\/building/);
  assert.match(source, /<a rel="nofollow" href="\$\{escapeHtml\(interactiveHref\)\}"/);
});
