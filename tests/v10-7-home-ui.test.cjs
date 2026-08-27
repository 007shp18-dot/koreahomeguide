const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname,'..',rel),'utf8');

for (const [file, primary, secondary] of [
  ['index.html','id="rentCheckButton"',['Explore Seoul','Protect the deposit']],
  ['zh/index.html','id="rentCheckButton"',['探索首尔','先保护好押金']]
]) {
  test(`${file} presents one primary action with secondary discovery paths`, () => {
    const html=read(file);
    assert.match(html,new RegExp(primary));
    assert.match(html,/class="funnel-hero"/);
    assert.match(html,/id="rent-check"/);
    assert.match(html,/data-lead-capture/);
    for(const label of secondary) assert.match(html,new RegExp(label));
    assert.doesNotMatch(html,/class="home-intents"/);
    assert.doesNotMatch(html,/class="intent-card/);
  });
}

test('homepage moves directly from its promise to the Rent Check form', () => {
  for (const file of ['index.html','zh/index.html']) {
    const html=read(file);
    assert.doesNotMatch(html,/hero-primary-action/,file);
    assert.match(html,/id="rent-check"/,file);
  }
});
