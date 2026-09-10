const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const explorer = require('../explore/explorer-utils.js');

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
  assert.match(en, /value="officetel">Officetel \(오피스텔\)<\/option>/);
  assert.match(zh, /value="11680">江南区（강남구）/);
  assert.match(zh, /value="villa">低层多户住宅 \(Villa \/ 연립·다세대\)<\/option>/);
});

test('short localized dong labels keep Korean inline', () => {
  assert.deepEqual(explorer.localizedDongParts('연남동', 'en'), {
    primary:'Yeonnam-dong', korean:'연남동', breakKorean:false
  });
});

test('long localized dong labels move Korean to a second line', () => {
  assert.deepEqual(explorer.localizedDongParts('영등포동1가', 'en'), {
    primary:'Yeongdeungpo-dong 1-ga', korean:'영등포동1가', breakKorean:true
  });
});

test('area response creates an instant Dong snapshot without another request', () => {
  const snapshot = explorer.areaSnapshotForDong({
    districtCode:'11680',
    propertyType:'apartment',
    summary:{ monthsUsed:6, dataThroughMonth:'2026-07' },
    dongs:[
      { dong:'역삼동', contractCount:1065, medianMonthlyRentWon:1700000, quarterChangePct:21 },
      { dong:'삼성동', contractCount:823 }
    ],
    buildings:[
      { dong:'역삼동', buildingKey:'역삼동::a', buildingName:'A' },
      { dong:'삼성동', buildingKey:'삼성동::b', buildingName:'B' }
    ]
  }, '역삼동');

  assert.equal(snapshot.summary.totalContracts, 1065);
  assert.equal(snapshot.summary.monthsUsed, 6);
  assert.equal(snapshot.summary.dataThroughMonth, '2026-07');
  assert.deepEqual(snapshot.buildings.map(item => item.buildingName), ['A']);
  assert.equal(explorer.areaSnapshotForDong({ dongs:[] }, '없는동'), null);
});
