const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const coldCss = fs.readFileSync(path.join(root, 'cold-start.css'), 'utf8');
const fontPath = path.join(root, 'assets', 'fonts', 'Geist-Variable.woff2');

test('the interface serves a real self-hosted Geist variable webfont', () => {
  assert.equal(fs.existsSync(fontPath), true, 'Geist webfont asset must exist');
  const font = fs.readFileSync(fontPath);
  assert.equal(font.subarray(0, 4).toString('ascii'), 'wOF2');
  assert.ok(font.length > 40_000, 'Geist webfont must not be an empty placeholder');
  assert.match(css, /@font-face\s*\{[^}]*font-family:\s*"Geist Sans"[^}]*font-style:\s*normal[^}]*font-weight:\s*100 900[^}]*font-display:\s*swap[^}]*url\("\/assets\/fonts\/Geist-Variable\.woff2"\)[^}]*format\("woff2"\)/s);
});

test('shared typography uses Geist with explicit Korean and Chinese fallbacks', () => {
  assert.match(css, /--font-sans:\s*"Geist Sans"[^;]*"Noto Sans KR"[^;]*"Noto Sans SC"[^;]*"Microsoft YaHei"[^;]*system-ui/);
  assert.match(css, /body\s*\{[^}]*font-family:\s*var\(--font-sans\)/s);
  assert.doesNotMatch(css, /font-family:[^;}]*"Manrope"/);
  assert.match(css, /html\[lang="zh-CN"\][^{]*\{[^}]*font-family:\s*var\(--font-cjk\)/s);
});

test('typography polish keeps secondary copy readable and chips breathable', () => {
  assert.match(css, /--ink-soft:\s*#475569/);
  assert.match(css, /--muted:\s*#64748b/);
  assert.match(css, /--muted-light:\s*#94a3b8/);
  assert.match(coldCss, /\.funnel-trust span[^\{]*\{[^}]*padding:\s*9px 14px[^}]*line-height:\s*1\.35/s);
  assert.match(css, /\.trust-row span[^\{]*\{[^}]*padding:\s*9px 14px[^}]*line-height:\s*1\.35/s);
  assert.match(css, /html\[lang="zh-CN"\][^\{]*h1[^\{]*\{[^}]*letter-spacing:\s*-\.025em/s);
});

test('form controls and post-result modules keep a consistent visual rhythm', () => {
  assert.match(css, /\.rent-check-form \.field>span\s*\{[^}]*min-height:\s*18px[^}]*align-items:\s*flex-end/s);
  assert.match(css, /\.rent-check-money,\.rent-check-size[^\{]*\{[^}]*height:\s*52px/s);
  assert.match(css, /\.rent-check-form \.search-button[^\{]*\{[^}]*height:\s*52px/s);
  assert.match(coldCss, /\.lead-capture\s*\{[^}]*margin-top:\s*24px[^}]*padding:\s*24px/s);
});
