const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('localized saved-home pages are private browser tools with clear limits', () => {
  for (const file of ['saved-homes/index.html','zh/saved-homes/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /name="robots" content="noindex,follow"/, file);
    assert.match(html, /saved-rent-quotes\.js/, file);
    assert.match(html, /saved-homes-page\.js/, file);
    assert.match(html, /privacy-consent\.js/, file);
    assert.match(html, /(?:90 days|90 天|90天)/, file);
    assert.match(html, /(?:(?:current|this) browser|当前浏览器)/, file);
    assert.match(html, /href="\/(?:zh\/)?privacy\/"/, file);
    assert.match(html, /href="\/(?:zh\/)?terms\/"/, file);
  }
});

test('all four Rent Check entry points bind saved quotes before their result runtime', () => {
  const files = [
    ['index.html','/app.js'], ['zh/index.html','/zh/app.js'],
    ['tools/seoul-rent-check/index.html','/tools/seoul-rent-check/app.js'],
    ['zh/tools/seoul-rent-check/index.html','/zh/tools/seoul-rent-check/app.js']
  ];
  for (const [file, runtime] of files) {
    const html = fs.readFileSync(file, 'utf8');
    assert.equal((html.match(/saved-rent-quotes\.js/g) || []).length, 1, file);
    assert.ok(html.indexOf('/saved-rent-quotes.js') < html.indexOf(runtime), file);
  }
});

test('saved comparison code avoids account, address, landlord, and broker data fields', () => {
  const source = fs.readFileSync('saved-rent-quotes.js', 'utf8');
  assert.match(source, /MAX_QUOTES = 8/);
  assert.match(source, /RETENTION_MS = 90/);
  assert.doesNotMatch(source, /name=["'](?:email|address|landlord|broker)/i);
  assert.doesNotMatch(source, /fetch\(/);
});
