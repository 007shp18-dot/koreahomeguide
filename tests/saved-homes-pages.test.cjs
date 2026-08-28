const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('localized saved-home pages are private browser tools with clear limits', () => {
  for (const file of ['saved-homes/index.html','zh/saved-homes/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /name="robots" content="noindex,follow"/, file);
    assert.match(html, /saved-rent-quotes\.js/, file);
    assert.match(html, /saved-homes-page\.js/, file);
    assert.match(html, /privacy-consent\.js/, file);
    assert.match(html, /(?:90 days|90 天|90天)/, file);
    assert.match(html, /(?:(?:current|this) browser|当前浏览器)/, file);
    assert.match(html, /href="\/(?:zh\/)?privacy\/"/, file);
    assert.match(html, /href="\/(?:zh\/)?terms\/"/, file);
    assert.match(html, /href="\/(?:zh\/)?tools\/seoul-rent-check\/"/, file);
  }
});

test('all four Rent Check entry points bind saved quotes before their result runtime', () => {
  const files = [
    ['index.html','/app.js'], ['zh/index.html','/zh/app.js'],
    ['tools/seoul-rent-check/index.html','/tools/seoul-rent-check/app.js'],
    ['zh/tools/seoul-rent-check/index.html','/zh/tools/seoul-rent-check/app.js']
  ];
  for (const [file, runtime] of files) {
    const html = fs.readFileSync(file, 'utf8');
    assert.equal((html.match(/saved-rent-quotes\.js/g) || []).length, 1, file);
    assert.ok(html.indexOf('/saved-rent-quotes.js') < html.indexOf(runtime), file);
  }
});

test('every saved-home entry point loads the shared district catalog first', () => {
  for (const file of [
    'index.html','tools/seoul-rent-check/index.html','saved-homes/index.html',
    'zh/index.html','zh/tools/seoul-rent-check/index.html','zh/saved-homes/index.html'
  ]) {
    const html = fs.readFileSync(file, 'utf8');
    const catalog = html.indexOf('/location-catalog.js');
    const saved = html.indexOf('/saved-rent-quotes.js');
    assert.ok(catalog >= 0, `${file} loads the shared location catalog`);
    assert.ok(catalog < saved, `${file} loads locations before saved quotes`);
  }
});

test('saved comparison code avoids account, address, landlord, and broker data fields', () => {
  const source = fs.readFileSync('saved-rent-quotes.js', 'utf8');
  assert.match(source, /MAX_QUOTES = 8/);
  assert.match(source, /RETENTION_MS = 90/);
  assert.doesNotMatch(source, /name=["'](?:email|address|landlord|broker)/i);
  assert.doesNotMatch(source, /fetch\(/);
});

test('saved quote flow mounts after result evidence and prevents duplicate saves', () => {
  const source = fs.readFileSync('saved-rent-quotes.js', 'utf8');
  assert.match(source, /result\.querySelector\('\[data-saved-quote-mount\]'\)/);
  assert.match(source, /mount\.appendChild\(panel\)/);
  assert.match(source, /savedCurrentResult = true/);
  assert.match(source, /button\.disabled = true/);
  assert.match(source, /class="saved-quote-compare"/);
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    const evidence = html.indexOf('id="rentCheckComparableBody"');
    const mount = html.indexOf('data-saved-quote-mount');
    assert.ok(evidence >= 0 && mount > evidence, file);
    const next = html.indexOf('id="rentCheckNextPrimary"');
    if (next >= 0) assert.ok(mount > next, file);
  }
});

test('comparison includes market context and keeps row labels visible while scrolling', () => {
  const source = fs.readFileSync('saved-homes-page.js', 'utf8');
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(source, /Comparable median/);
  assert.match(source, /Difference from median/);
  assert.match(source, /可比成交中位数/);
  assert.match(css, /\.saved-homes-table th:first-child\{position:sticky/);
});

test('saved-home comparison supports editing, private rechecks, and mobile cards', () => {
  const source = fs.readFileSync('saved-homes-page.js', 'utf8');
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(source, /saved-home-edit/);
  assert.match(source, /updateLabel\(/);
  assert.match(source, /writeRecheckPrefill\(/);
  assert.match(source, /saved-home-recheck/);
  assert.match(source, /saved-homes-comparison-cards/);
  assert.match(source, /data-add-fee-for/);
  assert.match(source, /data-fee-input-for/);
  assert.match(source, /Add fee to compare/);
  assert.match(source, /填写管理费后比较/);
  assert.match(source, /saved-homes-completeness-note/);
  assert.match(source, /comparisonCompleteness\(chosen\)/);
  assert.match(source, /completeness\.missing === 1 \? 'is' : 'are'/);
  assert.match(source, /reduceMotionQuery[^]*behavior:reduceMotionQuery && reduceMotionQuery\.matches \? 'auto' : 'smooth'/);
  assert.match(source, /saved_quotes_return_visit/);
  assert.match(css, /\.saved-homes-comparison-cards/);
  assert.match(css, /\.saved-home-add-fee\{[^}]*min-height:44px/);
  assert.match(css, /@media\(max-width:760px\)[^{]*\{[^}]*\.saved-homes-table-wrap\{display:none\}/s);
  for (const file of ['saved-homes/index.html','zh/saved-homes/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /id="savedHomesStatus"/);
  }
});

test('saved-home comparison supports private decision notes, visit state, candidates, and checks', () => {
  const source = fs.readFileSync('saved-homes-page.js', 'utf8');
  const css = fs.readFileSync('styles.css', 'utf8');

  assert.match(source, /saved-home-decision-editor/);
  assert.match(source, /updateDecisionDetails\(/);
  assert.match(source, /noteInput\.maxLength = 240/);
  assert.match(source, /isVisited/);
  assert.match(source, /isContractCandidate/);
  for (const key of ['registryOwner','depositProtection','managementFeeBreakdown','contractTerms']) {
    assert.match(source, new RegExp(key));
  }
  assert.match(source, /checklistProgress\(quote\)/);
  assert.match(source, /Private note/);
  assert.match(source, /Visit status/);
  assert.match(source, /Contract candidate/);
  assert.match(source, /Contract checks/);
  assert.match(source, /私人备注/);
  assert.match(source, /看房状态/);
  assert.match(source, /签约候选/);
  assert.match(source, /签约前检查/);
  assert.match(source, /saved_quote_decision_updated/);
  assert.match(css, /\.saved-home-decision-editor/);
  assert.match(css, /\.saved-home-decision-save\{[^}]*min-height:44px/);
});

test('saved-home pages describe checklist progress without claiming legal verification or a risk score', () => {
  const english = fs.readFileSync('saved-homes/index.html', 'utf8');
  const chinese = fs.readFileSync('zh/saved-homes/index.html', 'utf8');

  assert.match(english, /not legal verification or a risk score/i);
  assert.match(chinese, /不代表法律核验或风险评分/);
  assert.match(english, /notes, visit status, contract candidates/i);
  assert.match(chinese, /备注、看房状态、签约候选/);
});

test('Rent Check consumes saved-home recheck values without putting prices in the page URL', () => {
  const comparisonSource = fs.readFileSync('saved-homes-page.js', 'utf8');
  const savedSource = fs.readFileSync('saved-rent-quotes.js', 'utf8');
  assert.match(comparisonSource, /new URLSearchParams\(\{ lawdCd:quote\.districtCode, type:quote\.propertyType, from:sourcePath \}\)/);
  assert.doesNotMatch(comparisonSource, /new URLSearchParams\(\{[^}]+(?:depositWon|monthlyRentWon|areaSqm)/);
  for (const file of ['app.js','zh/app.js','tools/seoul-rent-check/app.js','zh/tools/seoul-rent-check/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /takeRecheckPrefill\(window\.sessionStorage/);
    assert.match(source, /savedQuoteId:acquisitionContext\.savedQuoteId\|\|null/, file);
  }
  assert.match(savedSource, /id:detail\.savedQuoteId\s*\|\|\s*''/);
});

test('studio results keep their user-facing type when saved while APIs use the official fallback', () => {
  const savedSource = fs.readFileSync('saved-rent-quotes.js', 'utf8');
  assert.match(savedSource, /savedPropertyType/);
  for (const file of ['app.js','zh/app.js','tools/seoul-rent-check/app.js','zh/tools/seoul-rent-check/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /savedPropertyType:type\.value/, file);
    assert.match(source, /propertyType:mapped\.officialType/, file);
  }
});
