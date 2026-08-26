const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

test('every new indexable Phase 1 page defers GA4 to the shared analytics loader', () => {
  const files = execSync("find tools zh/tools rent guides zh/guides -name index.html | sort", { encoding:'utf8' }).trim().split('\n').filter(Boolean);
  assert.equal(files.length, 50);
  for (const file of files) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /<script defer src="\/privacy-consent\.js"><\/script>/, file);
    assert.doesNotMatch(html, /googletagmanager\.com/, file);
  }
});
