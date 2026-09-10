const query = new URLSearchParams(location.search);
const lawdCd = query.get('lawdCd') || '';
const type = query.get('type') || '';
const buildingKey = query.get('buildingKey') || '';
const requestedDong = query.get('dong') || '';
const currencySelect = document.querySelector('#currencySelect');
const languageSwitch = document.querySelector('#languageSwitch');
const buildingName = document.querySelector('#buildingName');
const buildingOfficialName = document.querySelector('#buildingOfficialName');
const buildingMeta = document.querySelector('#buildingMeta');
const buildingStatus = document.querySelector('#buildingStatus');
const buildingArea = document.querySelector('#buildingArea');
const buildingContracts = document.querySelector('#buildingContracts');
const buildingNewContracts = document.querySelector('#buildingNewContracts');
const buildingJeonse = document.querySelector('#buildingJeonse');
const buildingContractMix = document.querySelector('#buildingContractMix');
const buildingDepositBands = document.querySelector('#buildingDepositBands');
const buildingAreaGroups = document.querySelector('#buildingAreaGroups');
const buildingChange = document.querySelector('#buildingChange');
const trendChart = document.querySelector('#trendChart');
const recentBuildingContracts = document.querySelector('#recentBuildingContracts');
const buildingSalesSection = document.querySelector('#buildingSalesSection');
const buildingSaleGroups = document.querySelector('#buildingSaleGroups');
const recentBuildingSales = document.querySelector('#recentBuildingSales');
const rentCheckCta = document.querySelector('#rentCheckCta');
const backToExplore = document.querySelector('#backToExplore');
let fxRates = {};
let buildingData = null;
const buildingAnalytics = window.KHGProductAnalytics
  ? window.KHGProductAnalytics.createTracker(window)
  : null;

function trackBuilding(data = {}, resultState = '', errorCategory = '') {
  if (!buildingAnalytics) return false;
  return buildingAnalytics.emit('explorer_building_detail_view', {
    language:'en', districtCode:data.districtCode || lawdCd,
    propertyType:data.propertyType || type,
    contractCount:Number(data.contractCount || 0), resultState, errorCategory
  });
}

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">Not enough data</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'en-US');
}
function formatArea(value) { return value == null ? 'Not enough data' : `${Number(value).toFixed(1)}㎡`; }
function contextParams(data = {}) {
  const params = new URLSearchParams({ lawdCd, type });
  const dong = data.dong || requestedDong;
  if (dong) params.set('dong', dong);
  return params;
}
function buildingLanguageParams(data = {}) {
  const params = contextParams(data);
  params.set('buildingKey', buildingKey);
  return params;
}
function contractTypeLabel(value) {
  if (value === 'new') return 'New';
  if (value === 'renewal') return 'Renewal';
  return 'Not identified';
}
function depositRangeLabel(band) {
  const min = Number(band.minDepositWon || 0);
  const max = Number(band.maxDepositWon);
  if (!Number.isFinite(max)) return `${moneyHtml(min)}+ deposit`;
  if (min === 0) return `Under ${moneyHtml(max)} deposit`;
  return `${moneyHtml(min)}–${moneyHtml(max)} deposit`;
}

function renderDepositBands(items) {
  if (!items || !items.length) {
    buildingDepositBands.innerHTML = '<div class="explorer-empty">Not enough monthly-rent contracts to show deposit bands.</div>';
    return;
  }
  buildingDepositBands.innerHTML = items.flatMap(band => {
    const evidence = KHGExplorer.marketEvidencePresentation(band.count, 'en');
    if (!evidence.render) return [];
    const rent = evidence.sufficient ? `${moneyHtml(band.medianMonthlyRentWon)} / month` : evidence.limitedLabel;
    const deposit = evidence.sufficient ? ` · median deposit ${moneyHtml(band.medianDepositWon)}` : '';
    return [`<div class="size-band-card market-evidence-row"><span>${depositRangeLabel(band)}</span><strong class="market-evidence-rent">${rent}</strong><small class="market-evidence-count">${evidence.sampleLabel}${deposit}</small></div>`];
  }).join('');
}

function renderAreaGroups(items) {
  if (!items || !items.length) {
    buildingAreaGroups.innerHTML = '<div class="explorer-empty">Not enough monthly-rent contracts to separate floor-area groups.</div>';
    return;
  }
  buildingAreaGroups.innerHTML = items.flatMap(group => {
    const evidence = KHGExplorer.marketEvidencePresentation(group.count, 'en');
    if (!evidence.render) return [];
    const rent = evidence.sufficient ? `${moneyHtml(group.medianMonthlyRentWon)} / month` : evidence.limitedLabel;
    const deposit = evidence.sufficient ? ` · median deposit ${moneyHtml(group.medianDepositWon)}` : '';
    return [`<div class="size-band-card market-evidence-row"><span>About ${group.approxAreaSqm}㎡</span><strong class="market-evidence-rent">${rent}</strong><small class="market-evidence-count">${evidence.sampleLabel}${deposit}</small></div>`];
  }).join('');
}

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
    recentBuildingContracts.innerHTML = '<tr class="empty-row"><td colspan="5">No recent reported contracts were available for this building.</td></tr>';
    return;
  }
  recentBuildingContracts.innerHTML = items.map(item => KHGExplorer.buildLabeledTableRow([
    { label:'Date', html:KHGDate.formatDate(item.contractDate, 'en-US') },
    { label:'Type', html:contractTypeLabel(item.contractType) },
    { label:'Size', html:formatArea(item.areaSqm) },
    { label:'Deposit', html:moneyHtml(item.depositWon) },
    { label:'Monthly rent', html:Number(item.monthlyRentWon) === 0 ? '<span class="money-primary">Jeonse-style · ₩0</span>' : moneyHtml(item.monthlyRentWon) }
  ])).join('');
}

function renderSales(data) {
  const summary = data && data.saleSummary;
  if (!buildingSalesSection) return;
  if (!summary || !summary.contractCount) {
    buildingSalesSection.hidden = true;
    return;
  }
  buildingSalesSection.hidden = false;
  buildingSaleGroups.innerHTML = (summary.areaGroups || []).map(group => `<div class="size-band-card"><span>About ${group.approxAreaSqm}㎡</span><strong>${moneyHtml(group.medianSalePriceWon)}</strong><small>${group.count} reported sale${group.count === 1 ? '' : 's'} · latest ${KHGDate.formatDate(group.latestContractDate, 'en-US')}</small></div>`).join('');
  recentBuildingSales.innerHTML = (summary.recentSales || []).map(item => KHGExplorer.buildLabeledTableRow([
    { label:'Date', html:KHGDate.formatDate(item.contractDate, 'en-US') },
    { label:'Size', html:formatArea(item.areaSqm) },
    { label:'Sale price', html:moneyHtml(item.dealAmountWon) },
    { label:'Floor', html:item.floor == null ? '—' : `${item.floor}F` }
  ])).join('');
}

function buildRentCheckUrl(data) {
  const params = new URLSearchParams({ lawdCd, type });
  // Prefill from one real recent monthly-rent contract, never from two separately computed medians.
  const actual = (data.recentTransactions || []).find(item => Number(item.monthlyRentWon) > 0);
  if (actual) {
    params.set('deposit', String(Math.round(Number(actual.depositWon))));
    params.set('rent', String(Math.round(Number(actual.monthlyRentWon))));
    params.set('area', String(Number(actual.areaSqm).toFixed(1)));
  } else if (Number.isFinite(Number(data.typicalAreaSqm))) {
    params.set('area', String(Number(data.typicalAreaSqm).toFixed(1)));
  }
  return `/tools/seoul-rent-check/?${params.toString()}`;
}

function renderBuilding(data) {
  buildingData = data;
  const nameDisplay = KHGBuildingNames.getBuildingNameDisplay(data.buildingName, 'en');
  buildingName.textContent = nameDisplay.primary;
  if (buildingOfficialName) { buildingOfficialName.textContent = nameDisplay.secondary; buildingOfficialName.hidden = !nameDisplay.secondary; }
  buildingMeta.textContent = [KHGLocations.districtLabel(lawdCd, 'en'), data.dong ? KHGLocations.dongLabel(data.dong, 'en') : '', KHGLocations.propertyTypeLabel(data.propertyType, 'en'), 'Seoul'].filter(Boolean).join(' · ');
  document.title = `${nameDisplay.primary} Rent Data | Seoul Rent Explorer`;
  buildingContracts.textContent = Number(data.contractCount || 0).toLocaleString('en-US');
  buildingNewContracts.textContent = Number(data.newContractMonthlyRentCount || 0).toLocaleString('en-US');
  buildingArea.textContent = formatArea(data.typicalAreaSqm);
  buildingJeonse.innerHTML = data.medianJeonseDepositWon == null ? '<span class="money-primary">Not enough data</span>' : moneyHtml(data.medianJeonseDepositWon);
  const counts = data.contractTypeCounts || {};
  buildingContractMix.textContent = `${Number(counts.new || 0)} new · ${Number(counts.renewal || 0)} renewal · ${Number(counts.unknown || 0)} not identified`;
  renderDepositBands(data.depositBands || []);
  renderAreaGroups(data.areaGroups || []);
  const change = Number(data.quarterChangePct);
  buildingChange.textContent = Number.isFinite(change) ? `Raw monthly-rent median change: ${change > 0 ? '+' : ''}${change.toFixed(1)}% · includes deposit, size, and contract mix effects` : 'Raw trend: Not enough data';
  renderTrend(data.monthlyTrend || []);
  renderContracts(data.recentTransactions || []);
  renderSales(data);
  rentCheckCta.href = buildRentCheckUrl(data);
  backToExplore.href = `/explore/?${contextParams(data).toString()}`;
  if (languageSwitch) languageSwitch.href = `/zh/explore/building/?${buildingLanguageParams(data).toString()}`;
  const basis = data.contextualBasis === 'new-contracts' ? 'New contracts are used for the rent-by-deposit and area summaries.' : 'Contract type was not available often enough, so the contextual summaries use all reported monthly-rent contracts.';
  buildingStatus.textContent = `Based on ${Number(data.contractCount || 0).toLocaleString('en-US')} reported contracts in the latest 6 completed months. ${basis}`;
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
  if (languageSwitch) languageSwitch.href = `/zh/explore/building/?${buildingLanguageParams().toString()}`;
  if (!lawdCd || !type || !buildingKey) {
    buildingName.textContent = 'Building data link is incomplete.';
    buildingStatus.textContent = 'Return to Rent Explorer and choose a building again.';
    buildingStatus.className = 'market-status error';
    trackBuilding({}, 'error', 'request');
    return;
  }
  try {
    const params = new URLSearchParams({ lawdCd, type, buildingKey });
    const response = await fetch(`/api/explore-building?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || 'Building data failed');
      error.status = response.status;
      throw error;
    }
    renderBuilding(data);
    trackBuilding(data, Number(data.contractCount || 0) > 0 ? 'success' : 'empty');
  } catch (error) {
    trackBuilding({}, 'error', window.KHGProductAnalytics && window.KHGProductAnalytics.errorCategory(error));
    buildingName.textContent = 'Building data is unavailable.';
    buildingStatus.textContent = 'This building may not have reported contracts in the selected recent period, or official data may be temporarily unavailable.';
    buildingStatus.className = 'market-status error';
    trendChart.innerHTML = '<div class="explorer-empty">No building trend available.</div>';
    recentBuildingContracts.innerHTML = '<tr class="empty-row"><td colspan="5">No building contracts available.</td></tr>';
  }
}

currencySelect.addEventListener('change', () => { if (buildingData) renderBuilding(buildingData); });
(async () => { await loadFx(); await loadBuilding(); })();
