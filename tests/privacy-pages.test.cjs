const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function staticPages() {
  const pages = [];
  const excludedDirectories = new Set(['.git', '.worktrees', 'docs', 'node_modules']);

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;

      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      if (entry.isFile() && entry.name === 'index.html') {
        pages.push(`./${file.split(path.sep).join('/').replace(/^\.\//, '')}`);
      }
    }
  }

  visit('.');
  return pages.sort();
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
  assert.match(en, /does not load unless you select “Allow analytics.”/);
  assert.match(zh, /只有选择“允许分析”后/);
  assert.match(en, /Saved homes stay in your browser/);
  assert.match(zh, /保存的房源只留在浏览器中/);
  assert.match(en, /90 days/);
  assert.match(zh, /90 天/);
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

test('localized terms explain market-reference and saved-comparison limits', () => {
  const en = fs.readFileSync('terms/index.html','utf8');
  const zh = fs.readFileSync('zh/terms/index.html','utf8');
  for (const html of [en, zh]) {
    assert.match(html, /noindex,follow/);
    assert.match(html, /privacy-consent\.js/);
    assert.match(html, /90/);
  }
  assert.match(en, /not a real-estate brokerage/);
  assert.match(en, /Do not transfer money/);
  assert.match(zh, /不是房地产中介/);
  assert.match(zh, /不要仅凭 KoreaHomeGuide 的结果转账/);
});
