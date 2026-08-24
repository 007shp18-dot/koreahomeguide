(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGCurrency = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
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
    const numeric = Number(amount || 0);
    if (currency === 'KRW') return numeric;
    const rate = rateFor(currency, rates);
    if (rate == null) return null;
    return numeric / rate;
  }

  function defaultCurrency(locale) {
    return String(locale || '').toLowerCase().startsWith('zh') ? 'CNY' : 'USD';
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

  function formatInputAmount(amount, currency) {
    const numeric = Number(amount || 0);
    if (!Number.isFinite(numeric)) return '';
    return String(Math.round(numeric));
  }

  function formatMoneyHtml(amountWon, currency, rates, locale) {
    const won = formatWon(amountWon, locale);
    if (!currency || currency === 'KRW') return `<span class="money-primary">${won}</span>`;
    const converted = convertFromKrw(amountWon, currency, rates);
    if (converted == null) return `<span class="money-primary">${won}</span>`;
    return `<span class="money-primary">${formatConverted(converted, currency, locale)}</span><small class="fx-secondary">≈ ${won}</small>`;
  }

  return {
    convertFromKrw,
    convertToKrw,
    defaultCurrency,
    currencySymbol,
    formatWon,
    formatConverted,
    formatInputAmount,
    formatMoneyHtml
  };
});
