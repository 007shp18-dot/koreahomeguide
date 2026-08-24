const root = document.querySelector('#rentMarketPage');
const currencySelect = document.querySelector('#currencySelect');
const marketStatus = document.querySelector('#marketStatus');
const metricContracts = document.querySelector('#metricContracts');
const metricRent = document.querySelector('#metricRent');
const metricDeposit = document.querySelector('#metricDeposit');
const metricJeonse = document.querySelector('#metricJeonse');
const quarterChange = document.querySelector('#quarterChange');
const sizeBandGrid = document.querySelector('#sizeBandGrid');
const depositBandGrid = document.querySelector('#depositBandGrid');
const recentContractsBody = document.querySelector('#recentContractsBody');
const dataThrough = document.querySelector('#dataThrough');
const neighborhoodLinks = document.querySelector('#neighborhoodLinks');
let fxRates = {};
let marketData = null;

function selectedCurrency() {
  return currencySelect ? currencySelect.value : 'KRW';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">Not enough data</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'en-US');
}


function depositRangeLabel(band) {
  const min = Number(band.minDepositWon || 0);
  const max = Number(band.maxDepositWon);
  if (!Number.isFinite(max)) return `${moneyHtml(min)}+ deposit`;
  if (min === 0) return `Under ${moneyHtml(max)} deposit`;
  return `${moneyHtml(min)}–${moneyHtml(max)} deposit`;
}

function renderDepositBands(bands) {
  if (!depositBandGrid) return;
  if (!bands || !bands.length) { depositBandGrid.innerHTML = '<div class="explorer-empty">Not enough monthly-rent contracts to show deposit bands.</div>'; return; }
  depositBandGrid.innerHTML = bands.map(band => `<div class="size-band-card"><span>${depositRangeLabel(band)}</span><strong>${moneyHtml(band.medianMonthlyRentWon)} / month</strong><small>${band.count} contract${band.count === 1 ? '' : 's'} · median deposit ${moneyHtml(band.medianDepositWon)}</small></div>`).join('');
}

function renderAreaGroups(areaGroups) {
  if (!sizeBandGrid) return;
  if (!areaGroups || !areaGroups.length) { sizeBandGrid.innerHTML = '<div class="explorer-empty">Not enough monthly-rent contracts to show area groups.</div>'; return; }
  sizeBandGrid.innerHTML = areaGroups.map(group => {
    const bands = Array.isArray(group.depositBands) ? [...group.depositBands].sort((a,b) => Number(b.count || 0) - Number(a.count || 0)) : [];
    const band = bands[0];
    return `<div class="size-band-card"><span>Around ${Number(group.approxAreaSqm).toFixed(0)}㎡</span><strong>${group.count} contract${group.count === 1 ? '' : 's'}</strong>${band ? `<small>${depositRangeLabel(band)} → ${moneyHtml(band.medianMonthlyRentWon)} / month</small>` : ''}<small>Median observed size ${Number(group.medianAreaSqm).toFixed(1)}㎡</small></div>`;
  }).join('');
}

function renderRecentContracts(recentContracts) {
  if (!recentContracts || !recentContracts.length) {
    recentContractsBody.innerHTML = '<tr class="empty-row"><td colspan="6">No recent reported contracts were available for this page.</td></tr>';
    return;
  }
  recentContractsBody.innerHTML = recentContracts.map(item => `
    <tr>
      <td>${(() => { const name = KHGBuildingNames.getBuildingNameDisplay(item.building || '-', 'en'); return `<strong>${escapeHtml(name.primary)}</strong>${name.secondary ? `<small class="building-official-name">${escapeHtml(name.secondary)}</small>` : ''}`; })()}</td>
      <td>${item.contractType === 'new' ? 'New' : item.contractType === 'renewal' ? 'Renewal' : 'Not identified'}</td>
      <td>${Number(item.areaSqm).toFixed(1)}㎡</td>
      <td>${moneyHtml(item.depositWon)}</td>
      <td>${moneyHtml(item.monthlyRentWon)}</td>
      <td>${KHGDate.formatDate(item.contractDate, 'en-US')}</td>
    </tr>
  `).join('');
}


function renderNeighborhoodLinks(dongs) {
  if (!neighborhoodLinks || !window.KHGExplorer) return;
  const rows = (Array.isArray(dongs) ? dongs : []).filter(item => item && item.dong && Number(item.contractCount || 0) >= 3).slice(0, 10);
  if (!rows.length) {
    neighborhoodLinks.innerHTML = '<span class="explorer-empty">No neighborhood-level pages had enough recent contracts.</span>';
    return;
  }
  const lawdCd = root.dataset.lawdCd;
  const type = root.dataset.propertyType;
  neighborhoodLinks.innerHTML = rows.map(item => {
    const href = KHGExplorer.buildDongSeoUrl({ lawdCd, type, dong:item.dong, lang:'en' });
    return `<a href="${escapeHtml(href)}"><strong>${escapeHtml(item.dong)}</strong><span>${Number(item.contractCount || 0).toLocaleString('en-US')} recent contracts</span></a>`;
  }).join('');
}

function renderMarket(data) {
  marketData = data;
  metricContracts.textContent = Number(data.totalContracts || 0).toLocaleString('en-US');
  metricRent.textContent = Number(data.newContractMonthlyRentCount || 0).toLocaleString('en-US');
  metricDeposit.textContent = Number(data.renewalMonthlyRentCount || 0).toLocaleString('en-US');
  metricJeonse.innerHTML = data.jeonseCount ? moneyHtml(data.medianJeonseDepositWon) : '<span class="money-primary">No jeonse median</span>';
  const q = Number(data.quarterChangePct);
  quarterChange.textContent = Number.isFinite(q) ? `${q > 0 ? '+' : ''}${q.toFixed(1)}% vs prior 3 months` : 'Not enough data for a quarterly comparison';
  dataThrough.textContent = data.dataThroughMonth ? `Data through ${KHGDate.formatMonth(data.dataThroughMonth, 'en-US')}` : 'Latest completed months';
  renderDepositBands(data.depositBands || []);
  renderAreaGroups(data.areaGroups || []);
  renderRecentContracts(data.recentContracts || []);
  renderNeighborhoodLinks(data.dongs || []);
  const basis = data.contextualBasis === 'new-contracts' ? 'Rent-by-deposit uses identified new contracts.' : 'Contract-type labels were too sparse, so rent-by-deposit uses all reported monthly-rent contracts.';
  marketStatus.textContent = data.totalContracts
    ? `Based on ${Number(data.totalContracts).toLocaleString('en-US')} reported contracts from the latest ${data.monthsUsed || 6} completed months. ${basis}`
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
