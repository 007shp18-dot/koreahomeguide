const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('core product pages share the approved editorial spacing and radius contract', () => {
  const css = read('styles.css');

  assert.match(css, /--radius-card:\s*16px/);
  assert.match(css, /--radius-action:\s*11px/);
  assert.match(css, /--section-space:\s*80px/);
  assert.match(css, /--section-space-mobile:\s*56px/);
  assert.match(
    css,
    /\.core-ui \.rent-check-card,\.core-ui \.tool-card,\.core-ui \.explorer-search-card,\.core-ui \.explorer-map-card\{[^}]*border:1px solid var\(--line\)[^}]*border-radius:var\(--radius-card\)[^}]*box-shadow:none/
  );
  assert.match(
    css,
    /\.core-ui \.search-button,\.core-ui \.explorer-primary-link\{[^}]*border-radius:var\(--radius-action\)/
  );
});

test('core entry-page heroes stay compact instead of returning to oversized marketing type', () => {
  const css = read('styles.css');

  assert.match(
    css,
    /\.core-ui \.funnel-hero h1,\.core-ui \.tool-hero h1,\.core-ui \.explorer-hero h1\{[^}]*font-size:clamp\(40px,5vw,56px\)/
  );
  assert.match(
    css,
    /@media\(max-width:760px\)[^]*\.core-ui \.funnel-hero h1,\.core-ui \.tool-hero h1,\.core-ui \.explorer-hero h1\{[^}]*font-size:clamp\(36px,10vw,44px\)/
  );
});

for (const [file, explorerPath, guidePath] of [
  ['index.html', '/explore/', '/guides/'],
  ['zh/index.html', '/zh/explore/', '/zh/guides/']
]) {
  test(`${file} follows the quote to evidence to action editorial flow`, () => {
    const html = read(file);
    const rentCheckAt = html.indexOf('id="rent-check"');
    const howAt = html.indexOf('class="funnel-section funnel-how"');
    const proofAt = html.indexOf('class="funnel-proof-band"');
    const guidesAt = html.indexOf('class="funnel-section funnel-updated-guides"');
    const finalAt = html.indexOf('class="funnel-final-cta"');

    assert.ok(rentCheckAt >= 0, `${file} Rent Check`);
    assert.ok(rentCheckAt < howAt, `${file} keeps Rent Check before explanation`);
    assert.ok(howAt < proofAt, `${file} explains before showing map evidence`);
    assert.ok(proofAt < guidesAt, `${file} places updated content after product proof`);
    assert.ok(guidesAt < finalAt, `${file} ends with one restrained CTA`);
    assert.equal((html.match(/data-home-how-step/g) || []).length, 3, `${file} three steps`);
    assert.match(html, new RegExp(`class="funnel-proof-action" href="${explorerPath}"`));
    assert.match(html, /class="funnel-section funnel-updated-guides"/);
    assert.equal((html.match(/class="funnel-guide"/g) || []).length, 3, `${file} guide cards`);
    assert.match(html, new RegExp(`class="funnel-guides-link" href="${guidePath}"`));
    assert.match(html, /class="funnel-final-action" href="#rent-check"/);
  });
}

test('homepage editorial bands retain readable contrast and stack in task order on mobile', () => {
  const css = read('cold-start.css');

  assert.match(css, /\.funnel-how-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.funnel-proof-band\{[^}]*background:#0b1f3a[^}]*color:#fff/);
  assert.match(css, /\.funnel-proof-action\{[^}]*min-height:44px[^}]*border-radius:var\(--radius-action\)/);
  assert.match(css, /\.funnel-final-cta\{[^}]*border-radius:var\(--radius-card\)/);
  assert.match(
    css,
    /@media\(max-width:760px\)[^]*\.funnel-how-grid,\.funnel-proof-inner,\.funnel-proof-grid\{grid-template-columns:1fr\}/
  );
});

test('Rent Check and Explorer align utility surfaces while keeping evidence visually distinct', () => {
  const css = read('styles.css');

  assert.match(css, /\.core-ui \.page-shell\{[^}]*padding-top:40px[^}]*padding-bottom:var\(--section-space\)/);
  assert.match(css, /\.core-ui \.tool-hero,\.core-ui \.explorer-hero\{[^}]*margin-bottom:24px/);
  assert.match(css, /\.core-ui \.tool-card,\.core-ui \.explorer-search-card\{[^}]*padding:24px/);
  assert.match(css, /\.core-ui \.explorer-map-selection,\.core-ui \.tool-explainer\{[^}]*background:var\(--surface-soft\)/);
  assert.match(css, /\.core-ui \.tool-explainer,\.core-ui \.explorer-next-step\{[^}]*margin-top:56px/);
  assert.match(
    css,
    /@media\(max-width:760px\)[^]*\.core-ui \.page-shell\{[^}]*padding-left:16px[^}]*padding-right:16px/
  );

  for (const file of ['explore/index.html', 'zh/explore/index.html']) {
    const html = read(file);
    assert.match(html, /class="explorer-map-layout"/);
    assert.match(html, /class="explorer-map-selection"/);
  }
});
