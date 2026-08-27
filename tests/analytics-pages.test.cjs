const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function indexPages(root) {
  const pages = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) pages.push(...indexPages(file));
    if (entry.isFile() && entry.name === 'index.html') pages.push(file.split(path.sep).join('/'));
  }

  return pages;
}

test('every new indexable Phase 1 page defers GA4 to the shared analytics loader', () => {
  const files = ['tools', 'zh/tools', 'rent', 'guides', 'zh/guides']
    .flatMap(indexPages)
    .sort();
  assert.equal(files.length, 50);
  for (const file of files) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /<script defer src="\/privacy-consent\.js"><\/script>/, file);
    assert.doesNotMatch(html, /googletagmanager\.com/, file);
  }
});
