const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname,'..',rel),'utf8');

for (const [file, primary, secondary] of [
  ['index.html','Check my rent',['Explore Seoul','Before you sign']],
  ['zh/index.html','检查我的租金',['探索首尔','签约前']]
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

test('homepage primary CTA sits closer to the hero copy', () => {
  const css=read('cold-start.css');
  const rule=(css.match(/\.funnel-hero \.hero-actions\{([^}]*)\}/)||[])[1]||'';
  assert.match(rule,/margin-top:20px/);
});
