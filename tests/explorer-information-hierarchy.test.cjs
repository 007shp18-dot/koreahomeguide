const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

global.KHGLocations = require('../location-catalog.js');
const explorer = require('../explore/explorer-utils.js');

test('Explorer summary separates a short title from labelled location and housing type facts', () => {
  assert.deepEqual(explorer.summaryHeading({ lawdCd:'11680', dong:'도곡동', propertyType:'apartment', locale:'en' }), {
    title:'Dogok-dong rent market',
    area:'Gangnam-gu (강남구) · Dogok-dong (도곡동)',
    housingType:'Apartment (아파트)'
  });
  assert.deepEqual(explorer.summaryHeading({ lawdCd:'11680', dong:'도곡동', propertyType:'apartment', locale:'zh-CN' }), {
    title:'道谷洞租赁市场',
    area:'江南区（강남구） · 道谷洞（도곡동）',
    housingType:'公寓（아파트）'
  });
});

test('both Explorer locales provide labelled summary facts instead of one long dotted heading', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /id="explorerTitle"/);
    assert.match(html, /id="explorerSummaryArea"/);
    assert.match(html, /id="explorerSummaryType"/);
    assert.match(html, /class="explorer-summary-context"/);
  }
});
