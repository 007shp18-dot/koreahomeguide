const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const size = require('../rent-check-size.js');

function interactiveNode(initial = {}) {
  const listeners = new Map();
  return {
    value:'', dataset:{}, textContent:'', innerHTML:'', step:'',
    classList:{ toggle() {} },
    setAttribute() {},
    addEventListener(type, handler) { listeners.set(type, handler); },
    dispatchEvent(event) { const handler = listeners.get(event.type); if (handler) handler(event); return true; },
    emit(type) { const handler = listeners.get(type); if (handler) handler({ type, target:this }); },
    focus() {},
    ...initial
  };
}

function rentSizeDocument({ language = 'en', propertyType = 'apartment' } = {}) {
  const input = interactiveNode({ value:'25', dataset:{} });
  const type = interactiveNode({ value:propertyType });
  const buttons = [0, 1, 2].map(() => interactiveNode({ dataset:{ rentSizePreset:'0' } }));
  const nodes = {
    '#rentCheckAreaSqm':input,
    '#rentCheckType':type,
    '[data-size-unit-toggle]':null,
    '[data-size-unit-text]':null,
    '[data-rent-unit="size"]':null
  };
  return {
    input, type, buttons,
    documentElement:{ lang:language },
    querySelector(selector) { return nodes[selector] || null; },
    querySelectorAll(selector) { return selector === '[data-rent-size-preset]' ? buttons : []; }
  };
}

test('pyeong and square-metre conversions preserve the comparison area', () => {
  assert.equal(size.displayedValue(20, 'sqm'), '20');
  assert.equal(size.displayedValue(20, 'pyeong'), '6.0');
  assert.ok(Math.abs(size.readSqm({ value:'6', dataset:{ sizeUnit:'pyeong' } }) - 19.8348) < 0.0001);
  assert.equal(size.readSqm({ value:'0', dataset:{ sizeUnit:'sqm' } }), null);
});

test('property type presets describe representative floor areas instead of fixed room counts', () => {
  assert.deepEqual(size.presetConfig('apartment', 'en'), [
    { label:'Compact', sqm:35 }, { label:'Standard', sqm:60 }, { label:'Family', sqm:85 }
  ]);
  assert.deepEqual(size.presetConfig('officetel', 'en'), [
    { label:'Compact', sqm:15 }, { label:'Standard', sqm:20 }, { label:'Spacious', sqm:30 }
  ]);
  assert.deepEqual(size.presetConfig('villa', 'en').map(item => item.sqm), [20, 35, 60]);
  assert.deepEqual(size.presetConfig('detached', 'en').map(item => item.sqm), [20, 35, 50]);
  assert.deepEqual(size.presetConfig('studio', 'en').map(item => item.sqm), [15, 20, 25]);
  assert.deepEqual(size.presetConfig('apartment', 'zh-CN').map(item => item.label), ['紧凑', '标准', '家庭型']);
});

test('changing property type replaces preset-owned area with the new middle preset', () => {
  const doc = rentSizeDocument();
  const controller = size.init(doc);
  assert.equal(doc.input.value, '60');
  assert.deepEqual(doc.buttons.map(button => Number(button.dataset.rentSizePreset)), [35, 60, 85]);
  assert.match(doc.buttons[2].innerHTML, /Family/);

  doc.type.value = 'officetel';
  doc.type.emit('change');
  assert.equal(doc.input.value, '20');
  assert.deepEqual(doc.buttons.map(button => Number(button.dataset.rentSizePreset)), [15, 20, 30]);
  assert.equal(controller.source(), 'default');
});

test('changing property type preserves manual and Explorer-prefilled areas', () => {
  const manualDoc = rentSizeDocument();
  size.init(manualDoc);
  manualDoc.input.value = '42';
  manualDoc.input.emit('input');
  manualDoc.type.value = 'villa';
  manualDoc.type.emit('change');
  assert.equal(manualDoc.input.value, '42');
  assert.deepEqual(manualDoc.buttons.map(button => Number(button.dataset.rentSizePreset)), [20, 35, 60]);

  const prefillDoc = rentSizeDocument();
  const prefillController = size.init(prefillDoc);
  prefillController.setPrefilledSqm(27.5);
  prefillDoc.type.value = 'detached';
  prefillDoc.type.emit('change');
  assert.equal(prefillDoc.input.value, '27.5');
  assert.equal(prefillController.source(), 'prefill');
});

test('all Rent Check forms offer rough sizes, pyeong input and KRW by default', () => {
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<option value="KRW" selected>/, file);
    assert.match(html, /data-rent-size-preset="35"/, file);
    assert.match(html, /data-rent-size-preset="60"/, file);
    assert.match(html, /data-rent-size-preset="85"/, file);
    assert.match(html, /data-size-unit-toggle/, file);
    assert.match(html, /src="\/rent-check-size\.js"/, file);
    assert.match(html, /id="rentCheckDeposit"[^>]*inputmode="numeric"/, file);
  }
});

test('all Rent Check runtimes read normalized square metres and label mobile evidence', () => {
  for (const file of ['app.js','tools/seoul-rent-check/app.js',]) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /KHGRentSize\.readSqm\(areaSqm\)/, file);
    assert.match(source, /KHGRentSize\.init\(document\)/, file);
    assert.match(source, /sizeController\.setPropertyType\(type\.value/, file);
    assert.match(source, /sizeController\.setPrefilledSqm\(prefill\.areaSqm\)/, file);
    assert.match(source, /data-label="\$\{labels\[0\]\}"/, file);
  }
});

test('homepage next checks include the before-you-sign guide in both languages', () => {
  assert.match(fs.readFileSync('index.html', 'utf8'), /href="\/guides\/before-you-sign\/"/);
  assert.match(fs.readFileSync('zh/index.html', 'utf8'), /href="\/zh\/guides\/before-you-sign\/"/);
});

test('mobile comparable contracts use cards without horizontal scrolling', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.rent-check-result>\.table-wrap tbody tr\{display:grid/);
  assert.match(css, /content:attr\(data-label\)/);
  assert.match(css, /#rentCheckComparableBody\.is-expanded tr\.rent-check-mobile-extra\{display:grid\}/);
  assert.match(css, /tbody td:nth-child\(3\),\.rent-check-result>\.table-wrap tbody td:nth-child\(4\)\{grid-column:1\/-1/);
  assert.match(css, /tbody td:nth-child\(3\) \.fx-secondary,\.rent-check-result>\.table-wrap tbody td:nth-child\(4\) \.fx-secondary\{[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
});
