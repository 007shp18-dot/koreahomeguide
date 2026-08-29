(function(root) {
  'use strict';
  if (!root.document || !root.KHGCurrency) return;
  const select = root.document.querySelector('#currencySelect');
  if (!select) return;
  let rates = {};
  function render() {
    const code = select.value || 'KRW';
    root.document.querySelectorAll('.seo-money[data-won]').forEach(node => {
      const won = Number(node.dataset.won);
      if (!Number.isFinite(won)) return;
      node.innerHTML = root.KHGCurrency.formatMoneyHtml(won, code, rates, root.document.documentElement.lang || 'en');
    });
  }
  select.addEventListener('change', () => { root.KHGCurrency.writeCurrencyPreference(root.localStorage, select.value); render(); });
  root.fetch('/api/fx').then(response => response.ok ? response.json() : Promise.reject()).then(data => {
    rates = data.rates || {};
    const preferred = root.KHGCurrency.readCurrencyPreference(root.localStorage);
    select.value = ['KRW','USD','CNY'].includes(preferred) ? preferred : 'KRW';
    render();
  }).catch(() => { select.value = 'KRW'; render(); });
})(typeof window !== 'undefined' ? window : globalThis);
