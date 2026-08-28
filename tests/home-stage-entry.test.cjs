const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.join(__dirname, '..', 'home-stage-entry.js');

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('stage catalogue routes four rental stages without inventing a settlement tool', () => {
  const stage = require(modulePath);
  assert.deepEqual(stage.buildStageItems('en').map(item => [item.id, item.href]), [
    ['budget', '/guides/rent-apartment-korea-foreigner/#budget'],
    ['looking', '/explore/'],
    ['quote', '#rent-check'],
    ['signed', '/guides/rent-apartment-korea-foreigner/#move-in']
  ]);
  assert.deepEqual(stage.buildStageItems('zh-CN').map(item => item.href), [
    '/zh/guides/rent-apartment-korea-foreigner/#budget',
    '/zh/explore/',
    '#rent-check',
    '/zh/guides/rent-apartment-korea-foreigner/#move-in'
  ]);
  assert.doesNotMatch(JSON.stringify(stage.buildStageItems('en')), /settlement-timeline/);
});

test('stage persistence accepts only approved IDs and analytics stays bounded', () => {
  const stage = require(modulePath);
  const storage = memoryStorage();
  assert.equal(stage.writeStage(storage, 'looking'), 'looking');
  assert.equal(stage.readStage(storage), 'looking');
  assert.equal(stage.writeStage(storage, 'email@example.com'), null);
  assert.equal(stage.readStage(storage), 'looking');
  assert.deepEqual(stage.buildStageEvent('signed', 'zh-CN'), {
    stage: 'signed',
    language: 'zh-CN'
  });
  assert.equal(stage.buildStageEvent('not-a-stage', 'en'), null);
});

test('storage failures never block a valid stage selection', () => {
  const stage = require(modulePath);
  const storage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); }
  };
  assert.equal(stage.readStage(storage), '');
  assert.equal(stage.writeStage(storage, 'budget'), 'budget');
});

test('localized home pages expose four measurable stage links before Rent Check', () => {
  for (const [file, language] of [['index.html', 'en'], ['zh/index.html', 'zh-CN']]) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.equal((html.match(/data-home-stage="(?:budget|looking|quote|signed)"/g) || []).length, 4, file);
    assert.ok(html.indexOf('data-home-stage-entry') < html.indexOf('id="rent-check"'), file);
    assert.match(html, /<script src="\/home-stage-entry\.js"><\/script>/, file);
    assert.match(html, new RegExp(`data-language="${language}"`), file);
  }
});

test('budget and move-in stage links land on stable localized guide anchors', () => {
  for (const file of [
    'guides/rent-apartment-korea-foreigner/index.html',
    'zh/guides/rent-apartment-korea-foreigner/index.html'
  ]) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(html, /<h2 id="budget">/, file);
    assert.match(html, /<h2 id="move-in">/, file);
  }
});

test('stage cards retain mobile visibility and reduced-motion safety', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'cold-start.css'), 'utf8');
  assert.match(css, /\.home-stage-grid\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:760px\)\{[^}]*\.home-stage-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:420px\)\{[^}]*\.home-stage-grid\{[^}]*grid-template-columns:1fr/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^}]*html\{scroll-behavior:auto/);
});
