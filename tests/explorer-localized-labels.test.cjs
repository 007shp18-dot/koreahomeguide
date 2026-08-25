const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('explorer pages load the catalog before explorer utilities', () => {
  for (const file of ['explore/index.html','zh/explore/index.html','explore/building/index.html','zh/explore/building/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.ok(html.indexOf('/location-catalog.js') >= 0, `${file} loads the catalog`);
    assert.ok(html.indexOf('/location-catalog.js') < html.indexOf('/explore/explorer-utils.js'), file);
  }
});

test('Chinese explorer no longer owns partial district, dong, or type tables', () => {
  const source = fs.readFileSync('zh/explore/app.js','utf8');
  assert.doesNotMatch(source, /const DISTRICT_NAMES/);
  assert.doesNotMatch(source, /const TYPE_NAMES/);
  assert.doesNotMatch(source, /const DONG_NAMES_ZH/);
  assert.match(source, /KHGLocations\.districtLabel/);
  assert.match(source, /KHGLocations\.dongLabel/);

  const building = fs.readFileSync('zh/explore/building/app.js','utf8');
  assert.doesNotMatch(building, /const DISTRICT_NAMES/);
  assert.doesNotMatch(building, /const TYPE_NAMES/);
  assert.doesNotMatch(building, /const DONG_NAMES_ZH/);
  assert.match(building, /KHGLocations\.districtLabel/);
});

test('static filters show locale labels while preserving stable values', () => {
  const en = fs.readFileSync('explore/index.html','utf8');
  const zh = fs.readFileSync('zh/explore/index.html','utf8');
  assert.match(en, /value="11680">Gangnam-gu \(강남구\)</);
  assert.match(en, /value="officetel">Officetel \(오피스텔\)</);
  assert.match(zh, /value="11680">江南区（강남구）</);
  assert.match(zh, /value="villa">低层多户住宅 \/ Villa（연립·다세대）</);
});
