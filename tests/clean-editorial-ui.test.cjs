const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('core product pages share the approved editorial spacing and radius contract', () => {
  const css = read('styles.css');

  assert.match(css, /--radius-sm:\s*8px/);
  assert.match(css, /--radius-md:\s*12px/);
  assert.match(css, /--radius-lg:\s*16px/);
  assert.doesNotMatch(css, /--radius-(?:card|action)\s*:/);
  assert.match(css, /--section-space:\s*80px/);
  assert.match(css, /--section-space-mobile:\s*56px/);
  assert.match(
    css,
    /\.core-ui \.rent-check-card,\.core-ui \.tool-card,\.core-ui \.explorer-search-card,\.core-ui \.explorer-map-card\{[^}]*border:1px solid var\(--line\)[^}]*border-radius:var\(--radius-lg\)[^}]*box-shadow:none/
  );
  assert.match(
    css,
    /\.core-ui \.search-button,\.core-ui \.explorer-primary-link\{[^}]*border-radius:var\(--radius-md\)/
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
    const stageAt = html.indexOf('home-stage-route');
    const trustAt = html.indexOf('class="home-trust-note"');
    const proofAt = html.indexOf('class="funnel-proof-band"');
    const guidesAt = html.indexOf('class="funnel-section funnel-updated-guides"');

    assert.ok(rentCheckAt >= 0, `${file} Rent Check`);
    assert.ok(rentCheckAt < stageAt, `${file} puts Rent Check before stage routing`);
    assert.ok(stageAt < proofAt, `${file} keeps stage routing after the result workspace`);
    assert.ok(proofAt < guidesAt, `${file} places updated content after product proof`);
    assert.equal(trustAt, -1, `${file} removes the oversized independence panel`);
    assert.doesNotMatch(html, /funnel-how|funnel-final-cta/);
    assert.match(html, new RegExp(`class="funnel-proof-action" href="${explorerPath}"`));
    assert.match(html, /class="funnel-section funnel-updated-guides"/);
    assert.equal((html.match(/class="home-guide-row"/g) || []).length, 3, `${file} guide rows`);
    assert.match(html, new RegExp(`class="funnel-guides-link" href="${guidePath}"`));
    assert.match(html, /class="home-primary-trust"/);
    assert.match(html, /data-home-market-preview/);
    assert.doesNotMatch(html, /SEOUL RENT CHECK|KEEP THIS RENT CHECK|保存这次租金检查/);
  });
}

test('homepage editorial bands retain readable contrast and stack in task order on mobile', () => {
  const css = read('cold-start.css');

  assert.match(css, /\.home-stage-route \.home-stage-grid\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /\.home-market-preview\{[^}]*border-top:1px solid var\(--line\)/);
  assert.match(css, /\.funnel-proof-action\{[^}]*min-height:44px[^}]*border-radius:var\(--radius-md\)/);
  assert.match(css, /\.home-primary-trust\{[^}]*border-top:1px solid var\(--line\)/);
  assert.match(css, /\.home-guide-row\{[^}]*border-radius:0[^}]*background:transparent/);
  assert.match(css, /@media\(max-width:720px\)[^]*\.home-rent-workspace \.rent-check-form\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:720px\)[^]*\.home-rent-workspace \.rent-check-size-field[^}]*grid-column:1\/-1/);
  assert.match(
    css,
    /@media\(max-width:360px\)[^]*\.home-rent-workspace \.rent-check-form\{grid-template-columns:1fr\}/
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
    assert.match(html, /class="[^"]*explorer-map-layout[^"]*"/);
    assert.match(html, /class="explorer-map-selection"/);
  }
});
