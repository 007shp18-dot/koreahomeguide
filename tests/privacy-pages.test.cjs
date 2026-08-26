const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function staticPages() {
  return execFileSync('find', [
    '.',
    '-name', 'index.html',
    '-not', '-path', './docs/*',
    '-not', '-path', './.worktrees/*'
  ], { encoding:'utf8' })
    .trim().split('\n').filter(Boolean).sort();
}

test('localized privacy pages disclose operator, collected data, processors, retention, and deletion contact', () => {
  const en = fs.readFileSync('privacy/index.html','utf8');
  const zh = fs.readFileSync('zh/privacy/index.html','utf8');
  for (const html of [en, zh]) {
    assert.match(html, /KoreaHomeGuide/);
    assert.match(html, /hello@koreahomeguide\.com/);
    assert.match(html, /12/);
    assert.match(html, /Vercel/);
    assert.match(html, /Google/);
  }
  assert.match(en, /email/i);
  assert.match(en, /delet/i);
  assert.match(zh, /邮箱/);
  assert.match(zh, /删除/);
  assert.match(en, /Google Analytics loads when a page opens/);
  assert.match(zh, /页面打开时会加载 Google Analytics/);
  assert.doesNotMatch(en, /Accept analytics|Optional Google Analytics/);
  assert.doesNotMatch(zh, /同意分析 Cookie|可选分析/);
});

test('every static page links to matching privacy details and uses the shared analytics loader', () => {
  const pages = staticPages();
  assert.ok(pages.length > 40);
  for (const file of pages) {
    const html = fs.readFileSync(file,'utf8');
    const isChinese = file.startsWith('./zh/');
    assert.match(html, isChinese ? /href="\/zh\/privacy\/"/ : /href="\/privacy\/"/, file);
    assert.match(html, /<script defer src="\/privacy-consent\.js"><\/script>/, file);
    assert.doesNotMatch(html, /googletagmanager\.com/, file);
  }
});

test('all four lead forms link the point-of-collection notice to privacy details', () => {
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /lead-consent-note[^]*?href="\/(?:zh\/)?privacy\/"/, file);
  }
});

test('generated SEO pages emit shared analytics and privacy links', () => {
  const source = fs.readFileSync('seo/seo-page-renderer.cjs','utf8');
  assert.match(source, /privacy-consent\.js/);
  assert.match(source, /\/privacy\//);
  assert.match(source, /\/zh\/privacy\//);
  assert.doesNotMatch(source, /googletagmanager\.com/);
});
