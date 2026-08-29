const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = [
  { file:'index.html', about:'/about/', guide:'/guides/before-you-sign/' },
  { file:'zh/index.html', about:'/zh/about/', guide:'/zh/guides/before-you-sign/' }
];

test('homepages use the approved five-part editorial structure', () => {
  for (const page of pages) {
    const html = fs.readFileSync(page.file, 'utf8');
    assert.match(html, /class="funnel-hero"/);
    assert.match(html, /class="home-stage-entry[^\"]*home-stage-route/);
    assert.match(html, /id="rent-check"[^>]*class="[^"]*home-rent-workspace|class="[^"]*home-rent-workspace[^"]*"[^>]*id="rent-check"/);
    assert.match(html, /class="home-primary-trust"/);
    assert.match(html, /class="funnel-proof-band"/);
    assert.match(html, /class="[^"]*funnel-updated-guides/);
    assert.doesNotMatch(html, /funnel-how|funnel-final-cta/);
    assert.match(html, /data-home-market-preview/);
    assert.equal((html.match(/data-home-guide-row/g) || []).length, 3, page.file);
    assert.match(html, new RegExp(`href="${page.about}"`));
    assert.match(html, new RegExp(`href="${page.guide}"`));
  }
});

test('homepages remove redundant marketing labels but preserve product hooks', () => {
  for (const page of pages) {
    const html = fs.readFileSync(page.file, 'utf8');
    assert.doesNotMatch(html, /YOUR NEXT STEP|FREE RENT CHECK|READY TO COMPARE|下一步<\/span>|免费租金检查|准备好比较了吗/);
    for (const id of ['rentCheckForm','rentCheckArea','rentCheckType','rentCheckDeposit','rentCheckRent','rentCheckAreaSqm','rentCheckButton','rentCheckResult']) {
      assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${page.file} ${id}`);
    }
    for (const stage of ['budget','looking','quote','signed']) assert.match(html, new RegExp(`data-home-stage="${stage}"`));
    assert.match(html, /data-lead-capture/);
    assert.match(html, /data-saved-quote-mount/);
  }
});

test('editorial home styling varies section rhythm and avoids card repetition', () => {
  const css = fs.readFileSync('cold-start.css', 'utf8');
  assert.match(css, /\.home-stage-route\{/);
  assert.match(css, /\.home-stage-route\s+\.home-stage-grid\{/);
  assert.match(css, /\.home-rent-workspace\{/);
  assert.match(css, /\.home-primary-trust\{/);
  assert.match(css, /\.home-guide-row\{/);
  assert.match(css, /\.home-market-preview\{/);
  assert.match(css, /@media\(max-width:720px\)/);
  assert.doesNotMatch(css, /\.home-guide-row\{[^}]*box-shadow:/);
});

test('district combobox and native property selectors share one polished control geometry', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /:is\(\.rent-check-form,\.explorer-search-card\) :is\(\.selection-native,\.district-combobox-input,select\)\{[^}]*height:52px/);
  assert.match(css, /:is\(\.rent-check-form,\.explorer-search-card\) :is\(\.selection-native,select\)\{[^}]*appearance:none[^}]*background-image:/);
  assert.match(css, /\.selection-native:focus-visible\{[^}]*box-shadow:/);
});

test('core Rent Check pages version the polished CSS and runtime assets', () => {
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /styles\.css\?v=18/, file);
    assert.match(html, /cold-start\.css\?v=18/, file);
    assert.match(html, /rent-check-ui-utils\.js\?v=18/, file);
    assert.match(html, /app\.js\?v=18/, file);
  }
});

test('desktop homepage Rent Check uses two aligned rows with size beside the primary selectors', () => {
  const css = fs.readFileSync('cold-start.css', 'utf8');
  const finalPass = css.slice(css.indexOf('/* v18 rent decision controls */'));
  assert.match(finalPass, /@media\(min-width:900px\)/);
  assert.match(finalPass, /\.home-rent-workspace \.rent-check-area-field\{[^}]*grid-area:area/);
  assert.match(finalPass, /\.home-rent-workspace \.rent-check-property-field\{[^}]*grid-area:type/);
  assert.match(finalPass, /\.home-rent-workspace \.rent-check-size-field\{[^}]*grid-area:size/);
  assert.match(finalPass, /\.home-rent-workspace \.rent-check-form>\.field:nth-child\(3\)\{[^}]*grid-area:deposit/);
  assert.match(finalPass, /\.home-rent-workspace \.rent-check-button\{[^}]*grid-area:submit/);
});
