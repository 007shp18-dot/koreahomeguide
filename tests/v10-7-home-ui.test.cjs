const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

for (const [file, labels] of [
  ['index.html', ['Explore neighborhoods','Check a rent quote','Before you sign']],
  ['zh/index.html', ['探索街区','检查租金报价','签约前必查']]
]) {
  test(`${file} presents exactly three primary user intents`, () => {
    const html = read(file);
    assert.match(html, /class="home-intents"/);
    const count = (html.match(/class="intent-card/g) || []).length;
    assert.equal(count, 3);
    for (const label of labels) assert.match(html, new RegExp(label));
    assert.match(html, /class="[^"]*home-primary-flow[^"]*"/);
    assert.match(html, /data-slot="content"/);
  });
}
