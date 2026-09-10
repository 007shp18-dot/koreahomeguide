const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalog = require('../location-catalog.js');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const EXPLORER_CODES = Object.freeze([
  '11680','11440','11170','11200','11560','11620','11230','11410','11290','11215',
  '11110','11140','11260','11305','11320','11350','11380','11470','11500','11530',
  '11545','11590','11650','11710','11740'
]);
const CATALOG_CODES = Object.freeze([
  '11110','11140','11170','11200','11215','11230','11290','11410','11440','11560',
  '11620','11650','11680','11710','11740'
]);

test('Explorer catalog exposes the approved fifteen districts in a stable order', () => {
  assert.deepEqual(Object.keys(catalog.DISTRICTS), CATALOG_CODES);
});

test('EN and ZH Explorer selectors expose all 25 localized districts before All Seoul', () => {
  for (const [file, expectedLabel] of [
    ['explore/index.html', 'Songpa-gu (송파구)'],
    ['zh/explore/index.html', '松坡区（송파구）']
  ]) {
    const html = read(file);
    const select = html.match(/<select id="exploreArea">([\s\S]*?)<option value="all">/);
    assert.ok(select, `${file} has an Explorer area selector`);
    const codes = [...select[1].matchAll(/<option value="(\d{5})"/g)].map(match => match[1]);
    assert.deepEqual(codes, EXPLORER_CODES, file);
    assert.match(select[1], new RegExp(expectedLabel.replace(/[()]/g, '\\$&')), file);
  }
});

test('home preview links live district medians instead of a static coverage claim', () => {
  for (const file of ['index.html', 'zh/index.html']) {
    const html = read(file);
    assert.match(html, /data-home-market-preview/);
    assert.match(html, /src="\/home-market-preview\.js"/);
    assert.doesNotMatch(html, /districts currently mapped|目前覆盖的行政区/);
  }
});

test('common neighborhoods in every new district have EN, ZH and Korean display labels', () => {
  for (const name of ['서초동','반포동','잠실동','가락동','천호동','명일동','숭인동','혜화동','신당동','황학동']) {
    const en = catalog.dongLabel(name, 'en');
    const zh = catalog.dongLabel(name, 'zh-CN');
    assert.notEqual(en, name, `${name} has an English label`);
    assert.notEqual(zh, name, `${name} has a Chinese label`);
    assert.match(en, new RegExp(`\\(${name}\\)$`));
    assert.match(zh, new RegExp(`（${name}）$`));
  }
});
