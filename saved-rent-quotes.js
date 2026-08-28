(function(root, factory) {
  'use strict';
  const locations = typeof module === 'object' && module.exports
    ? require('./location-catalog.js')
    : root && root.KHGLocations;
  const api = factory(locations);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGSavedQuotes = api;

  if (root && root.document) {
    const start = () => api.mount({ root, doc:root.document });
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once:true });
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis, function(locations) {
  'use strict';

  const STORAGE_KEY = 'khg_saved_rent_quotes_v1';
  const RECHECK_STORAGE_KEY = 'khg_saved_rent_recheck_v1';
  const VISIT_STORAGE_KEY = 'khg_saved_homes_last_visit_v1';
  const MAX_QUOTES = 8;
  const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
  const RECHECK_TTL_MS = 10 * 60 * 1000;
  const RETURN_VISIT_MS = 6 * 60 * 60 * 1000;
  const districts = locations && locations.RENT_CHECK_DISTRICTS || {};
  const catalogReady = Object.keys(districts).length === 25;
  const DISTRICT_CODES = new Set(Object.keys(districts));
  const PROPERTY_TYPES = new Set(['apartment','officetel','villa','detached','studio']);
  const RATINGS = new Set(['above','fair','below','insufficient']);
  const CONFIDENCE = new Set(['high','medium','low']);

  const propertyTypes = {
    apartment:['Apartment','公寓'], officetel:['Officetel','办公住宅'],
    villa:['Low-rise multifamily','低层多户住宅'], detached:['Detached & multi-unit','独栋及多户住宅'],
    studio:['Studio / One-room','单间 / One-room']
  };

  function cleanLabel(value) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  function finiteNumber(value, min, max, fallback = null) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= min && numeric <= max ? numeric : fallback;
  }

  function safeIso(value, fallback) {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
  }

  function normalizeQuote(input, { now = Date.now(), idFactory } = {}) {
    input = input || {};
    const districtCode = String(input.districtCode || '');
    const propertyType = String(input.propertyType || '');
    if (!DISTRICT_CODES.has(districtCode) || !PROPERTY_TYPES.has(propertyType)) return null;
    const depositWon = finiteNumber(input.depositWon, 0, 10000000000);
    const monthlyRentWon = finiteNumber(input.monthlyRentWon, 0, 100000000);
    const areaSqm = finiteNumber(input.areaSqm, 1, 1000);
    if (depositWon == null || monthlyRentWon == null || areaSqm == null) return null;
    const created = new Date(now).toISOString();
    const makeId = typeof idFactory === 'function' ? idFactory : () => `${now}-${Math.random().toString(36).slice(2, 10)}`;
    return Object.freeze({
      id:cleanLabel(input.id) || cleanLabel(makeId()),
      label:cleanLabel(input.label),
      districtCode,
      propertyType,
      depositWon:Math.round(depositWon),
      monthlyRentWon:Math.round(monthlyRentWon),
      areaSqm:Math.round(areaSqm * 10) / 10,
      rating:RATINGS.has(input.rating) ? input.rating : 'insufficient',
      confidence:CONFIDENCE.has(input.confidence) ? input.confidence : null,
      medianValueWon:finiteNumber(input.medianValueWon, 0, 10000000000),
      differencePct:finiteNumber(input.differencePct, -10000, 10000),
      comparableCount:Math.round(finiteNumber(input.comparableCount, 0, 100000, 0)),
      dataThroughMonth:/^\d{4}-\d{2}$/.test(String(input.dataThroughMonth || '')) ? String(input.dataThroughMonth) : null,
      savedAt:safeIso(input.savedAt, created),
      expiresAt:safeIso(input.expiresAt, new Date(now + RETENTION_MS).toISOString())
    });
  }

  function quoteFingerprint(input) {
    input = input || {};
    return [
      String(input.districtCode || ''), String(input.propertyType || ''),
      Math.round(Number(input.depositWon) || 0), Math.round(Number(input.monthlyRentWon) || 0),
      Math.round((Number(input.areaSqm) || 0) * 10) / 10,
      cleanLabel(input.label).toLowerCase()
    ].join('|');
  }

  function createStore({ storage, now = () => Date.now(), idFactory } = {}) {
    function parse() {
      if (!catalogReady) return [];
      try {
        const raw = storage && storage.getItem(STORAGE_KEY);
        const values = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(values)) return [];
        const timestamp = now();
        return values
          .map(value => normalizeQuote(value, { now:timestamp, idFactory:() => value.id }))
          .filter(value => value && Date.parse(value.expiresAt) > timestamp)
          .slice(0, MAX_QUOTES);
      } catch (_) {
        return [];
      }
    }

    function write(values) {
      if (!catalogReady || !storage || typeof storage.setItem !== 'function') return false;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(values.slice(0, MAX_QUOTES)));
        return true;
      } catch (_) {
        return false;
      }
    }

    function list() {
      if (!catalogReady) return [];
      const values = parse();
      write(values);
      return values;
    }

    function save(input) {
      if (!catalogReady) return null;
      const quote = normalizeQuote(input, { now:now(), idFactory });
      if (!quote) return null;
      const existing = parse();
      const duplicate = existing.find(value => quoteFingerprint(value) === quoteFingerprint(quote));
      const stored = duplicate
        ? normalizeQuote({ ...quote, id:duplicate.id }, { now:Date.parse(quote.savedAt), idFactory:() => duplicate.id })
        : quote;
      const values = [stored, ...existing.filter(value => value.id !== stored.id)].slice(0, MAX_QUOTES);
      return write(values) ? stored : null;
    }

    function updateLabel(id, label) {
      if (!catalogReady) return null;
      const values = parse();
      const index = values.findIndex(value => value.id === String(id || ''));
      if (index < 0) return null;
      const current = values[index];
      const updated = normalizeQuote({ ...current, label:cleanLabel(label) }, {
        now:Date.parse(current.savedAt), idFactory:() => current.id
      });
      if (!updated) return null;
      values[index] = updated;
      return write(values) ? updated : null;
    }

    function remove(id) {
      if (!catalogReady) return false;
      const values = parse().filter(value => value.id !== String(id || ''));
      return write(values);
    }

    function clear() {
      if (!catalogReady) return false;
      try {
        if (storage && typeof storage.removeItem === 'function') storage.removeItem(STORAGE_KEY);
        return true;
      } catch (_) {
        return false;
      }
    }

    return Object.freeze({ list, save, updateLabel, remove, clear });
  }

  function writeRecheckPrefill(storage, input, { now = Date.now(), from = '/saved-homes/' } = {}) {
    const quote = normalizeQuote(input, { now, idFactory:() => 'recheck' });
    if (!quote || !storage || typeof storage.setItem !== 'function') return false;
    const sourcePage = from === '/zh/saved-homes/' ? from : '/saved-homes/';
    const payload = {
      lawdCd:quote.districtCode,
      type:quote.propertyType,
      depositWon:quote.depositWon,
      rentWon:quote.monthlyRentWon,
      areaSqm:quote.areaSqm,
      from:sourcePage,
      expiresAt:now + RECHECK_TTL_MS
    };
    try {
      storage.setItem(RECHECK_STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (_) {
      return false;
    }
  }

  function takeRecheckPrefill(storage, { now = Date.now() } = {}) {
    if (!storage || typeof storage.getItem !== 'function') return null;
    try {
      const raw = storage.getItem(RECHECK_STORAGE_KEY);
      if (typeof storage.removeItem === 'function') storage.removeItem(RECHECK_STORAGE_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (!value || !Number.isFinite(Number(value.expiresAt)) || Number(value.expiresAt) < now) return null;
      const quote = normalizeQuote({
        districtCode:value.lawdCd,
        propertyType:value.type,
        depositWon:value.depositWon,
        monthlyRentWon:value.rentWon,
        areaSqm:value.areaSqm
      }, { now, idFactory:() => 'recheck' });
      if (!quote) return null;
      return {
        lawdCd:quote.districtCode,
        type:quote.propertyType,
        depositWon:quote.depositWon,
        rentWon:quote.monthlyRentWon,
        areaSqm:quote.areaSqm,
        from:value.from === '/zh/saved-homes/' ? value.from : '/saved-homes/'
      };
    } catch (_) {
      return null;
    }
  }

  function markComparisonVisit(storage, { now = Date.now(), cooldown = RETURN_VISIT_MS } = {}) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') return false;
    try {
      const previous = Number(storage.getItem(VISIT_STORAGE_KEY));
      const isReturn = Number.isFinite(previous) && previous > 0 && now - previous >= cooldown;
      if (!Number.isFinite(previous) || previous <= 0 || isReturn) storage.setItem(VISIT_STORAGE_KEY, String(now));
      return isReturn;
    } catch (_) {
      return false;
    }
  }

  function localeIndex(language) { return language === 'zh-CN' ? 1 : 0; }
  function districtLabel(code, language) {
    const record = districts[String(code || '')];
    if (!record) return String(code || '');
    return language === 'zh-CN' ? (record['zh-CN'] || record.en || record.ko) : (record.en || record.ko);
  }
  function propertyLabel(type, language) { return (propertyTypes[type] || [type, type])[localeIndex(language)]; }
  function defaultLabel(quote, language) { return `${districtLabel(quote.districtCode, language)} · ${propertyLabel(quote.propertyType, language)}`; }
  function countBucket(count) { return count >= 3 ? '3+' : String(Math.max(0, count)); }

  function safeTrack(root, eventName, count, language) {
    try {
      if (typeof root.gtag !== 'function') return false;
      root.gtag('event', eventName, { language, saved_count_bucket:countBucket(count) });
      return true;
    } catch (_) { return false; }
  }

  function mount({ root = globalThis, doc = root && root.document } = {}) {
    if (!catalogReady || !root || !doc || doc.documentElement.dataset.savedQuotesMounted === 'true') return null;
    doc.documentElement.dataset.savedQuotesMounted = 'true';
    const language = doc.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
    let storage = null;
    try { storage = root.localStorage; } catch (_) {}
    const store = createStore({ storage, idFactory:() => root.crypto && typeof root.crypto.randomUUID === 'function' ? root.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,10)}` });
    const result = doc.querySelector('#rentCheckResult');
    let latest = null;
    let panel = null;
    let dock = null;
    let savedCurrentResult = false;

    function compareHref() { return language === 'zh-CN' ? '/zh/saved-homes/' : '/saved-homes/'; }

    function updateDock() {
      const count = store.list().length;
      if (!count) {
        if (dock) dock.remove();
        dock = null;
        return;
      }
      if (!dock && !/^\/((zh\/)?saved-homes)\/?$/.test(root.location && root.location.pathname || '')) {
        dock = doc.createElement('a');
        dock.className = 'saved-homes-dock';
        dock.href = compareHref();
        doc.body.appendChild(dock);
      }
      if (dock) dock.textContent = language === 'zh-CN' ? `已保存房源 · ${count}` : `Saved homes · ${count}`;
    }

    function ensurePanel() {
      if (panel || !result) return panel;
      panel = doc.createElement('section');
      panel.className = 'saved-quote-module';
      panel.hidden = true;
      panel.innerHTML = language === 'zh-CN'
        ? '<div><span class="eyebrow">保存到本机</span><h3>之后和其他房源一起比较</h3><p>只保存在当前浏览器90天。不要填写房东、中介或准确房号。</p></div><div class="saved-quote-form"><label><span>房源备注（可选）</span><input type="text" maxlength="60" autocomplete="off" placeholder="例如：麻浦办公住宅 A"></label><button type="button" class="saved-quote-save">保存这个报价</button></div><p class="saved-quote-status" aria-live="polite"></p><a class="saved-quote-compare" href="/zh/saved-homes/" hidden>查看已保存房源 →</a>'
        : '<div><span class="eyebrow">SAVE ON THIS DEVICE</span><h3>Compare this home later</h3><p>Saved in this browser for 90 days. Do not enter a landlord, broker, or exact unit number.</p></div><div class="saved-quote-form"><label><span>Home label (optional)</span><input type="text" maxlength="60" autocomplete="off" placeholder="For example: Mapo officetel A"></label><button type="button" class="saved-quote-save">Save this quote</button></div><p class="saved-quote-status" aria-live="polite"></p><a class="saved-quote-compare" href="/saved-homes/" hidden>View saved homes →</a>';
      const mount = result.querySelector('[data-saved-quote-mount]');
      if (mount) mount.appendChild(panel);
      else result.appendChild(panel);
      const input = panel.querySelector('input');
      const button = panel.querySelector('button');
      const status = panel.querySelector('.saved-quote-status');
      const compare = panel.querySelector('.saved-quote-compare');
      button.addEventListener('click', () => {
        if (!latest || savedCurrentResult) return;
        const quote = store.save({ ...latest, label:input.value });
        if (!quote) {
          status.textContent = language === 'zh-CN' ? '当前浏览器无法保存。请检查隐私或存储设置。' : 'This browser could not save the quote. Check its privacy or storage settings.';
          status.className = 'saved-quote-status error';
          return;
        }
        const count = store.list().length;
        status.textContent = language === 'zh-CN' ? `已保存。现在共有 ${count} 个房源可比较。` : `Saved. You now have ${count} home${count === 1 ? '' : 's'} to compare.`;
        status.className = 'saved-quote-status success';
        savedCurrentResult = true;
        button.disabled = true;
        button.textContent = language === 'zh-CN' ? '已保存' : 'Saved';
        compare.hidden = false;
        updateDock();
        safeTrack(root, 'quote_saved', count, language);
        root.dispatchEvent(new root.CustomEvent('khg:saved-quotes-changed', { detail:{ count } }));
      });
      return panel;
    }

    root.addEventListener('khg:rent-check-result', event => {
      const detail = event && event.detail || {};
      latest = normalizeQuote({
        ...detail,
        propertyType:detail.savedPropertyType || detail.propertyType
      }, { idFactory:() => '' });
      if (!latest) return;
      const currentPanel = ensurePanel();
      if (!currentPanel) return;
      savedCurrentResult = false;
      currentPanel.hidden = false;
      const input = currentPanel.querySelector('input');
      input.value = defaultLabel(latest, language);
      const button = currentPanel.querySelector('.saved-quote-save');
      button.disabled = false;
      button.textContent = language === 'zh-CN' ? '保存这个报价' : 'Save this quote';
      currentPanel.querySelector('.saved-quote-compare').hidden = true;
      const status = currentPanel.querySelector('.saved-quote-status');
      status.textContent = '';
      status.className = 'saved-quote-status';
    });

    updateDock();
    return Object.freeze({ store, updateDock });
  }

  return {
    STORAGE_KEY, RECHECK_STORAGE_KEY, VISIT_STORAGE_KEY,
    MAX_QUOTES, RETENTION_MS, RECHECK_TTL_MS, RETURN_VISIT_MS,
    normalizeQuote, quoteFingerprint, createStore, cleanLabel,
    writeRecheckPrefill, takeRecheckPrefill, markComparisonVisit,
    districtLabel, propertyLabel, defaultLabel, countBucket, mount
  };
});
