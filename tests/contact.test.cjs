const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const CONTACT = '007shp18@gmail.com';

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
