const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('English product selectors use explanatory Korean market labels', () => {
  for (const file of ['index.html','tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, />Officetel \(오피스텔\)</, file);
    assert.match(html, />Low-rise multifamily \/ Villa \(연립·다세대\)</, file);
    assert.match(html, />Detached &amp; multi-unit house \(단독·다가구\)</, file);
  }
});

test('Chinese product selectors preserve Korean reference names', () => {
  for (const file of ['zh/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, />Officetel（오피스텔）</, file);
    assert.match(html, />低层多户住宅 \/ Villa（연립·다세대）</, file);
  }
});

test('calculator keeps the legal officetel rule while improving the label', () => {
  const en = fs.readFileSync('tools/brokerage-fee-calculator/index.html','utf8');
  const zh = fs.readFileSync('zh/tools/brokerage-fee-calculator/index.html','utf8');
  assert.match(en, /value="officetel">Officetel \(오피스텔\) ≤85㎡/);
  assert.match(zh, /value="officetel">Officetel（오피스텔）≤85㎡/);
});

test('Rent Check district selectors keep Korean contract names visible', () => {
  for (const file of ['index.html','tools/seoul-rent-check/index.html']) {
    assert.match(fs.readFileSync(file,'utf8'), /value="11680">Gangnam-gu \(강남구\)</, file);
  }
  for (const file of ['zh/index.html','zh/tools/seoul-rent-check/index.html']) {
    assert.match(fs.readFileSync(file,'utf8'), /value="11680">江南区（강남구）</, file);
  }
});
