const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('styles.css', 'utf8');

test('desktop headers use a stable three-column alignment contract', () => {
  assert.match(css, /\.site-header,\.compact-header\{display:grid;grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\);align-items:center\}/);
  assert.match(css, /\.site-header \.brand,\.compact-header \.brand\{justify-self:start;margin-right:0\}/);
  assert.match(css, /\.site-header nav,\.compact-header nav\{justify-self:center\}/);
  assert.match(css, /\.site-header \.header-actions,\.compact-header \.header-actions\{justify-self:end\}/);
});

test('mobile header keeps the brand left and actions right after navigation is hidden', () => {
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.site-header,\.compact-header\{grid-template-columns:minmax\(0,1fr\) auto\}/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.site-header \.header-actions,\.compact-header \.header-actions\{grid-column:2;justify-self:end\}/);
});
