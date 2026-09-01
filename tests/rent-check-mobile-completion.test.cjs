const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

test('mobile result reveal scrolls once with motion preference respected', () => {
  const { reveal } = require('../rent-check-result-reveal.js');
  const calls = [];
  const result = { scrollIntoView(options) { calls.push(options); } };

  assert.equal(reveal(result, {
    innerWidth: 390,
    matchMedia: () => ({ matches: false })
  }), true);
  assert.deepEqual(calls.pop(), { behavior: 'smooth', block: 'start' });

  assert.equal(reveal(result, {
    innerWidth: 390,
    matchMedia: () => ({ matches: true })
  }), true);
  assert.deepEqual(calls.pop(), { behavior: 'auto', block: 'start' });
});

test('desktop result reveal does not move the viewport', () => {
  let calls = 0;
  const result = { scrollIntoView() { calls += 1; } };
  assert.equal(revealFromModule(result, 1280), false);
  assert.equal(calls, 0);
});

function revealFromModule(result, innerWidth) {
  const { reveal } = require('../rent-check-result-reveal.js');
  return reveal(result, { innerWidth, matchMedia: () => ({ matches: false }) });
}

test('all Rent Check runtimes reveal the result and leave status idle after success', () => {
  const runtimes = [
    'app.js',
    
    'tools/seoul-rent-check/app.js',
    ];

  for (const runtime of runtimes) {
    const source = read(runtime);
    assert.match(source, /KHGRentCheckResultReveal\.reveal\(result,window\)/, runtime);
    assert.match(source, /setStatus\('',\s*'idle'\)/, runtime);
    assert.match(source, /summary\.hidden=true/, runtime);
    assert.doesNotMatch(source, /summary\.textContent=/, runtime);
    assert.doesNotMatch(source, /Comparison complete\.|比较完成。/, runtime);
  }
});

test('all Rent Check pages load the reveal helper before their runtime', () => {
  const pages = [
    ['index.html', '/app.js'],
    ['zh/index.html', '/app.js'],
    ['tools/seoul-rent-check/index.html', '/tools/seoul-rent-check/app.js'],
    ['zh/tools/seoul-rent-check/index.html', '/tools/seoul-rent-check/app.js']
  ];

  for (const [page, runtime] of pages) {
    const html = read(page);
    const helperIndex = html.indexOf('/rent-check-result-reveal.js');
    const runtimeIndex = html.indexOf(runtime);
    assert.ok(helperIndex >= 0, `${page} loads the reveal helper`);
    assert.ok(runtimeIndex > helperIndex, `${page} loads helper before runtime`);
  }
});

test('Rent Check result reserves fixed-header and mobile-nav space', () => {
  const css = read('styles.css');
  assert.match(css, /#rentCheckResult\s*\{[^}]*scroll-margin-top:\s*68px;[^}]*scroll-margin-bottom:\s*84px;/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[^{]*\{[\s\S]*body:has\(#rentCheckResult\)\s*\{[^}]*padding-bottom:\s*84px;/s);
});
