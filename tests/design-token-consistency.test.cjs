const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('styles.css', 'utf8');

test('shared type scale defines a compact readable product hierarchy', () => {
  for (const token of [
    '--text-xs:12px',
    '--text-sm:14px',
    '--text-base:16px',
    '--text-lg:18px',
    '--text-xl:22px',
    '--text-2xl:28px',
    '--text-3xl:36px',
    '--leading-tight:1.2',
    '--leading-body:1.6',
    '--tracking-tight:-.025em'
  ]) assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('Rent Check result uses its real h2 and keeps evidence labels at least 12px', () => {
  assert.match(css, /\.rent-check-verdict h2\{[^}]*font-size:var\(--text-2xl\)[^}]*line-height:var\(--leading-tight\)/);
  assert.doesNotMatch(css, /\.rent-check-verdict h3\{/);
  assert.match(css, /\.rent-rating,\.confidence-pill\{[^}]*font-size:var\(--text-xs\)/);
  assert.match(css, /\.rent-check-metrics span\{[^}]*font-size:var\(--text-xs\)/);
  assert.match(css, /\.rent-check-evidence-facts span\{[^}]*font-size:var\(--text-xs\)/);
  assert.match(css, /\.rent-check-market-axis>span\{[^}]*font-size:10px/);
  assert.doesNotMatch(css, /rentCheckNextSecondary|rent-check-secondary-action/);
});

test('calculator surfaces use neutral product colors and shared radii', () => {
  const start = css.indexOf('.calculator-card{');
  const end = css.indexOf('.guides{', start);
  const block = css.slice(start, end);
  assert.match(block, /\.calculator-card\{[^}]*background:var\(--surface\)[^}]*color:var\(--ink\)[^}]*border-radius:var\(--radius-card\)/);
  assert.match(block, /\.breakdown-item\{[^}]*border:1px solid var\(--line\)[^}]*border-radius:var\(--radius-card\)[^}]*background:var\(--surface\)/);
  assert.match(block, /\.secondary-output\{[^}]*background:var\(--surface-soft\)[^}]*border:1px solid var\(--line\)/);
  assert.doesNotMatch(block, /#(?:34423a|18261f|213129|394940|3c4a42|eaf5ef)/i);
});

test('market cards use slate-blue product tokens and shared radii', () => {
  const start = css.indexOf('.market-page{');
  const end = css.indexOf('/* Editorial guides */', start);
  const block = css.slice(start, end);
  assert.match(block, /\.market-summary-card\{[^}]*border:1px solid var\(--line\)[^}]*border-radius:var\(--radius-card\)/);
  assert.match(block, /\.market-metric-grid>div\{[^}]*border:1px solid var\(--line\)[^}]*border-radius:var\(--radius-card\)[^}]*background:var\(--surface\)/);
  assert.match(block, /\.market-note\{[^}]*border-left:3px solid var\(--accent\)[^}]*background:var\(--surface-soft\)/);
  assert.doesNotMatch(block, /#(?:edf4ef|4e6357|dfe6e1|f6f8f6|506b59|f5f8f5)/i);
});

test('saved-home controls use final tokenized type and radius declarations', () => {
  const start = css.indexOf('/* Browser-only saved home comparison */');
  const block = css.slice(start);
  assert.match(block, /\.saved-quote-form input\{[^}]*border-radius:var\(--radius-action\)/);
  assert.match(block, /\.saved-quote-save\{[^}]*border-radius:var\(--radius-action\)/);
  assert.match(block, /\.saved-homes-toolbar button,\.saved-home-remove\{[^}]*border-radius:var\(--radius-action\)/);
  assert.match(block, /\.saved-home-price>span\{[^}]*border-radius:var\(--radius-action\)[^}]*font-size:var\(--text-xs\)/);
  assert.match(block, /\.saved-home-price \.fx-secondary\{font-size:var\(--text-xs\)\}/);
  assert.match(block, /\.saved-home-card \.saved-home-verdict\{[^}]*font-size:var\(--text-xs\)/);
});
