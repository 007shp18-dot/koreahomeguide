const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('styles.css', 'utf8');
const coldStartCss = fs.readFileSync('cold-start.css', 'utf8');
const combobox = fs.readFileSync('district-combobox.js', 'utf8');

function controlIsInsideLabel(html, id) {
  const control = html.indexOf(`id="${id}"`);
  return control >= 0 && html.lastIndexOf('<label', control) > html.lastIndexOf('</label>', control);
}

test('all keyboard-operable controls receive a shared visible focus fallback', () => {
  assert.match(css, /:where\(a,button,input,select,textarea,\[tabindex\]\):focus-visible\{[^}]*outline:3px solid/);
});

test('saved-home and district actions meet the 44px touch target floor', () => {
  assert.match(css, /\.district-combobox-option\{[^}]*min-height:44px/);
  assert.match(coldStartCss, /\.home-stage-grid a\{[^}]*min-height:96px/);
  assert.match(css, /\.saved-home-add-fee\{[^}]*min-height:44px/);
  assert.match(css, /\.saved-home-actions button,\.saved-home-actions a,\.saved-home-edit-form button\{[^}]*min-height:44px/);
  assert.match(css, /\.saved-home-favorite\{[^}]*width:44px[^}]*height:44px/);
  assert.match(css, /\.saved-home-cost-editor button\{[^}]*min-height:44px/);
});

test('core English and Chinese form controls retain visible label wrappers', () => {
  const files = [
    'index.html', 'zh/index.html',
    'tools/seoul-rent-check/index.html', 'zh/tools/seoul-rent-check/index.html',
    'tools/brokerage-fee-calculator/index.html', 'zh/tools/brokerage-fee-calculator/index.html'
  ];
  const controlIds = [
    'rentCheckArea', 'rentCheckType', 'rentCheckDeposit', 'rentCheckRent', 'rentCheckAreaSqm',
    'calcPropertyType', 'deposit', 'rent', 'maintenance', 'guaranteeInsurance', 'movingCleaning'
  ];
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    for (const id of controlIds.filter(id => html.includes(`id="${id}"`))) {
      assert.equal(controlIsInsideLabel(html, id), true, `${file}: ${id}`);
    }
    if (html.includes('data-lead-form')) {
      assert.match(html, /<label[^>]*>[^]*?<input[^>]*type="email"/, `${file}: lead email`);
    }
  }
});

test('progressively enhanced district search keeps an explicit localized accessible name', () => {
  assert.match(combobox, /setAttribute\('aria-label',language==='zh-CN'\?'地区':'Area'\)/);
});

test('reduced-motion users do not receive smooth scrolling or UI transitions', () => {
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^}]*html\{scroll-behavior:auto\}/);
  assert.match(css, /\*\{scroll-behavior:auto!important;transition-duration:0\.01ms!important/);
});
