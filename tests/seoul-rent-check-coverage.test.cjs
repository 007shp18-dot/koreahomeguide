const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalog = require('../location-catalog.js');
const config = require('../providers/seoul-config.cjs');
const rentCheck = require('../api/rent-check.js');

function validQuery(lawdCd) {
  return {
    lawdCd,
    type:'officetel',
    deposit:'10000000',
    rent:'900000',
    area:'28'
  };
}

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const ALL_DISTRICT_CODES = Object.freeze([
  '11680','11440','11170','11200','11560','11620','11230','11410','11290','11215',
  '11110','11140','11260','11305','11320','11350','11380','11470','11500','11530',
  '11545','11590','11650','11710','11740'
]);

test('Rent Check owns all 25 Seoul districts without widening Explorer and SEO', () => {
  assert.equal(Object.keys(catalog.RENT_CHECK_DISTRICTS).length, 25);
  assert.equal(Object.keys(catalog.DISTRICTS).length, 10);
  assert.equal(Object.keys(config.RENT_CHECK_DISTRICTS).length, 25);
  assert.equal(Object.keys(config.SEOUL_DISTRICTS).length, 10);

  assert.equal(config.isRentCheckAreaCode('11710'), true);
  assert.equal(config.isRentCheckAreaCode('11110'), true);
  assert.equal(config.isRentCheckAreaCode('99999'), false);
  assert.equal(config.isSupportedAreaCode('11710'), false);

  assert.equal(rentCheck.parseRentCheckQuery(validQuery('11710')).ok, true);
  assert.equal(rentCheck.parseRentCheckQuery(validQuery('11110')).ok, true);
  assert.equal(rentCheck.parseRentCheckQuery(validQuery('99999')).ok, false);
});

test('all four localized Rent Check selectors expose the same 25 districts', () => {
  const pages = [
    ['index.html', false],
    ['tools/seoul-rent-check/index.html', false],
    ['zh/index.html', true],
    ['zh/tools/seoul-rent-check/index.html', true]
  ];
  for (const [file, zh] of pages) {
    const html = read(file);
    const select = html.match(/<select id="rentCheckArea">([\s\S]*?)<\/select>/);
    assert.ok(select, `${file} has #rentCheckArea`);
    const codes = [...select[1].matchAll(/<option value="(\d{5})"/g)].map(match => match[1]);
    assert.equal(codes.length, 25, file);
    assert.equal(new Set(codes).size, 25, `${file} has unique codes`);
    assert.deepEqual(codes, ALL_DISTRICT_CODES, `${file} uses the shared order`);
    assert.equal(codes[0], '11680', `${file} keeps Gangnam as default`);
    assert.match(select[1], zh ? /松坡区（송파구）/ : /Songpa-gu \(송파구\)/, file);
    assert.match(select[1], zh ? /钟路区（종로구）/ : /Jongno-gu \(종로구\)/, file);
  }
});

test('all Rent Check runtimes allow bounded analytics for all 25 districts', () => {
  for (const file of ['app.js','tools/seoul-rent-check/app.js','zh/app.js','zh/tools/seoul-rent-check/app.js']) {
    const source = read(file);
    const allowlist = source.match(/analyticsDistrictCodes=new Set\(\[([^\]]+)]\)/);
    assert.ok(allowlist, `${file} has an analytics district allowlist`);
    const codes = [...allowlist[1].matchAll(/['"](\d{5})['"]/g)].map(match => match[1]);
    assert.deepEqual(codes, ALL_DISTRICT_CODES, `${file} allows exactly the Rent Check districts`);
  }
});
