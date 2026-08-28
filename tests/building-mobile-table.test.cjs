const test = require('node:test');
const assert = require('node:assert/strict');

const Explorer = require('../explore/explorer-utils.js');

test('building table rows retain a visible mobile label for every value', () => {
  assert.equal(
    Explorer.buildLabeledTableRow([
      { label:'Date', html:'Aug 2, 2026' },
      { label:'Type', html:'New' },
      { label:'Deposit', html:'<strong>₩20M</strong>' }
    ]),
    '<tr><td data-label="Date">Aug 2, 2026</td><td data-label="Type">New</td><td data-label="Deposit"><strong>₩20M</strong></td></tr>'
  );
});

test('building table labels are escaped before entering an HTML attribute', () => {
  assert.equal(
    Explorer.buildLabeledTableRow([{ label:'Price "reported"', html:'₩900K' }]),
    '<tr><td data-label="Price &quot;reported&quot;">₩900K</td></tr>'
  );
});
