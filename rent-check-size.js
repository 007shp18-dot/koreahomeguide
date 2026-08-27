(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGRentSize = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const SQM_PER_PYEONG = 3.3058;
  const controllers = typeof WeakMap === 'function' ? new WeakMap() : new Map();
  const PRESET_CONFIG = Object.freeze({
    apartment:Object.freeze({ sqm:Object.freeze([35, 60, 85]), en:Object.freeze(['Compact', 'Standard', 'Family']), zh:Object.freeze(['紧凑', '标准', '家庭型']) }),
    officetel:Object.freeze({ sqm:Object.freeze([15, 20, 30]), en:Object.freeze(['Compact', 'Standard', 'Spacious']), zh:Object.freeze(['紧凑', '标准', '宽敞']) }),
    villa:Object.freeze({ sqm:Object.freeze([20, 35, 60]), en:Object.freeze(['Small', 'Medium', 'Large']), zh:Object.freeze(['小型', '中型', '大型']) }),
    detached:Object.freeze({ sqm:Object.freeze([20, 35, 50]), en:Object.freeze(['Small', 'Medium', 'Large']), zh:Object.freeze(['小型', '中型', '大型']) }),
    studio:Object.freeze({ sqm:Object.freeze([15, 20, 25]), en:Object.freeze(['Compact', 'Standard', 'Large']), zh:Object.freeze(['紧凑', '标准', '大型']) })
  });

  function presetConfig(propertyType, language) {
    const config = PRESET_CONFIG[propertyType] || PRESET_CONFIG.apartment;
    const labels = String(language || '').toLowerCase().startsWith('zh') ? config.zh : config.en;
    return config.sqm.map((sqm, index) => ({ label:labels[index], sqm }));
  }

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
    if (!input) return null;
    if (input.dataset.sizeReady === 'true') return controllers.get(input) || null;
    const propertyType = doc.querySelector('#rentCheckType');
    const toggle = doc.querySelector('[data-size-unit-toggle]');
    const unitText = doc.querySelector('[data-size-unit-text]');
    const labelUnit = doc.querySelector('[data-rent-unit="size"]');
    const presets = [...doc.querySelectorAll('[data-rent-size-preset]')];
    const language = doc.documentElement && doc.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
    let areaSource = 'default';
    let internalInput = false;
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

    function setControllerSqm(sqm, source) {
      internalInput = true;
      const changed = setSqm(input, sqm);
      internalInput = false;
      if (changed) areaSource = source;
      syncPresetState();
      return changed;
    }

    function renderPresets(type) {
      const config = presetConfig(type, language);
      presets.forEach((button, index) => {
        const item = config[index];
        if (!item) return;
        button.dataset.rentSizePreset = String(item.sqm);
        button.innerHTML = `${item.label} <small>~${item.sqm}㎡</small>`;
      });
      return config;
    }

    function setPropertyType(type, options = {}) {
      const config = renderPresets(type);
      const preserveValue = options.preserveValue === true || areaSource === 'manual' || areaSource === 'prefill';
      if (!preserveValue && config[1]) {
        setControllerSqm(config[1].sqm, areaSource === 'preset' ? 'preset' : 'default');
      } else {
        syncPresetState();
      }
      return config;
    }

    presets.forEach(button => button.addEventListener('click', () => {
      setControllerSqm(Number(button.dataset.rentSizePreset), 'preset');
    }));
    input.addEventListener('input', () => {
      if (!internalInput) areaSource = 'manual';
      syncPresetState();
    });
    if (propertyType) propertyType.addEventListener('change', () => setPropertyType(propertyType.value));
    if (toggle) toggle.addEventListener('click', () => {
      const sqm = readSqm(input);
      renderUnit(normalizedUnit(input) === 'sqm' ? 'pyeong' : 'sqm', sqm);
      syncPresetState();
      input.focus();
    });
    renderUnit('sqm', readSqm(input));
    const controller = Object.freeze({
      input,
      readSqm:() => readSqm(input),
      setSqm:value => setControllerSqm(value, 'manual'),
      setPrefilledSqm:value => setControllerSqm(value, 'prefill'),
      setPropertyType,
      source:() => areaSource
    });
    controllers.set(input, controller);
    setPropertyType(propertyType && propertyType.value || 'apartment');
    return controller;
  }

  return Object.freeze({ SQM_PER_PYEONG, presetConfig, displayedValue, readSqm, setSqm, init });
});

if (typeof document !== 'undefined') window.KHGRentSize.init(document);
