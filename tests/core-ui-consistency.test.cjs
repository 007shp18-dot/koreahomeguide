const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const corePages = [
  'index.html',
  'zh/index.html',
  'explore/index.html',
  'zh/explore/index.html',
  'tools/seoul-rent-check/index.html',
  'zh/tools/seoul-rent-check/index.html'
];

const rentCheckPages = [
  'index.html',
  'zh/index.html',
  'tools/seoul-rent-check/index.html',
  'zh/tools/seoul-rent-check/index.html'
];

const contextualPages = [
  'explore/index.html',
  'zh/explore/index.html',
  'tools/seoul-rent-check/index.html',
  'zh/tools/seoul-rent-check/index.html'
];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

test('core funnel pages expose one consistent currency and language control pattern', () => {
  for (const file of corePages) {
    const html = read(file);
    const header = (html.match(/<header[\s\S]*?<\/header>/) || [''])[0];
    assert.match(html, /<body class="core-ui">/, file);
    assert.match(header, /id="currencySelect" class="currency-select"/, file);
    assert.match(header, /class="language-link"/, file);
    assert.doesNotMatch(header, /currency-picker|language-switch/, file);
  }
});

test('Rent Check fields name the selected currency and size unit at the point of entry', () => {
  for (const file of rentCheckPages) {
    const html = read(file);
    assert.match(html, /data-currency-code/, `${file} currency code`);
    assert.match(html, /data-rent-unit="deposit"/, `${file} deposit unit`);
    assert.match(html, /data-rent-unit="monthly"/, `${file} monthly unit`);
    assert.match(html, /data-rent-unit="size"[^>]*>[^<]*㎡/, `${file} size unit`);
  }
});

test('contextual recommendation cards use one full-card link instead of nested button-like boxes', () => {
  for (const file of contextualPages) {
    const html = read(file);
    const rail = (html.match(/<aside[^>]*>[\s\S]*?<\/aside>/) || [''])[0];
    assert.ok(rail, `${file} context rail`);
    assert.doesNotMatch(rail, /<section class="context-module/, file);
    assert.ok((rail.match(/<a class="context-module context-card/g) || []).length >= 2, file);
    assert.doesNotMatch(rail, /class="context-link"/, file);
  }
});

test('core funnel typography and clickable cards expose readable, keyboard-visible styles', () => {
  const css = read('styles.css');
  const cold = read('cold-start.css');
  assert.match(css, /\.core-ui\{[^}]*font-size:16px[^}]*line-height:1\.6/);
  assert.match(css, /\.core-ui \.field>span\{[^}]*font-size:13px/);
  assert.match(css, /\.core-ui \.field-unit\{[^}]*font-size:12px/);
  assert.match(css, /\.context-card:focus-visible[^}]*\{[^}]*outline:/);
  assert.match(css, /\.context-card:hover[^}]*\{[^}]*border-color:/);
  assert.match(cold, /\.funnel-section\+\.funnel-section\{[^}]*padding-top:56px/);
});

test('core headers compact brand and utilities without overlap on narrow phones', () => {
  const css = read('styles.css');
  assert.match(css, /@media\(max-width:360px\)\{[\s\S]*?\.core-ui \.site-header,\.core-ui \.compact-header\{column-gap:12px\}/);
  assert.match(css, /@media\(max-width:360px\)\{[\s\S]*?\.core-ui \.brand\{gap:7px;font-size:14px\}/);
  assert.match(css, /@media\(max-width:360px\)\{[\s\S]*?\.core-ui \.header-actions\{gap:4px\}/);
  assert.match(css, /@media\(max-width:360px\)\{[\s\S]*?min-width:48px[^}]*padding:0 6px/);
});
