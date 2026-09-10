(function() {
  'use strict';
  const zh = String(document.documentElement.lang || '').toLowerCase().startsWith('zh');
  const locale = zh ? 'zh-CN' : 'en-US';
  const copy = zh ? {
    different:'请选择两个不同的行政区。', loading:'正在读取官方真实签约数据…', unavailable:'市场数据暂时无法读取。', ready:'对比已完成。',
    adjusted:'押金校正 ₩/㎡', rent:'月租中位数', deposit:'押金中位数', contracts:'签约数量', explore:'探索这个市场 →'
  } : {
    different:'Choose two different districts.', loading:'Loading official signed contracts…', unavailable:'Market data is unavailable.', ready:'Comparison ready.',
    adjusted:'Deposit-adjusted ₩/㎡', rent:'Median monthly rent', deposit:'Median deposit', contracts:'Signed contracts', explore:'Explore this market →'
  };
  const form = document.querySelector('#compareForm');
  const areaA = document.querySelector('#compareAreaA');
  const areaB = document.querySelector('#compareAreaB');
  const type = document.querySelector('#compareType');
  const status = document.querySelector('#compareStatus');
  const results = document.querySelector('#compareResults');
  const cards = [...document.querySelectorAll('[data-compare-market]')];

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]); }
  function money(value) { return value == null ? '—' : `₩${Math.round(Number(value)).toLocaleString(locale)}`; }
  function perSqm(value) { return value == null ? '—' : `${money(value)}/㎡`; }
  function populate() {
    const options = Object.entries(KHGLocations.DISTRICTS).map(([code, record]) => `<option value="${code}">${escapeHtml(zh ? record['zh-CN'] : record.en)} (${escapeHtml(record.ko)})</option>`).join('');
    areaA.innerHTML = options; areaB.innerHTML = options;
    areaA.value = '11680'; areaB.value = '11440';
  }
  async function load(areaCode) {
    const query = new URLSearchParams({ lawdCd:areaCode, type:type.value });
    const response = await fetch(`/api/explore-area?${query}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || copy.unavailable);
    return data;
  }
  function render(card, data) {
    const summary = data.summary || {};
    const contracts = Number(summary.totalContracts || summary.contractCount || 0);
    const language = zh ? 'zh-CN' : 'en';
    const prefix = zh ? '/zh' : '';
    card.innerHTML = `<span class="eyebrow">${escapeHtml(KHGLocations.propertyTypeLabel(data.propertyType,language,{ includeKorean:false }))}</span><h2>${escapeHtml(KHGLocations.districtLabel(data.districtCode,language,{ includeKorean:false }))}</h2><dl class="compare-metrics"><div class="is-key"><dt>${copy.adjusted}</dt><dd>${perSqm(summary.adjustedPerSqmWon)}</dd></div><div><dt>${copy.rent}</dt><dd>${money(summary.medianMonthlyRentWon)}</dd></div><div><dt>${copy.deposit}</dt><dd>${money(summary.medianDepositWon)}</dd></div><div><dt>${copy.contracts}</dt><dd>${contracts.toLocaleString(locale)}</dd></div></dl><a href="${prefix}/explore/?lawdCd=${encodeURIComponent(data.districtCode)}&type=${encodeURIComponent(data.propertyType)}">${copy.explore}</a>`;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (areaA.value === areaB.value) { status.textContent = copy.different; status.className = 'market-status error'; return; }
    status.textContent = copy.loading; status.className = 'market-status loading'; results.hidden = true;
    form.querySelector('button').disabled = true;
    try {
      const [first, second] = await Promise.all([load(areaA.value), load(areaB.value)]);
      render(cards[0], first); render(cards[1], second); results.hidden = false;
      status.textContent = copy.ready; status.className = 'market-status success';
    } catch (error) { status.textContent = error.message; status.className = 'market-status error'; }
    finally { form.querySelector('button').disabled = false; }
  });
  populate(); form.requestSubmit();
})();
