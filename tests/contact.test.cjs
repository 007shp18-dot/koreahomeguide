const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CONTACT = 'hello@koreahomeguide.com';

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
  });
}

test('English footer provides a mailto contact link', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /Questions, feedback, or data issues\?/);
  assert.match(html, new RegExp(`href="mailto:${CONTACT.replace('.', '\\.')}`));
  assert.match(html, />Email us</);
});

test('Chinese footer provides the same contact mailto link', () => {
  const html = fs.readFileSync('zh/index.html', 'utf8');
  assert.match(html, /如有问题、建议或数据问题/);
  assert.match(html, new RegExp(`href="mailto:${CONTACT.replace('.', '\\.')}`));
  assert.match(html, />邮件联系我们</);
});

test('every public HTML contact link uses the official mailbox', () => {
  for (const file of htmlFiles('.')) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /007shp18@gmail\.com/, file);
    for (const match of html.matchAll(/href="mailto:([^"]+)"/g)) {
      assert.equal(match[1], CONTACT, file);
    }
  }
});
