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

test('new non-indexed Explorer districts fall back to a localized interactive Dong URL', () => {
  assert.equal(
    client.buildDongSeoUrl({ lawdCd:'11650', type:'officetel', dong:'서초동', lang:'en' }),
    ''
  );
  assert.equal(
    client.buildExplorerDongUrl({ lawdCd:'11650', type:'officetel', dong:'서초동', lang:'en' }),
    '/explore/?lawdCd=11650&type=officetel&dong=%EC%84%9C%EC%B4%88%EB%8F%99'
  );
  assert.equal(
    client.buildExplorerDongUrl({ lawdCd:'11710', type:'apartment', dong:'잠실동', lang:'zh' }),
    '/zh/explore/?lawdCd=11710&type=apartment&dong=%EC%9E%A0%EC%8B%A4%EB%8F%99'
  );
  assert.equal(client.buildExplorerDongUrl({ lawdCd:'99999', type:'apartment', dong:'잠실동' }), '');
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
