const root = document.querySelector('#rentMarketPage');
const currencySelect = document.querySelector('#currencySelect');
const marketStatus = document.querySelector('#marketStatus');
const metricContracts = document.querySelector('#metricContracts');
const metricRent = document.querySelector('#metricRent');
const metricDeposit = document.querySelector('#metricDeposit');
const metricJeonse = document.querySelector('#metricJeonse');
const quarterChange = document.querySelector('#quarterChange');
const sizeBandGrid = document.querySelector('#sizeBandGrid');
const recentContractsBody = document.querySelector('#recentContractsBody');
const dataThrough = document.querySelector('#dataThrough');
let fxRates = {};
let marketData = null;

const SIZE_LABELS = {
  under20: '20㎡以下',
  '20to30': '20–30㎡',
  '30to40': '30–40㎡',
  '40to60': '40–60㎡',
  over60: '60㎡以上'
};

function selectedCurrency() {
  return currencySelect ? currencySelect.value : 'CNY';
}

function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">数据不足</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'zh-CN');
}

function sizeLabel(band) {
  return SIZE_LABELS[band.key] || band.label || '面积区间';
}

function renderSizeBands(sizeBands) {
  sizeBandGrid.innerHTML = (sizeBands || []).map(band => `
    <div class="size-band-card">
      <span>${sizeLabel(band)}</span>
      <strong>${band.medianMonthlyRentWon == null ? '—' : moneyHtml(band.medianMonthlyRentWon)}</strong>
      <small>${band.count} 份月租合同${band.medianDepositWon == null ? '' : ` · 押金中位数 ${moneyHtml(band.medianDepositWon)}`}</small>
    </div>
  `).join('');
}

function renderRecentContracts(recentContracts) {
  if (!recentContracts || !recentContracts.length) {
    recentContractsBody.innerHTML = '<tr class="empty-row"><td colspan="5">目前没有可显示的近期申报合同。</td></tr>';
    return;
  }
  recentContractsBody.innerHTML = recentContracts.map(item => `
    <tr>
      <td>${item.building || '-'}</td>
      <td>${Number(item.areaSqm).toFixed(1)}㎡</td>
      <td>${moneyHtml(item.depositWon)}</td>
      <td>${moneyHtml(item.monthlyRentWon)}</td>
      <td>${item.contractDate || '-'}</td>
    </tr>
  `).join('');
}

function renderMarket(data) {
  marketData = data;
  metricContracts.textContent = Number(data.totalContracts || 0).toLocaleString('zh-CN');
  metricRent.innerHTML = data.monthlyRentCount ? moneyHtml(data.medianMonthlyRentWon) : '<span class="money-primary">数据不足</span>';
  metricDeposit.innerHTML = data.monthlyRentCount ? moneyHtml(data.medianDepositWon) : '<span class="money-primary">数据不足</span>';
  metricJeonse.innerHTML = data.jeonseCount ? moneyHtml(data.medianJeonseDepositWon) : '<span class="money-primary">暂无全租中位数</span>';
  const q = Number(data.quarterChangePct);
  quarterChange.textContent = Number.isFinite(q) ? `${q > 0 ? '+' : ''}${q.toFixed(1)}% · 近 3 个月 vs 前 3 个月` : '数据不足，暂无法比较近 3 个月走势';
  dataThrough.textContent = data.dataThroughMonth ? `数据截至 ${data.dataThroughMonth}` : '最近已完成月份';
  renderSizeBands(data.sizeBands || []);
  renderRecentContracts(data.recentContracts || []);
  marketStatus.textContent = data.totalContracts
    ? `基于最近 ${data.monthsUsed || 6} 个完整月份的 ${Number(data.totalContracts).toLocaleString('zh-CN')} 份已申报租赁合同。`
    : '可用的申报租赁成交不足，暂时无法生成可靠的市场摘要。';
  marketStatus.className = `market-status ${data.totalContracts ? 'success' : ''}`;
}

async function loadFx() {
  if (!currencySelect) return;
  currencySelect.disabled = true;
  try {
    const response = await fetch('/api/fx');
    const data = await response.json();
    if (!response.ok) throw new Error('FX unavailable');
    fxRates = data.rates || {};
    if (!fxRates[currencySelect.value] && currencySelect.value !== 'KRW') currencySelect.value = 'KRW';
  } catch (_) {
    fxRates = {};
    currencySelect.value = 'KRW';
  } finally {
    currencySelect.disabled = false;
  }
}

async function loadMarket() {
  const lawdCd = root.dataset.lawdCd;
  const propertyType = root.dataset.propertyType;
  marketStatus.textContent = '正在加载官方租赁成交数据…';
  marketStatus.className = 'market-status loading';
  try {
    const response = await fetch(`/api/rent-market?type=${encodeURIComponent(propertyType)}&lawdCd=${encodeURIComponent(lawdCd)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Market data failed');
    renderMarket(data);
  } catch (_) {
    marketStatus.textContent = '官方租赁成交数据暂时无法加载，请稍后再试。';
    marketStatus.className = 'market-status error';
  }
}

if (currencySelect) {
  currencySelect.addEventListener('change', () => {
    if (marketData) renderMarket(marketData);
  });
}

(async () => {
  await loadFx();
  await loadMarket();
})();
