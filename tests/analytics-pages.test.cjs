const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function indexPages(root) {
  return fs.readdirSync(root, { withFileTypes:true }).flatMap(entry => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) return indexPages(file);
    return entry.name === 'index.html' ? [file.replaceAll('\\', '/')] : [];
  });
}

test('every new indexable Phase 1 page defers GA4 to the shared analytics loader', () => {
  const files = ['tools','zh/tools','rent','guides','zh/guides'].flatMap(indexPages).sort();
  assert.equal(files.length, 50);
  for (const file of files) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /<script defer src="\/privacy-consent\.js"><\/script>/, file);
    assert.doesNotMatch(html, /googletagmanager\.com/, file);
  }
});
