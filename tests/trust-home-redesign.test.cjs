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
    assert.match(html, /class="home-trust-note"/);
    assert.match(html, /class="funnel-proof-band"/);
    assert.match(html, /class="[^"]*funnel-updated-guides/);
    assert.doesNotMatch(html, /funnel-how|funnel-final-cta/);
    assert.equal((html.match(/data-home-proof-metric/g) || []).length, 2, page.file);
    assert.equal((html.match(/data-home-guide-row/g) || []).length, 4, page.file);
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
  assert.match(css, /\.home-trust-note\{/);
  assert.match(css, /\.home-guide-row\{/);
  assert.match(css, /\.home-proof-source\{/);
  assert.match(css, /@media\(max-width:720px\)/);
  assert.doesNotMatch(css, /\.home-guide-row\{[^}]*box-shadow:/);
});

test('closed native property selectors share the district control geometry', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.selection-native\{[^}]*min-height:49px/);
  assert.match(css, /\.selection-native:focus-visible\{[^}]*box-shadow:/);
});
