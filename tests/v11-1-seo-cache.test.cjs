const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

test('dynamic Dong success and Building retirement responses cache for one day', () => {
  for (const file of ['api/seo-dong-page.js', 'api/seo-building-page.js']) {
    const text = source(file);
    assert.match(
      text,
      /cache \? 's-maxage=86400, stale-while-revalidate=86400'/,
      `${file} should cache successful dynamic SEO HTML for 24 hours`
    );
    assert.doesNotMatch(
      text,
      /cache \? 's-maxage=3600, stale-while-revalidate=86400'/,
      `${file} should no longer use the old one-hour cache`
    );
  }
});
