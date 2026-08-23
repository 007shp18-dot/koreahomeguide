(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGCurrency = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function convertFromKrw(amountWon, currency, rates) {
    const amount = Number(amountWon || 0);
    if (currency === 'KRW') return amount;
    const rate = Number(rates && rates[currency]);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return amount * rate;
  }

  function defaultCurrency(locale) {
    return String(locale || '').toLowerCase().startsWith('zh') ? 'CNY' : 'USD';
  }

  function formatWon(amountWon, locale) {
    return '₩' + Math.round(Number(amountWon || 0)).toLocaleString(locale || 'en-US');
  }

  function formatConverted(amount, currency, locale) {
    const symbols = { USD: '$', CNY: '¥' };
    const symbol = symbols[currency] || currency + ' ';
    return symbol + Math.round(Number(amount || 0)).toLocaleString(locale || 'en-US');
  }

  function formatMoneyHtml(amountWon, currency, rates, locale) {
    const primary = `<span class="money-primary">${formatWon(amountWon, locale)}</span>`;
    if (!currency || currency === 'KRW') return primary;
    const converted = convertFromKrw(amountWon, currency, rates);
    if (converted == null) return primary;
    return `${primary}<small class="fx-secondary">≈ ${formatConverted(converted, currency, locale)}</small>`;
  }

  return { convertFromKrw, defaultCurrency, formatWon, formatConverted, formatMoneyHtml };
});
