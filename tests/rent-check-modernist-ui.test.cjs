const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = [
  'index.html',
  'zh/index.html',
  'tools/seoul-rent-check/index.html',
  'zh/tools/seoul-rent-check/index.html'
];
const stylesheet = '/rent-check-modernist.css?v=1';

test('home and Rent Check locales load the scoped Modernist layer after legacy styles', () => {
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const styles = html.indexOf('/styles.css?v=');
    const coldStart = html.indexOf('/cold-start.css?v=');
    const capture = html.indexOf('/experience-capture.css');
    const modernist = html.indexOf(stylesheet);

    assert.ok(styles >= 0, `${file} keeps the shared stylesheet`);
    assert.ok(coldStart > styles, `${file} keeps cold-start after shared styles`);
    assert.ok(capture > coldStart, `${file} keeps experience capture after cold-start`);
    assert.ok(modernist > capture, `${file} loads the scoped override last`);
  }
});

test('Modernist Rent Check layer keeps presentation tokens scoped and structural', () => {
  assert.equal(fs.existsSync('rent-check-modernist.css'), true, 'the scoped stylesheet exists');
  if (!fs.existsSync('rent-check-modernist.css')) return;

  const css = fs.readFileSync('rent-check-modernist.css', 'utf8');
  assert.match(css, /body\.core-ui\{[^}]*--rcm-ink:#201e1d[^}]*--rcm-ground:#f3f2f2[^}]*--rcm-surface:#eae9e9[^}]*--rcm-action:#1d4ed8[^}]*--rcm-divider:#8c8a89/);
  assert.match(css, /body\.core-ui\{[^}]*font-variant-numeric:tabular-nums/);
  assert.match(css, /body\.core-ui :focus-visible\{[^}]*outline:2px solid var\(--rcm-action\)[^}]*outline-offset:2px/);
  assert.match(css, /\.core-ui :is\(\.site-header,\.compact-header\)\{[^}]*border-bottom:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui :is\(\.funnel-rent-card,\.rent-check-page \.rent-check-card\)\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0[^}]*box-shadow:none/);
  assert.match(css, /\.core-ui \.rent-check-result>\.rent-check-summary\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui :is\(\.search-button,\.rent-size-presets button,\.rent-size-unit-toggle\)\{[^}]*min-height:44px[^}]*border-radius:0/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^}]*\.core-ui \*\{[^}]*transition:none!important/);
  assert.match(css, /\.core-ui \.rent-check-result>\.rent-check-summary\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-top:2px solid var\(--rcm-action\)/);
  assert.match(css, /\.core-ui \.rent-check-summary>\.rent-check-metrics\{[^}]*border-top:2px solid var\(--rcm-divider\)[^}]*border-bottom:2px solid var\(--rcm-divider\)/);
  assert.match(css, /\.core-ui \.rent-check-summary>\.rent-check-metrics>div\+div\{border-left:2px solid var\(--rcm-divider\)\}/);
  assert.match(css, /\.core-ui :is\(\.rent-rating,\.confidence-pill\)\{border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.rent-check-form>\.rent-check-assist-row\{[^}]*border-top:2px solid var\(--rcm-divider\)/);
  assert.match(css, /--rcm-divider:#8c8a89[\s\S]*var\(--rcm-divider\)/);
  assert.match(css, /\.core-ui \.lead-capture :is\(input,textarea\)\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0[^}]*background:var\(--rcm-ground\)/);
});

test('Modernist Rent Check layer leaves legacy grid areas and mobile field order untouched', () => {
  assert.equal(fs.existsSync('rent-check-modernist.css'), true, 'the scoped stylesheet exists');
  if (!fs.existsSync('rent-check-modernist.css')) return;

  const css = fs.readFileSync('rent-check-modernist.css', 'utf8');
  assert.doesNotMatch(css, /grid-template(?:-areas|-columns|-rows)?\s*:/, 'does not redefine form grid geometry');
  assert.doesNotMatch(css, /grid-area\s*:/, 'does not redefine form grid areas');
  assert.doesNotMatch(css, /\border\s*:/, 'does not redefine source or mobile field order');
});
