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

test('reparented evidence and generated Rent Check controls retain Modernist runtime geometry and focus', () => {
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
  assert.match(css, /\.core-ui \.rent-check-form :is\(select,\.district-combobox-input,\.selection-native,\.rent-check-money,\.rent-check-size\)\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.rent-check-form :is\(\.rent-check-money,\.rent-check-size\) input\{[^}]*border:0[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.rent-check-form>\.rent-check-button\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.rent-check-form>\.rent-check-assist-row :is\(\.rent-size-presets button,\.rent-size-unit-toggle\)\{[^}]*min-height:44px[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.rent-check-form :is\(select,\.district-combobox-input,\.selection-native\):focus-visible\{[^}]*outline:2px solid var\(--rcm-action\)[^}]*outline-offset:2px[^}]*box-shadow:none/);
  assert.match(css, /\.core-ui \.rent-check-form :is\(\.rent-check-money,\.rent-check-size\):focus-within\{[^}]*outline:2px solid var\(--rcm-action\)[^}]*outline-offset:2px[^}]*box-shadow:none/);
  assert.match(css, /\.core-ui \.rent-check-form>\.rent-check-button:focus-visible\{[^}]*outline:2px solid var\(--rcm-action\)[^}]*outline-offset:2px[^}]*box-shadow:none/);
  assert.match(css, /\.core-ui \.rent-check-form>\.rent-check-assist-row :is\(\.rent-size-presets button,\.rent-size-unit-toggle\):focus-visible\{[^}]*outline:2px solid var\(--rcm-action\)[^}]*outline-offset:2px[^}]*box-shadow:none/);
  assert.match(css, /\.core-ui \.rent-check-evidence-disclosure\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0[^}]*background:var\(--rcm-ground\)/);
  assert.match(css, /\.core-ui \.rent-check-evidence-disclosure-body>:is\(\.rent-check-evidence-head,\.table-wrap\)\{[^}]*border-top:2px solid var\(--rcm-divider\)[^}]*border-radius:0[^}]*background:var\(--rcm-ground\)/);
  assert.match(css, /\.core-ui \.rent-check-evidence-disclosure-body>\.table-wrap thead\{background:var\(--rcm-surface\)\}/);
  assert.match(css, /\.core-ui \.rent-check-result :is\(\.saved-quote-module,\.experience-capture,\.result-share-panel\)\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0[^}]*background:var\(--rcm-ground\)/);
  assert.match(css, /\.core-ui \.saved-quote-module :is\(\.saved-quote-form input,\.saved-quote-save,\.saved-quote-compare\)\{[^}]*min-height:44px[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.experience-capture :is\(\.experience-open,\.experience-context select,\.experience-money,\.experience-outcome span\)\{[^}]*min-height:44px[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.result-share-panel :is\(\.result-share-action,\.result-share-metrics\)\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.result-share-panel \.result-share-metrics>div\{[^}]*border-right:2px solid var\(--rcm-divider\)/);
  assert.match(css, /\.core-ui \.rent-check-comparables-toggle\{[^}]*min-height:44px[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui \.district-combobox-listbox\{[^}]*border:2px solid var\(--rcm-ink\)[^}]*border-radius:0[^}]*background:var\(--rcm-ground\)/);
  assert.match(css, /\.core-ui \.district-combobox-option\{[^}]*min-height:44px[^}]*border-bottom:2px solid var\(--rcm-divider\)[^}]*border-radius:0/);
  assert.match(css, /\.core-ui :is\(\.rent-check-comparables-toggle,\.district-combobox-option\):focus-visible\{[^}]*outline:2px solid var\(--rcm-action\)[^}]*outline-offset:2px[^}]*box-shadow:none/);
  assert.match(css, /\.core-ui \.experience-capture \.search-button,\.core-ui \.result-share-panel \.search-button\.result-share-action\{[^}]*background:var\(--rcm-action\)[^}]*color:var\(--rcm-on-action\)/, 'Experience and share primary actions retain the cobalt primary state');
  assert.doesNotMatch(css, /\.core-ui \.experience-capture :is\([^}]*\.search-button/, 'the neutral Experience control group must not override its primary submit action');
  assert.match(css, /\.core-ui \.experience-capture \.search-button:hover,\.core-ui \.result-share-panel \.search-button\.result-share-action:hover\{[^}]*background:var\(--rcm-action-dark\)/, 'Experience and share primary actions retain the dark cobalt hover state');
  assert.match(css, /\.core-ui \.experience-capture \.experience-open:hover,\.core-ui \.result-share-panel \.result-share-copy-button:hover\{[^}]*border-color:var\(--rcm-action\)[^}]*background:var\(--rcm-action-wash\)/, 'secondary generated actions retain visible hover feedback');
  const mobileCss = css.slice(css.indexOf('@media(max-width:760px){'));
  assert.match(mobileCss, /\.core-ui \.result-share-panel \.result-share-metrics>div\{[^}]*border-right:0[^}]*border-bottom:2px solid var\(--rcm-divider\)/, 'mobile share metrics clear desktop right borders before adding row dividers');
});

test('Modernist Rent Check layer leaves legacy grid areas and mobile field order untouched', () => {
  assert.equal(fs.existsSync('rent-check-modernist.css'), true, 'the scoped stylesheet exists');
  if (!fs.existsSync('rent-check-modernist.css')) return;

  const css = fs.readFileSync('rent-check-modernist.css', 'utf8');
  assert.doesNotMatch(css, /grid-template(?:-areas|-columns|-rows)?\s*:/, 'does not redefine form grid geometry');
  assert.doesNotMatch(css, /grid-area\s*:/, 'does not redefine form grid areas');
  assert.doesNotMatch(css, /\border\s*:/, 'does not redefine source or mobile field order');
});
