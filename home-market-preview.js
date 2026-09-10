(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.KHGHomeMarketPreview = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const districts = [
    { code:'11440', en:'Mapo-gu', zh:'麻浦区' },
    { code:'11680', en:'Gangnam-gu', zh:'江南区' },
    { code:'11620', en:'Gwanak-gu', zh:'冠岳区' }
  ];

  async function loadDistrictPreview(fetcher) {
    const request = fetcher || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    if (!request) throw new Error('Market preview unavailable');

    try {
      const responses = await Promise.all(districts.map(district =>
        request(`/api/explore-area?lawdCd=${district.code}&type=officetel`)
      ));
      if (responses.some(response => !response || !response.ok)) {
        throw new Error('Market preview unavailable');
      }
      const payloads = await Promise.all(responses.map(response => response.json()));
      return payloads.map((payload, index) => {
        const district = districts[index];
        const median = Number(payload && payload.summary && payload.summary.medianMonthlyRentWon);
        if (!payload || payload.districtCode !== district.code || !Number.isFinite(median) || median <= 0) {
          throw new Error('Market preview unavailable');
        }
        return {
          ...district,
          medianMonthlyRentWon:median,
          dataThroughMonth:payload.summary.dataThroughMonth || ''
        };
      });
    } catch (error) {
      throw new Error('Market preview unavailable');
    }
  }

  function formatWon(value) {
    return `₩${new Intl.NumberFormat('en-US', { maximumFractionDigits:0 }).format(value)}`;
  }

  function render(container, items) {
    const isZh = document.documentElement.lang === 'zh-CN';
    const list = container.querySelector('[data-home-market-list]');
    if (!list) return;
    list.replaceChildren();
    for (const item of items) {
      const link = document.createElement('a');
      link.href = `${isZh ? '/zh' : ''}/explore/?lawdCd=${item.code}&type=officetel`;
      const name = document.createElement('span');
      name.textContent = isZh ? item.zh : item.en;
      const value = document.createElement('strong');
      value.textContent = formatWon(item.medianMonthlyRentWon);
      const label = document.createElement('small');
      label.textContent = isZh ? '月租中位数 · Officetel' : 'median monthly · Officetel';
      link.append(name, value, label);
      list.append(link);
    }
    container.dataset.state = 'ready';
  }

  function renderError(container) {
    const isZh = document.documentElement.lang === 'zh-CN';
    const status = container.querySelector('[data-home-market-status]');
    if (status) status.textContent = isZh
      ? '打开租金探索，查看最新已申报成交。'
      : 'Open Rent Explorer for the latest reported contracts.';
    container.dataset.state = 'error';
  }

  function install() {
    const container = document.querySelector('[data-home-market-preview]');
    if (!container) return;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      loadDistrictPreview().then(items => render(container, items)).catch(() => renderError(container));
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        start();
      }, { rootMargin:'240px' });
      observer.observe(container);
    } else start();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
    else install();
  }

  return { districts, loadDistrictPreview, formatWon, install };
});
