const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('white-first design tokens use white canvas, neutral borders, and one blue primary', () => {
  const css = read('styles.css');
  assert.match(css, /--bg:\s*#(?:fff|ffffff)/i);
  assert.match(css, /--surface:\s*#(?:fff|ffffff)/i);
  assert.match(css, /--surface-soft:\s*#f8fafc/i);
  assert.match(css, /--ink:\s*#111827/i);
  assert.match(css, /--muted:\s*#64748b/i);
  assert.match(css, /--line:\s*#e5e7eb/i);
  assert.match(css, /--accent:\s*#2563eb/i);
});

test('shared UI exposes expansion-safe context rail and dormant ad slots', () => {
  const css = read('styles.css');
  assert.match(css, /\.product-layout\s*\{/);
  assert.match(css, /\.context-rail\s*\{/);
  assert.match(css, /\.context-module\s*\{/);
  assert.match(css, /\.ad-slot[^\{]*\{/);
  assert.match(css, /\.ad-slot[^\{]*\{[^\}]*display:\s*none/i);
});

test('primary navigation stays focused on Explore, Rent Check, and Guides on key product pages', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  for (const rel of ['explore/building/index.html','tools/seoul-rent-check/index.html','tools/brokerage-fee-calculator/index.html','zh/explore/building/index.html','zh/tools/seoul-rent-check/index.html','zh/tools/brokerage-fee-calculator/index.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
    const nav = (html.match(/<nav>[\s\S]*?<\/nav>/) || [''])[0];
    assert.doesNotMatch(nav, /brokerage-fee-calculator|Calculator|计算器|中介费计算器/);
    assert.match(nav, /explore/);
    assert.match(nav, /rent-check/);
    assert.match(nav, /guides/);
  }
});

test('calculator and market modules are fully converted from the old dark/green theme', () => {
  const css = read('styles.css');
  assert.match(css, /\.calculator-card\.white-first-calculator|\.calculator-card\{[^}]*color:\s*var\(--ink\)/s);
  assert.match(css, /\.breakdown-item\.white-first-breakdown|\.calculator-card\s+\.breakdown-item\{[^}]*background:\s*#fff/s);
  assert.match(css, /\.market-metric-grid>div\.white-first-market|\.market-page\s+\.market-metric-grid>div\{[^}]*background:\s*#fff/s);
  assert.match(css, /\.market-page\s+\.market-note\{[^}]*border-left[^;]*var\(--accent\)/s);
});

test('dynamic SEO footer spans both main and context rail columns', () => {
  const css = read('styles.css');
  assert.match(css, /\.seo-page\.product-layout>\.seo-footer\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
});
