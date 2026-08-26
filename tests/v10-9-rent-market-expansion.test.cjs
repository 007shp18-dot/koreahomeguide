const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

const districts = {
  'gwanak-gu':'11620',
  'dongdaemun-gu':'11230',
  'seodaemun-gu':'11410',
  'seongbuk-gu':'11290',
  'gwangjin-gu':'11215'
};
const types = ['apartment','officetel','villa'];

test('five new districts each have three English market pages wired to the shared renderer', () => {
  for (const [district, code] of Object.entries(districts)) {
    for (const type of types) {
      const rel = `rent/${district}/${type}/index.html`;
      const html = read(rel);
      assert.match(html, new RegExp(`data-lawd-cd="${code}"`), rel);
      assert.match(html, new RegExp(`data-property-type="${type}"`), rel);
      assert.match(html, new RegExp(`https://koreahomeguide\\.com/rent/${district}/${type}/`), rel);
      assert.match(html, /<script src="\/rent-market-page\.js"><\/script>/, rel);
      assert.match(html, /Official MOLIT data/, rel);
    }
  }
});

test('new district pages have distinct district-specific renter context', () => {
  const signals = {
    'gwanak-gu':/Seoul National University|Sillim|Nakseongdae/,
    'dongdaemun-gu':/Kyung Hee|Hankuk University of Foreign Studies|Cheongnyangni/,
    'seodaemun-gu':/Yonsei|Ewha|Sinchon|Hongje/,
    'seongbuk-gu':/Korea University|Sungshin|Hansung/,
    'gwangjin-gu':/Konkuk|Sejong University|Gangbyeon|Guui/
  };
  for (const district of Object.keys(districts)) {
    const html = read(`rent/${district}/apartment/index.html`);
    assert.match(html, signals[district], district);
  }
});

test('static sitemap includes all 15 new English market URLs without thin Chinese copies', () => {
  const xml = read('sitemap-static.xml');
  for (const district of Object.keys(districts)) {
    for (const type of types) {
      assert.match(xml, new RegExp(`https://koreahomeguide\\.com/rent/${district}/${type}/`));
      assert.doesNotMatch(xml, new RegExp(`https://koreahomeguide\\.com/zh/rent/${district}/${type}/`));
    }
  }
});


test('dynamic sitemap keeps Chinese Dong/Building indexing limited to the five localized districts', () => {
  const catalog = require('../location-catalog.js');
  const source = read('api/sitemap-market.js');
  assert.match(source, /ZH_INDEXABLE_DISTRICT_CODES/);
  for (const code of Object.values(districts)) {
    assert.equal(catalog.supportsZhIndexing(code), false, `new district ${code} should not be whitelisted for zh indexing yet`);
  }
  for (const code of ['11680','11440','11170','11200','11560']) assert.equal(catalog.supportsZhIndexing(code), true);
  assert.match(source, /if \(supportsZhIndexing\(areaCode\)\)/);
});
