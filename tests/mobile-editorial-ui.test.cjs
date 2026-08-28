const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const homeCss = fs.readFileSync('cold-start.css', 'utf8');
const sharedCss = fs.readFileSync('styles.css', 'utf8');

test('mobile home uses a compact left-aligned editorial hierarchy', () => {
  assert.match(
    homeCss,
    /@media\(max-width:720px\)[^]*\.funnel-hero\{[^}]*padding:28px 16px 18px[^}]*text-align:left/
  );
  assert.match(
    homeCss,
    /@media\(max-width:720px\)[^]*\.funnel-hero h1\{[^}]*font-size:clamp\(34px,10vw,40px\)/
  );
  assert.match(homeCss, /@media\(max-width:720px\)[^]*\.home-evidence-line\{[^}]*margin:18px 0 0!important/);
});

test('mobile renter stages become short rows on narrow phones', () => {
  const compactAt = homeCss.lastIndexOf('@media(max-width:420px)');
  const editorialMobileAt = homeCss.lastIndexOf('@media(max-width:720px)');

  assert.ok(compactAt > editorialMobileAt, 'the narrow-phone override comes after the editorial mobile rules');
  assert.match(
    homeCss.slice(compactAt),
    /\.home-stage-route \.home-stage-grid\{grid-template-columns:1fr\}/
  );
  assert.match(homeCss.slice(compactAt), /\.home-stage-route \.home-stage-grid a\{[^}]*min-height:64px/);
});

test('mobile Rent Check and evidence sections shed nested-card weight', () => {
  assert.match(
    homeCss,
    /@media\(max-width:720px\)[^]*\.home-rent-workspace \.funnel-rent-card\{[^}]*border-left:0[^}]*border-right:0[^}]*border-radius:0[^}]*box-shadow:none/
  );
  assert.match(homeCss, /@media\(max-width:720px\)[^]*\.home-rent-workspace\{[^}]*padding-top:28px[^}]*padding-bottom:40px/);
  assert.match(homeCss, /@media\(max-width:720px\)[^]*\.funnel-proof-band\{border-radius:0/);
  assert.match(
    homeCss,
    /@media\(max-width:720px\)[^]*\.funnel-proof-grid>div\[data-home-proof-metric\]\{[^}]*border-left:0[^}]*border-right:0[^}]*border-radius:0[^}]*background:transparent/
  );
});

test('shared mobile pages keep titles, sections, and navigation compact', () => {
  assert.match(
    sharedCss,
    /@media\(max-width:720px\)\{\.about-shell\{[^}]*padding:24px 18px 56px[^}]*\}\.about-hero\{[^}]*padding:24px 0 36px[^}]*\}\.about-hero h1\{font-size:clamp\(2\.5rem,11vw,3rem\)\}/
  );
  assert.match(sharedCss, /@media\(max-width:720px\)[^]*\.about-section\{[^}]*padding:34px 0/);
  assert.match(sharedCss, /\.mobile-primary-nav-link\{[^}]*min-height:54px/);
  assert.match(sharedCss, /@media\(max-width:760px\)\{body\{padding-bottom:calc\(58px \+ env\(safe-area-inset-bottom\)\)/);
});
