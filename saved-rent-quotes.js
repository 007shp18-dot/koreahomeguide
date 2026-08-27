(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGSavedQuotes = api;

  if (root && root.document) {
    const start = () => api.mount({ root, doc:root.document });
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once:true });
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const STORAGE_KEY = 'khg_saved_rent_quotes_v1';
  const MAX_QUOTES = 8;
  const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
  const DISTRICT_CODES = new Set(['11680','11200','11440','11170','11560','11620','11230','11410','11290','11215']);
  const PROPERTY_TYPES = new Set(['apartment','officetel','villa','detached']);
  const RATINGS = new Set(['above','fair','below','insufficient']);
  const CONFIDENCE = new Set(['high','medium','low']);

  const districts = {
    '11680':['Gangnam-gu','江南区'], '11200':['Seongdong-gu','城东区'],
    '11440':['Mapo-gu','麻浦区'], '11170':['Yongsan-gu','龙山区'],
    '11560':['Yeongdeungpo-gu','永登浦区'], '11620':['Gwanak-gu','冠岳区'],
    '11230':['Dongdaemun-gu','东大门区'], '11410':['Seodaemun-gu','西大门区'],
    '11290':['Seongbuk-gu','城北区'], '11215':['Gwangjin-gu','广津区']
  };
  const propertyTypes = {
    apartment:['Apartment','公寓'], officetel:['Officetel','办公住宅'],
    villa:['Low-rise multifamily','低层多户住宅'], detached:['Detached & multi-unit','独栋及多户住宅']
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

  function createStore({ storage, now = () => Date.now(), idFactory } = {}) {
    function parse() {
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
      if (!storage || typeof storage.setItem !== 'function') return false;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(values.slice(0, MAX_QUOTES)));
        return true;
      } catch (_) {
        return false;
      }
    }

    function list() {
      const values = parse();
      write(values);
      return values;
    }

    function save(input) {
      const quote = normalizeQuote(input, { now:now(), idFactory });
      if (!quote) return null;
      const values = [quote, ...parse().filter(value => value.id !== quote.id)].slice(0, MAX_QUOTES);
      return write(values) ? quote : null;
    }

    function remove(id) {
      const values = parse().filter(value => value.id !== String(id || ''));
      return write(values);
    }

    function clear() {
      try {
        if (storage && typeof storage.removeItem === 'function') storage.removeItem(STORAGE_KEY);
        return true;
      } catch (_) {
        return false;
      }
    }

    return Object.freeze({ list, save, remove, clear });
  }

  function localeIndex(language) { return language === 'zh-CN' ? 1 : 0; }
  function districtLabel(code, language) { return (districts[code] || [code, code])[localeIndex(language)]; }
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
    if (!root || !doc || doc.documentElement.dataset.savedQuotesMounted === 'true') return null;
    doc.documentElement.dataset.savedQuotesMounted = 'true';
    const language = doc.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
    let storage = null;
    try { storage = root.localStorage; } catch (_) {}
    const store = createStore({ storage, idFactory:() => root.crypto && typeof root.crypto.randomUUID === 'function' ? root.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,10)}` });
    const result = doc.querySelector('#rentCheckResult');
    let latest = null;
    let panel = null;
    let dock = null;

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
        ? '<div><span class="eyebrow">保存到本机</span><h3>之后和其他房源一起比较</h3><p>只保存在当前浏览器90天。不要填写房东、中介或准确房号。</p></div><div class="saved-quote-form"><label><span>房源备注（可选）</span><input type="text" maxlength="60" autocomplete="off" placeholder="例如：麻浦办公住宅 A"></label><button type="button" class="saved-quote-save">保存这个报价</button></div><p class="saved-quote-status" aria-live="polite"></p>'
        : '<div><span class="eyebrow">SAVE ON THIS DEVICE</span><h3>Compare this home later</h3><p>Saved in this browser for 90 days. Do not enter a landlord, broker, or exact unit number.</p></div><div class="saved-quote-form"><label><span>Home label (optional)</span><input type="text" maxlength="60" autocomplete="off" placeholder="For example: Mapo officetel A"></label><button type="button" class="saved-quote-save">Save this quote</button></div><p class="saved-quote-status" aria-live="polite"></p>';
      result.appendChild(panel);
      const input = panel.querySelector('input');
      const button = panel.querySelector('button');
      const status = panel.querySelector('.saved-quote-status');
      button.addEventListener('click', () => {
        if (!latest) return;
        const quote = store.save({ ...latest, label:input.value });
        if (!quote) {
          status.textContent = language === 'zh-CN' ? '当前浏览器无法保存。请检查隐私或存储设置。' : 'This browser could not save the quote. Check its privacy or storage settings.';
          status.className = 'saved-quote-status error';
          return;
        }
        const count = store.list().length;
        status.textContent = language === 'zh-CN' ? `已保存。现在共有 ${count} 个房源可比较。` : `Saved. You now have ${count} home${count === 1 ? '' : 's'} to compare.`;
        status.className = 'saved-quote-status success';
        button.textContent = language === 'zh-CN' ? '再次保存' : 'Save another copy';
        updateDock();
        safeTrack(root, 'quote_saved', count, language);
        root.dispatchEvent(new root.CustomEvent('khg:saved-quotes-changed', { detail:{ count } }));
      });
      return panel;
    }

    root.addEventListener('khg:rent-check-result', event => {
      latest = normalizeQuote(event && event.detail, { idFactory:() => '' });
      if (!latest) return;
      const currentPanel = ensurePanel();
      if (!currentPanel) return;
      currentPanel.hidden = false;
      const input = currentPanel.querySelector('input');
      input.value = defaultLabel(latest, language);
      const status = currentPanel.querySelector('.saved-quote-status');
      status.textContent = '';
      status.className = 'saved-quote-status';
    });

    updateDock();
    return Object.freeze({ store, updateDock });
  }

  return {
    STORAGE_KEY, MAX_QUOTES, RETENTION_MS,
    normalizeQuote, createStore, cleanLabel,
    districtLabel, propertyLabel, defaultLabel, countBucket, mount
  };
});
