const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

for (const file of ['explore/index.html','zh/explore/index.html']) {
  test(`${file} uses main content plus context rail without changing core explorer ids`, () => {
    const html = read(file);
    assert.match(html, /class="product-layout explorer-product-layout"/);
    assert.match(html, /class="product-main"/);
    assert.match(html, /class="context-rail"/);
    assert.match(html, /class="context-module/);
    assert.match(html, /data-slot="sidebar"/);
    for (const id of ['exploreArea','exploreType','exploreMaxRent','dongList','buildingList']) {
      assert.match(html, new RegExp(`id="${id}"`));
    }
  });
}
