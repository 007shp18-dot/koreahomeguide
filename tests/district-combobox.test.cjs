const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const comboPath = path.join(__dirname, '..', 'district-combobox.js');
const locations = require('../location-catalog.js');

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); }
  };
}

test('district search matches English Korean and Chinese labels', () => {
  const combo = require(comboPath);
  const rows = combo.buildDistrictOptions(locations.RENT_CHECK_DISTRICTS, 'en');
  assert.deepEqual(combo.filterDistricts(rows, 'Gangnam').map(row => row.code), ['11680']);
  assert.deepEqual(combo.filterDistricts(rows, '강남').map(row => row.code), ['11680']);
  assert.deepEqual(combo.filterDistricts(rows, '江南').map(row => row.code), ['11680']);
  assert.equal(rows.length, 25);
});

test('recent districts are valid unique and limited to three', () => {
  const combo = require(comboPath);
  const storage = memoryStorage();
  ['11680', '11440', '11170', '11200'].forEach(code => {
    combo.writeRecent(storage, code, locations.RENT_CHECK_DISTRICTS);
  });
  assert.deepEqual(combo.readRecent(storage, locations.RENT_CHECK_DISTRICTS), ['11200', '11170', '11440']);
  combo.writeRecent(storage, '99999', locations.RENT_CHECK_DISTRICTS);
  assert.deepEqual(combo.readRecent(storage, locations.RENT_CHECK_DISTRICTS), ['11200', '11170', '11440']);
});

test('storage failures do not block district selection', () => {
  const combo = require(comboPath);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(combo.readRecent(blocked, locations.RENT_CHECK_DISTRICTS), []);
  assert.equal(combo.writeRecent(blocked, '11680', locations.RENT_CHECK_DISTRICTS), '11680');
});

function fakeElement(tagName) {
  const classes = new Set();
  let text = '';
  const element = {
    tagName: tagName.toUpperCase(), children: [], attributes: {}, dataset: {}, listeners: {}, value: '', hidden: false,
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    insertBefore(child, reference) {
      const index = reference ? this.children.indexOf(reference) : -1;
      if (index < 0) this.children.push(child); else this.children.splice(index, 0, child);
      child.parentNode = this;
      return child;
    },
    removeChild(child) { this.children = this.children.filter(item => item !== child); child.parentNode = null; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(type, listener) { this.listeners[type] = listener; },
    select() { this.textSelected = true; },
    dispatchEvent(event) { this.lastEvent = event; if (this.listeners[event.type]) this.listeners[event.type](event); return true; }
  };
  Object.defineProperty(element, 'className', {
    get() { return [...classes].join(' '); },
    set(value) { classes.clear(); String(value).split(/\s+/).filter(Boolean).forEach(name => classes.add(name)); }
  });
  Object.defineProperty(element, 'textContent', {
    get() { return text; },
    set(value) { text = String(value); if (value === '') this.children = []; }
  });
  return element;
}

test('Enter selects a filtered district while Escape preserves the native value', () => {
  const combo = require(comboPath);
  const label = fakeElement('label');
  const select = fakeElement('select');
  select.id = 'rentCheckArea';
  select.value = '11680';
  label.appendChild(select);
  const doc = {
    documentElement: { lang: 'en' },
    querySelector(selector) { return selector === '#rentCheckArea' ? select : null; },
    createElement: fakeElement
  };
  const root = {
    KHGLocations: locations,
    localStorage: memoryStorage(),
    Event: class FakeEvent { constructor(type, options) { this.type = type; this.bubbles = options.bubbles; } },
    setTimeout(callback) { callback(); }
  };
  const wrapper = combo.mount({ root, doc });
  const input = wrapper.children[0];
  input.listeners.focus();
  assert.equal(input.textSelected, true);
  input.value = '마포';
  input.listeners.input();
  input.listeners.keydown({ key: 'Enter', preventDefault() {} });
  assert.equal(select.value, '11440');
  assert.equal(select.lastEvent.type, 'change');
  assert.equal(input.attributes['aria-expanded'], 'false');

  input.listeners.focus();
  input.value = '江南';
  input.listeners.input();
  input.listeners.keydown({ key: 'Escape', preventDefault() {} });
  assert.equal(select.value, '11440');
  assert.equal(input.attributes['aria-expanded'], 'false');
});

test('opening the district list omits the current selection while search can still find it', () => {
  const combo = require(comboPath);
  const label = fakeElement('label');
  const select = fakeElement('select');
  select.id = 'rentCheckArea';
  select.value = '11680';
  label.appendChild(select);
  const doc = {
    documentElement: { lang: 'en' },
    querySelector(selector) { return selector === '#rentCheckArea' ? select : null; },
    createElement: fakeElement
  };
  const storage = memoryStorage({
    [combo.STORAGE_KEY]: JSON.stringify(['11680', '11440'])
  });
  const root = {
    KHGLocations: locations,
    localStorage: storage,
    Event: class FakeEvent { constructor(type, options) { this.type = type; this.bubbles = options.bubbles; } },
    setTimeout(callback) { callback(); }
  };
  const wrapper = combo.mount({ root, doc });
  const input = wrapper.children[0];
  const listbox = wrapper.children[1];

  input.listeners.focus();
  const openCodes = listbox.children.map(option => option.dataset.districtCode);
  assert.equal(openCodes.includes('11680'), false);
  assert.equal(openCodes.filter(code => code === '11440').length, 1);

  input.listeners.input();
  const unchangedInputCodes = listbox.children.map(option => option.dataset.districtCode);
  assert.equal(unchangedInputCodes.includes('11680'), false);
  assert.equal(new Set(unchangedInputCodes).size, unchangedInputCodes.length);

  input.value = '江南';
  input.listeners.input();
  assert.deepEqual(listbox.children.map(option => option.dataset.districtCode), ['11680']);
});

test('select-backed district rows keep Explorer options and localized All Seoul', () => {
  const combo = require(comboPath);
  const select = fakeElement('select');
  select.options = [
    { value: '11680', textContent: 'Gangnam-gu (강남구)' },
    { value: '11680', textContent: 'Gangnam-gu (강남구)' },
    { value: '11440', textContent: 'Mapo-gu (마포구)' },
    { value: 'all', textContent: 'All supported Seoul' }
  ];
  const rows = combo.buildSelectOptions(select, locations.RENT_CHECK_DISTRICTS, 'en');
  assert.deepEqual(rows.map(row => row.code), ['11680', '11440', 'all']);
  assert.deepEqual(combo.filterDistricts(rows, '서울 전체').map(row => row.code), ['all']);
  assert.deepEqual(combo.filterDistricts(rows, '江南').map(row => row.code), ['11680']);
});

test('Explorer mount selects All Seoul and dispatches the existing change event', () => {
  const combo = require(comboPath);
  const label = fakeElement('label');
  const select = fakeElement('select');
  select.id = 'exploreArea';
  select.value = '11680';
  select.options = [
    { value: '11680', textContent: 'Gangnam-gu (강남구)' },
    { value: '11440', textContent: 'Mapo-gu (마포구)' },
    { value: 'all', textContent: 'All supported Seoul' }
  ];
  label.appendChild(select);
  const doc = {
    documentElement: { lang: 'en' },
    querySelector(selector) { return selector === '#exploreArea' ? select : null; },
    createElement: fakeElement
  };
  const root = {
    KHGLocations: locations,
    localStorage: memoryStorage(),
    Event: class FakeEvent { constructor(type, options) { this.type = type; this.bubbles = options.bubbles; } },
    setTimeout(callback) { callback(); }
  };
  const wrapper = combo.mount({ root, doc, selector: '#exploreArea' });
  const input = wrapper.children[0];
  input.listeners.focus();
  input.value = 'All Seoul';
  input.listeners.input();
  input.listeners.keydown({ key: 'Enter', preventDefault() {} });
  assert.equal(select.value, 'all');
  assert.equal(select.lastEvent.type, 'change');
  assert.equal(input.value, 'All supported Seoul');
});

test('mountAll enhances Rent Check and Explorer independently', () => {
  const combo = require(comboPath);
  assert.equal(typeof combo.mountAll, 'function');
  assert.match(fs.readFileSync(comboPath, 'utf8'), /mountAll\(\{root,doc:root\.document\}\)/);
});

test('all four Rent Check surfaces load progressive enhancement in the safe order', () => {
  for (const file of ['index.html', 'zh/index.html', 'tools/seoul-rent-check/index.html', 'zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.equal((html.match(/id="rentCheckArea"/g) || []).length, 1, file);
    assert.ok(html.indexOf('/location-catalog.js') < html.indexOf('/district-combobox.js'), file);
    assert.ok(html.indexOf('/district-combobox.js') < html.indexOf('/saved-rent-quotes.js'), file);
  }
});

test('both Explorer pages load district search before their locale app', () => {
  for (const file of ['explore/index.html', 'zh/explore/index.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.equal((html.match(/id="exploreArea"/g) || []).length, 1, file);
    assert.ok(html.indexOf('/location-catalog.js') < html.indexOf('/district-combobox.js'), file);
    assert.ok(html.indexOf('/district-combobox.js') < html.indexOf(file.startsWith('zh/') ? '/zh/explore/app.js' : '/explore/app.js'), file);
    assert.match(html, /id="exploreType"[^>]*class="[^"]*selection-native/);
  }
});

test('combobox CSS provides visible keyboard states and mobile-safe targets', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  assert.match(css, /\.district-combobox-option\{[^}]*min-height:44px/);
  assert.match(css, /\.district-combobox-option\.is-active\{[^}]*border/);
  assert.match(css, /\.district-combobox-listbox\{[^}]*max-height:/);
});
