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

test('EN Explorer exposes canonical neighborhood/building pages and keeps interactive building view secondary', () => {
  const source = fs.readFileSync('explore/app.js','utf8');
  assert.match(source, /buildDongSeoUrl/);
  assert.match(source, /View neighborhood/);
  assert.match(source, /buildBuildingSeoUrl/);
  assert.match(source, /Interactive view/);
  assert.match(source, /buildBuildingDetailUrl/);
});

test('ZH Explorer exposes localized canonical neighborhood/building page links', () => {
  const source = fs.readFileSync('zh/explore/app.js','utf8');
  assert.match(source, /buildDongSeoUrl/);
  assert.match(source, /supportsZhIndexing\(districtCode\)/);
  assert.match(source, /supportsZhIndexing\(areaSelect\.value\)/);
  assert.match(source, /查看街区/);
  assert.match(source, /buildBuildingSeoUrl/);
  assert.match(source, /交互查看/);
});
