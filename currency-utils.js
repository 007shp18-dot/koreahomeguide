(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGCurrency = api;
  if (root && root.document) {
    let storage = null;
    try { storage = root.localStorage; } catch (_) {}
    api.bindCurrencyPreference({ doc:root.document, storage });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const PREFERENCE_KEY = 'khg_currency_preference_v1';
  const SUPPORTED_CURRENCIES = new Set(['KRW', 'USD', 'CNY']);

  function normalizedCurrency(currency) {
    const value = String(currency || '').toUpperCase();
    return SUPPORTED_CURRENCIES.has(value) ? value : null;
  }

  function parseInputAmount(value) {
    if (value == null) return null;
    const normalized = String(value).trim().replace(/[\s,]/g, '');
    if (!normalized) return 0;
    const numeric = Number(normalized);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
  }

  function rateFor(currency, rates) {
    const rate = Number(rates && rates[currency]);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  }

  function convertFromKrw(amountWon, currency, rates) {
    const amount = Number(amountWon || 0);
    if (currency === 'KRW') return amount;
    const rate = rateFor(currency, rates);
    if (rate == null) return null;
    return amount * rate;
  }

  function convertToKrw(amount, currency, rates) {
    const numeric = parseInputAmount(amount);
    if (numeric == null) return null;
    if (currency === 'KRW') return numeric;
    const rate = rateFor(currency, rates);
    if (rate == null) return null;
    return numeric / rate;
  }

  function defaultCurrency(locale) {
    return 'KRW';
  }

  function currencySymbol(currency) {
    return ({ KRW: '₩', USD: '$', CNY: '¥' })[currency] || currency;
  }

  function formatWon(amountWon, locale) {
    return '₩' + Math.round(Number(amountWon || 0)).toLocaleString(locale || 'en-US');
  }

  function formatConverted(amount, currency, locale) {
    return currencySymbol(currency) + Math.round(Number(amount || 0)).toLocaleString(locale || 'en-US');
  }

  function formatInputAmount(amount, currency, locale) {
    const numeric = Number(amount || 0);
    if (!Number.isFinite(numeric)) return '';
    return Math.round(numeric).toLocaleString(locale || 'en-US', { maximumFractionDigits:0 });
  }

  function manwonLabel(amountWon, language) {
    if (amountWon == null || amountWon === '') return '';
    const amount = Number(amountWon);
    if (!Number.isFinite(amount) || amount < 0) return '';
    const manwon = amount / 10_000;
    const locale = String(language || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
    const formatted = manwon.toLocaleString(locale, { maximumFractionDigits:1 });
    return String(language || '').toLowerCase().startsWith('zh')
      ? `= ${formatted}万韩元（만원）`
      : `= ${formatted}만원`;
  }

  function formatMoneyHtml(amountWon, currency, rates, locale) {
    const won = formatWon(amountWon, locale);
    if (!currency || currency === 'KRW') return `<span class="money-primary">${won}</span>`;
    const converted = convertFromKrw(amountWon, currency, rates);
    if (converted == null) return `<span class="money-primary">${won}</span>`;
    return `<span class="money-primary">${won}</span><small class="fx-secondary">≈ ${formatConverted(converted, currency, locale)}</small>`;
  }

  function readCurrencyPreference(storage) {
    try {
      return normalizedCurrency(storage && storage.getItem(PREFERENCE_KEY));
    } catch (_) {
      return null;
    }
  }

  function writeCurrencyPreference(storage, currency) {
    const normalized = normalizedCurrency(currency);
    if (!normalized) return null;
    try {
      if (storage) storage.setItem(PREFERENCE_KEY, normalized);
      return normalized;
    } catch (_) {
      return null;
    }
  }

  function bindCurrencyPreference({ doc, storage } = {}) {
    const select = doc && typeof doc.querySelector === 'function' ? doc.querySelector('#currencySelect') : null;
    if (!select) return null;
    const preferred = readCurrencyPreference(storage) || 'KRW';
    const options = Array.from(select.options || []);
    select.value = options.length && !options.some(option => option.value === preferred) ? 'KRW' : preferred;
    if (typeof select.addEventListener === 'function') {
      select.addEventListener('change', () => writeCurrencyPreference(storage, select.value));
    }
    return select.value;
  }

  return {
    PREFERENCE_KEY,
    parseInputAmount,
    convertFromKrw,
    convertToKrw,
    defaultCurrency,
    currencySymbol,
    formatWon,
    formatConverted,
    formatInputAmount,
    manwonLabel,
    formatMoneyHtml,
    readCurrencyPreference,
    writeCurrencyPreference,
    bindCurrencyPreference
  };
});
