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

function selectedCurrency() {
  return currencySelect ? currencySelect.value : 'KRW';
}

function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">Not enough data</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'en-US');
}

function renderSizeBands(sizeBands) {
  sizeBandGrid.innerHTML = (sizeBands || []).map(band => `
    <div class="size-band-card">
      <span>${band.label}</span>
      <strong>${band.medianMonthlyRentWon == null ? '—' : moneyHtml(band.medianMonthlyRentWon)}</strong>
      <small>${band.count} monthly-rent contract${band.count === 1 ? '' : 's'}${band.medianDepositWon == null ? '' : ` · median deposit ${moneyHtml(band.medianDepositWon)}`}</small>
    </div>
  `).join('');
}

function renderRecentContracts(recentContracts) {
  if (!recentContracts || !recentContracts.length) {
    recentContractsBody.innerHTML = '<tr class="empty-row"><td colspan="5">No recent reported contracts were available for this page.</td></tr>';
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
  metricContracts.textContent = Number(data.totalContracts || 0).toLocaleString('en-US');
  metricRent.innerHTML = data.monthlyRentCount ? moneyHtml(data.medianMonthlyRentWon) : '<span class="money-primary">Not enough data</span>';
  metricDeposit.innerHTML = data.monthlyRentCount ? moneyHtml(data.medianDepositWon) : '<span class="money-primary">Not enough data</span>';
  metricJeonse.innerHTML = data.jeonseCount ? moneyHtml(data.medianJeonseDepositWon) : '<span class="money-primary">No jeonse median</span>';
  const q = Number(data.quarterChangePct);
  quarterChange.textContent = Number.isFinite(q) ? `${q > 0 ? '+' : ''}${q.toFixed(1)}% vs prior 3 months` : 'Not enough data for a quarterly comparison';
  dataThrough.textContent = data.dataThroughMonth ? `Data through ${data.dataThroughMonth}` : 'Latest completed months';
  renderSizeBands(data.sizeBands || []);
  renderRecentContracts(data.recentContracts || []);
  marketStatus.textContent = data.totalContracts
    ? `Based on ${Number(data.totalContracts).toLocaleString('en-US')} reported contracts from the latest ${data.monthsUsed || 6} completed months.`
    : 'Not enough reported transactions were available for a reliable market summary.';
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
  marketStatus.textContent = 'Loading official rental transactions…';
  marketStatus.className = 'market-status loading';
  try {
    const response = await fetch(`/api/rent-market?type=${encodeURIComponent(propertyType)}&lawdCd=${encodeURIComponent(lawdCd)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Market data failed');
    renderMarket(data);
  } catch (_) {
    marketStatus.textContent = 'Official rental transaction data is temporarily unavailable. Please try again later.';
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
