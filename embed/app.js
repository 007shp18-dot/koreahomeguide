(function() {
  'use strict';
  const root = document.querySelector('#rentSnapshot');
  const params = new URLSearchParams(location.search);
  const lawdCd = KHGLocations.DISTRICTS[params.get('lawdCd')] ? params.get('lawdCd') : '11680';
  const allowedTypes = new Set(['apartment','officetel','villa','detached']);
  const type = allowedTypes.has(params.get('type')) ? params.get('type') : 'apartment';
  const money = value => value == null ? '—' : `₩${Math.round(Number(value)).toLocaleString('en-US')}`;
  function reportHeight() { parent.postMessage({ type:'khg:embed-height', height:Math.ceil(document.documentElement.scrollHeight) }, '*'); }
  async function load() {
    try {
      const response = await fetch(`/api/explore-area?${new URLSearchParams({ lawdCd, type })}`);
      const data = await response.json();
      if (!response.ok) throw new Error();
      const summary = data.summary || {};
      root.innerHTML = `<span class="eyebrow">RECENT SIGNED RENTS</span><h1>${KHGLocations.districtLabel(lawdCd,'en',{ includeKorean:false })}</h1><p>${KHGLocations.propertyTypeLabel(type,'en',{ includeKorean:false })}</p><dl><div><dt>Deposit-adjusted ₩/㎡</dt><dd>${summary.adjustedPerSqmWon == null ? '—' : `${money(summary.adjustedPerSqmWon)}/㎡`}</dd></div><div><dt>Monthly rent</dt><dd>${money(summary.medianMonthlyRentWon)}</dd></div><div><dt>Deposit</dt><dd>${money(summary.medianDepositWon)}</dd></div><div><dt>Contracts</dt><dd>${Number(summary.totalContracts || summary.contractCount || 0).toLocaleString('en-US')}</dd></div></dl>`;
    } catch (_) { root.innerHTML = '<p>Official rent market data is temporarily unavailable.</p>'; }
    reportHeight();
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(reportHeight).observe(document.documentElement);
  load();
})();
