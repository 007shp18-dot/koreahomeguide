const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = [
  'index.html',
  'zh/index.html',
  'tools/seoul-rent-check/index.html',
  'zh/tools/seoul-rent-check/index.html'
];

test('hidden lead subforms stay hidden despite authored form layout rules', () => {
  const css = fs.readFileSync('cold-start.css', 'utf8');
  assert.match(css, /\.lead-capture form\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*\}/);
});

test('lead form reserves a flexible email column and a separate consent row', () => {
  const css = fs.readFileSync('cold-start.css', 'utf8');
  assert.match(css, /\.lead-capture \[data-lead-form\][^{]*\{[^}]*grid-template-columns\s*:\s*minmax\(0,\s*1fr\)\s+auto/);
  assert.match(css, /\.lead-capture \[data-lead-form\] \.lead-consent-note\s*\{[^}]*grid-column\s*:\s*1\s*\/\s*-1/);
});

test('help form buttons use the shared primary action style in every locale and entry point', () => {
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /data-help-form[^]*?<button class="search-button" type="submit">/, file);
  }
});
