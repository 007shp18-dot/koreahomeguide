const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const Explorer = require('../explore/explorer-utils.js');

test('Explorer opens the map first at every viewport width', () => {
  assert.equal(Explorer.initialViewForWidth(375), 'map');
  assert.equal(Explorer.initialViewForWidth(760), 'map');
  assert.equal(Explorer.initialViewForWidth(761), 'map');
  assert.equal(Explorer.initialViewForWidth(1440), 'map');
});

test('Explorer defaults safely to the map when a viewport width is unavailable', () => {
  assert.equal(Explorer.initialViewForWidth(undefined), 'map');
  assert.equal(Explorer.initialViewForWidth('unknown'), 'map');
});

test('mobile workspace exposes collapsed, list, and detail sheet heights', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const mobile = css.slice(css.lastIndexOf('@media(max-width:760px)'));
  assert.match(mobile, /data-workspace-state='neighborhoods'[^}]*max-height:96px/);
  assert.match(mobile, /data-workspace-state='buildings'[^}]*max-height:62dvh/);
  assert.match(mobile, /data-workspace-state='building-detail'[^}]*max-height:92dvh/);
  assert.match(mobile, /building-window-street-view\{[^}]*display:block/);
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /khg:building-window-state/);
  }
});
