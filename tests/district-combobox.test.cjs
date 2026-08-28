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

test('all four Rent Check surfaces load progressive enhancement in the safe order', () => {
  for (const file of ['index.html', 'zh/index.html', 'tools/seoul-rent-check/index.html', 'zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.equal((html.match(/id="rentCheckArea"/g) || []).length, 1, file);
    assert.ok(html.indexOf('/location-catalog.js') < html.indexOf('/district-combobox.js'), file);
    assert.ok(html.indexOf('/district-combobox.js') < html.indexOf('/saved-rent-quotes.js'), file);
  }
});

test('combobox CSS provides visible keyboard states and mobile-safe targets', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  assert.match(css, /\.district-combobox-option\{[^}]*min-height:44px/);
  assert.match(css, /\.district-combobox-option\.is-active\{[^}]*border/);
  assert.match(css, /\.district-combobox-listbox\{[^}]*max-height:/);
});
