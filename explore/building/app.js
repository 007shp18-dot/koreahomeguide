const query = new URLSearchParams(location.search);
const lawdCd = query.get('lawdCd') || '';
const type = query.get('type') || '';
const buildingKey = query.get('buildingKey') || '';
const currencySelect = document.querySelector('#currencySelect');
const languageSwitch = document.querySelector('#languageSwitch');
const buildingName = document.querySelector('#buildingName');
const buildingMeta = document.querySelector('#buildingMeta');
const buildingStatus = document.querySelector('#buildingStatus');
const buildingRent = document.querySelector('#buildingRent');
const buildingDeposit = document.querySelector('#buildingDeposit');
const buildingArea = document.querySelector('#buildingArea');
const buildingContracts = document.querySelector('#buildingContracts');
const buildingChange = document.querySelector('#buildingChange');
const trendChart = document.querySelector('#trendChart');
const recentBuildingContracts = document.querySelector('#recentBuildingContracts');
const rentCheckCta = document.querySelector('#rentCheckCta');
const backToExplore = document.querySelector('#backToExplore');
let fxRates = {};
let buildingData = null;

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">Not enough data</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'en-US');
}
function formatArea(value) { return value == null ? 'Not enough data' : `${Number(value).toFixed(1)}㎡`; }

function renderTrend(points) {
  const usable = (points || []).filter(point => Number.isFinite(Number(point.medianMonthlyRentWon)) && Number(point.medianMonthlyRentWon) > 0);
  if (usable.length < 3) {
    trendChart.innerHTML = '<div class="explorer-empty">Not enough monthly observations to show a meaningful trend.</div>';
    return;
  }
  const max = Math.max(...usable.map(point => Number(point.medianMonthlyRentWon)));
  trendChart.innerHTML = usable.map(point => {
    const value = Number(point.medianMonthlyRentWon);
    const height = Math.max(12, Math.round((value / max) * 100));
    return `<div class="trend-column"><div class="trend-value">${moneyHtml(value)}</div><div class="trend-bar-track"><span class="trend-bar" style="height:${height}%"></span></div><strong>${KHGDate.formatMonth(point.month, 'en-US')}</strong><small>${point.count} contract${point.count === 1 ? '' : 's'}</small></div>`;
  }).join('');
}

function renderContracts(items) {
  if (!items || !items.length) {
    recentBuildingContracts.innerHTML = '<tr class="empty-row"><td colspan="4">No recent reported contracts were available for this building.</td></tr>';
    return;
  }
  recentBuildingContracts.innerHTML = items.map(item => `<tr><td>${KHGDate.formatDate(item.contractDate, 'en-US')}</td><td>${formatArea(item.areaSqm)}</td><td>${moneyHtml(item.depositWon)}</td><td>${Number(item.monthlyRentWon) === 0 ? '<span class="money-primary">Jeonse-style · ₩0</span>' : moneyHtml(item.monthlyRentWon)}</td></tr>`).join('');
}

function buildRentCheckUrl(data) {
  const params = new URLSearchParams({ lawdCd, type });
  if (Number.isFinite(Number(data.medianDepositWon))) params.set('deposit', String(Math.round(Number(data.medianDepositWon))));
  if (Number.isFinite(Number(data.medianMonthlyRentWon))) params.set('rent', String(Math.round(Number(data.medianMonthlyRentWon))));
  if (Number.isFinite(Number(data.typicalAreaSqm))) params.set('area', String(Number(data.typicalAreaSqm).toFixed(1)));
  return `/tools/seoul-rent-check/?${params.toString()}`;
}

function renderBuilding(data) {
  buildingData = data;
  buildingName.textContent = data.buildingName;
  buildingMeta.textContent = `${data.districtName} · ${KHGExplorer.propertyTypeLabel(data.propertyType)} · Seoul`;
  document.title = `${data.buildingName} Rent Data | Seoul Rent Explorer`;
  buildingRent.innerHTML = data.medianMonthlyRentWon == null ? 'Not enough data' : moneyHtml(data.medianMonthlyRentWon);
  buildingDeposit.innerHTML = data.medianDepositWon == null ? 'Not enough data' : moneyHtml(data.medianDepositWon);
  buildingArea.textContent = formatArea(data.typicalAreaSqm);
  buildingContracts.textContent = Number(data.contractCount || 0).toLocaleString('en-US');
  const change = Number(data.quarterChangePct);
  buildingChange.textContent = Number.isFinite(change) ? `Recent change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 'Recent change: Not enough data';
  renderTrend(data.monthlyTrend || []);
  renderContracts(data.recentTransactions || []);
  rentCheckCta.href = buildRentCheckUrl(data);
  backToExplore.href = `/explore/?${new URLSearchParams({ lawdCd, type }).toString()}`;
  if (languageSwitch) languageSwitch.href = `/zh/explore/building/?${new URLSearchParams({ lawdCd, type, buildingKey }).toString()}`;
  buildingStatus.textContent = `Based on ${Number(data.contractCount || 0).toLocaleString('en-US')} reported contracts for this building in the latest 6 completed months.`;
  buildingStatus.className = 'market-status success';
}

async function loadFx() {
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

async function loadBuilding() {
  if (languageSwitch) languageSwitch.href = `/zh/explore/building/?${new URLSearchParams({ lawdCd, type, buildingKey }).toString()}`;
  if (!lawdCd || !type || !buildingKey) {
    buildingName.textContent = 'Building data link is incomplete.';
    buildingStatus.textContent = 'Return to Rent Explorer and choose a building again.';
    buildingStatus.className = 'market-status error';
    return;
  }
  try {
    const params = new URLSearchParams({ lawdCd, type, buildingKey });
    const response = await fetch(`/api/explore-building?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Building data failed');
    renderBuilding(data);
  } catch (_) {
    buildingName.textContent = 'Building data is unavailable.';
    buildingStatus.textContent = 'This building may not have reported contracts in the selected recent period, or official data may be temporarily unavailable.';
    buildingStatus.className = 'market-status error';
    trendChart.innerHTML = '<div class="explorer-empty">No building trend available.</div>';
    recentBuildingContracts.innerHTML = '<tr class="empty-row"><td colspan="4">No building contracts available.</td></tr>';
  }
}

currencySelect.addEventListener('change', () => { if (buildingData) renderBuilding(buildingData); });
(async () => { await loadFx(); await loadBuilding(); })();
