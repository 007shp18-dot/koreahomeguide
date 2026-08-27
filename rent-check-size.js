(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGRentSize = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const SQM_PER_PYEONG = 3.3058;

  function normalizedUnit(input) {
    return input && input.dataset && input.dataset.sizeUnit === 'pyeong' ? 'pyeong' : 'sqm';
  }

  function readSqm(input) {
    const value = Number(input && input.value);
    if (!Number.isFinite(value) || value <= 0) return null;
    return normalizedUnit(input) === 'pyeong' ? value * SQM_PER_PYEONG : value;
  }

  function displayedValue(sqm, unit) {
    const value = Number(sqm);
    if (!Number.isFinite(value) || value <= 0) return '';
    return unit === 'pyeong' ? (value / SQM_PER_PYEONG).toFixed(1) : value.toFixed(1).replace(/\.0$/, '');
  }

  function setSqm(input, sqm) {
    if (!input) return false;
    const value = Number(sqm);
    if (!Number.isFinite(value) || value <= 0) return false;
    input.value = displayedValue(value, normalizedUnit(input));
    input.dispatchEvent(new Event('input', { bubbles:true }));
    return true;
  }

  function init(doc = document) {
    const input = doc.querySelector('#rentCheckAreaSqm');
    if (!input || input.dataset.sizeReady === 'true') return null;
    const toggle = doc.querySelector('[data-size-unit-toggle]');
    const unitText = doc.querySelector('[data-size-unit-text]');
    const labelUnit = doc.querySelector('[data-rent-unit="size"]');
    const presets = [...doc.querySelectorAll('[data-rent-size-preset]')];
    input.dataset.sizeUnit = 'sqm';
    input.dataset.sizeReady = 'true';

    function renderUnit(unit, sqm) {
      input.dataset.sizeUnit = unit;
      input.value = displayedValue(sqm, unit);
      input.step = '0.1';
      if (unitText) unitText.textContent = unit === 'pyeong' ? '평' : '㎡';
      if (labelUnit) labelUnit.textContent = unit === 'pyeong' ? '(평)' : '(㎡)';
      if (toggle) {
        toggle.setAttribute('aria-pressed', unit === 'pyeong' ? 'true' : 'false');
        toggle.textContent = unit === 'pyeong' ? toggle.dataset.labelSqm : toggle.dataset.labelPyeong;
      }
    }

    function syncPresetState() {
      const sqm = readSqm(input);
      presets.forEach(button => {
        const selected = sqm != null && Math.abs(sqm - Number(button.dataset.rentSizePreset)) < 0.15;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
    }

    presets.forEach(button => button.addEventListener('click', () => {
      setSqm(input, Number(button.dataset.rentSizePreset));
      syncPresetState();
    }));
    input.addEventListener('input', syncPresetState);
    if (toggle) toggle.addEventListener('click', () => {
      const sqm = readSqm(input);
      renderUnit(normalizedUnit(input) === 'sqm' ? 'pyeong' : 'sqm', sqm);
      syncPresetState();
      input.focus();
    });
    renderUnit('sqm', readSqm(input));
    syncPresetState();
    return Object.freeze({ input, readSqm:() => readSqm(input), setSqm:value => setSqm(input, value) });
  }

  return Object.freeze({ SQM_PER_PYEONG, displayedValue, readSqm, setSqm, init });
});

if (typeof document !== 'undefined') window.KHGRentSize.init(document);
