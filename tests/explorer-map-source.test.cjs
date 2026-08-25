const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('map adapter is lazy and has explicit failure states', () => {
  const source = fs.readFileSync('explore/map.js','utf8');
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /\/api\/maps-config/);
  assert.match(source, /maps\.googleapis\.com\/maps\/api\/js/);
  assert.match(source, /Map temporarily unavailable/);
});

test('Explorer runtimes publish raw dong models after rendering', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /khg:explorer-dongs/);
    assert.match(source, /data-dong=/);
    assert.match(source, /khg:map-select-dong/);
  }
});

test('Explorer pages load map dependencies before their locale runtime', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    for (const script of ['/explore/map-locations.js','/explore/map-controller.js','/explore/map.js']) assert.ok(html.includes(script), `${file}: ${script}`);
  }
});
