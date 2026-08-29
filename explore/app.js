const areaSelect = document.querySelector('#exploreArea');
const typeSelect = document.querySelector('#exploreType');
const maxRentSelect = document.querySelector('#exploreMaxRent');
const maxDepositSelect = document.querySelector('#exploreMaxDeposit');
const exploreButton = document.querySelector('#exploreButton');
const currencySelect = document.querySelector('#currencySelect');
const languageSwitch = document.querySelector('#languageSwitch');
const title = document.querySelector('#explorerTitle');
const summaryArea = document.querySelector('#explorerSummaryArea');
const summaryType = document.querySelector('#explorerSummaryType');
const status = document.querySelector('#explorerStatus');
const dataThrough = document.querySelector('#explorerDataThrough');
const metricRent = document.querySelector('#metricRent');
const metricDeposit = document.querySelector('#metricDeposit');
const metricContracts = document.querySelector('#metricContracts');
const metricChange = document.querySelector('#metricChange');
const metricPerSqm = document.querySelector('#metricPerSqm');
const districtList = document.querySelector('#districtList');
const dongList = document.querySelector('#dongList');
const buildingList = document.querySelector('#buildingList');
const buildingListMore = document.querySelector('#buildingListMore');
const buildingSort = document.querySelector('#explorerBuildingSort');
const sheetToggle = document.querySelector('#explorerSheetToggle');
const budgetFilterNote = document.querySelector('#budgetFilterNote');
const resultsShell = document.querySelector('#explorerResultsShell');
const explorerResults = resultsShell;
const explorerRailBack = document.querySelector('#explorerRailBack');
const explorerSearchCard = document.querySelector('.explorer-search-card');
const explorerFilterSummary = document.querySelector('#explorerFilterSummary');
const explorerChangeFilters = document.querySelector('#explorerChangeFilters');
const mapSelection = document.querySelector('#explorerMapSelection');
const mapSelectionStatus = document.querySelector('#explorerMapSelectionStatus');
const mapSelectionName = document.querySelector('#explorerMapSelectionName');
const mapSelectionContracts = document.querySelector('#explorerMapSelectionContracts');
const mapSelectionRent = document.querySelector('#explorerMapSelectionRent');
const mapSelectionDeposit = document.querySelector('#explorerMapSelectionDeposit');
const mapSelectionEvidence = document.querySelector('#explorerMapSelectionEvidence');
const mapSelectionDetail = document.querySelector('#explorerMapSelectionDetail');
const mapSelectionClose = document.querySelector('#explorerMapSelectionClose');
const explorerViewButtons = [...document.querySelectorAll('[data-explorer-view]')];
const mapHousingButtons = [...document.querySelectorAll('[data-map-housing]')];
const mapMetricButtons = [...document.querySelectorAll('[data-map-metric]')];
const mapLegendTitle = document.querySelector('[data-map-legend-title]');
const mapLegendMethod = document.querySelector('[data-map-legend-method]');
let fxRates = {};
let currentAreaData = null;
let currentData = null;
let currentDong = '';
let currentBuildingKey = '';
let currentMapSelection = null;
let explorerLevel = 'districts';
let selectedDistrictCode = '';
let currentMapMetric = 'adjusted-per-sqm';
const areaLoadGate = KHGExplorer.createRequestGate();
const dongLoadGate = KHGExplorer.createRequestGate();
let dongLoadPending = false;
let currentVisibleDongs = null;
let currentVisibleBuildingKeys = null;
let buildingVisibleCount = 10;
const explorerAnalytics = window.KHGProductAnalytics
  ? window.KHGProductAnalytics.createTracker(window)
  : null;

function setExplorerLevel(level, { districtCode = selectedDistrictCode, dong = currentDong } = {}) {
  explorerLevel = ['districts','neighborhoods','buildings'].includes(level) ? level : 'districts';
  selectedDistrictCode = explorerLevel === 'districts' ? '' : String(districtCode || '');
  currentDong = explorerLevel === 'buildings' ? String(dong || '') : '';
  if (resultsShell) resultsShell.dataset.workspaceState = explorerLevel;
  const districtSection = document.querySelector('.district-section');
  const dongSection = document.querySelector('.dong-section');
  const buildingSection = document.querySelector('.building-section');
  if (districtSection) districtSection.hidden = explorerLevel !== 'districts';
  if (dongSection) dongSection.hidden = explorerLevel !== 'neighborhoods';
  if (buildingSection) buildingSection.hidden = explorerLevel !== 'buildings';
  if (explorerRailBack) {
    explorerRailBack.hidden = explorerLevel === 'districts';
    explorerRailBack.textContent = explorerLevel === 'buildings' ? '← Neighborhoods' : '← Seoul districts';
  }
}

function syncWorkspaceState() {
  if (!resultsShell) return;
  setExplorerLevel(explorerLevel, { districtCode:selectedDistrictCode, dong:currentDong });
}

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">Not enough data</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'en-US');
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function areaName() { return KHGLocations.districtLabel(areaSelect.value, 'en'); }
function typeName(type = typeSelect.value) { return KHGLocations.propertyTypeLabel(type, 'en'); }
function dongDisplayName(dong) { return KHGLocations.dongLabel(dong, 'en'); }
function dongDisplayHtml(dong) {
  const parts = KHGExplorer.localizedDongParts(dong, 'en');
  const korean = parts.korean ? `<span class="location-name-ko">(${escapeHtml(parts.korean)})</span>` : '';
  return `<span class="localized-location-name${parts.breakKorean ? ' is-long' : ''}"><span class="location-name-primary">${escapeHtml(parts.primary)}</span>${korean}</span>`;
}
function formatArea(area) { return area == null ? '—' : `${Number(area).toFixed(1)}㎡`; }
function formatAdjustedPerSqm(value) { return value == null ? '—' : `₩${Math.round(Number(value)).toLocaleString('en-US')}/㎡`; }
function budgetValues() {
  return {
    maxRent:Number(maxRentSelect && maxRentSelect.value || 0),
    maxDeposit:Number(maxDepositSelect && maxDepositSelect.value || 0)
  };
}
function trackExplorer(eventName, data = {}, resultState = '') {
  if (!explorerAnalytics) return false;
  const budget = budgetValues();
  return explorerAnalytics.emit(eventName, {
    language:'en', districtCode:data.districtCode || areaSelect.value,
    propertyType:data.propertyType || typeSelect.value,
    maxRent:budget.maxRent, maxDeposit:budget.maxDeposit,
    resultCount:Array.isArray(data.dongs) ? data.dongs.length : 0,
    contractCount:Number(data.contractCount || 0), resultState,
    errorCategory:data.errorCategory || ''
  });
}
function hasBudgetFilter() {
  const { maxRent, maxDeposit } = budgetValues();
  return Boolean(maxRent || maxDeposit);
}
function selectedOptionText(select) {
  const option = select && select.options && select.options[select.selectedIndex];
  return option ? String(option.textContent || '').trim() : '';
}
function updateFilterSummary() {
  if (!explorerFilterSummary) return;
  const text = explorerFilterSummary.querySelector('span');
  if (text) text.textContent = [selectedOptionText(maxRentSelect), selectedOptionText(maxDepositSelect)].filter(Boolean).join(' · ');
}
function filterDongsByBudget(items) {
  return KHGExplorer.filterDongsByBudget(items, budgetValues());
}
function updateBudgetNote(filteredCount, totalCount) {
  if (!budgetFilterNote) return;
  budgetFilterNote.textContent = hasBudgetFilter()
    ? `${filteredCount} of ${totalCount} neighborhoods fit the selected median-rent/deposit limits`
    : 'Choose a neighborhood to see buildings';
}
function publishMapDongs(dongs) {
  window.dispatchEvent(new CustomEvent('khg:explorer-dongs', { detail:{ lawdCd:areaSelect.value, propertyType:typeSelect.value, locale:'en', limits:budgetValues(), dongs:Array.isArray(dongs) ? dongs : [] } }));
}
function publishMapDistricts(districts) {
  window.dispatchEvent(new CustomEvent('khg:explorer-districts', { detail:{ lawdCd:'all', propertyType:typeSelect.value, locale:'en', metric:currentMapMetric, districts:Array.isArray(districts) ? districts : [] } }));
}
function publishMapBuildings(dong, buildings, lawdCd = areaSelect.value) {
  window.dispatchEvent(new CustomEvent('khg:explorer-buildings', { detail:{ lawdCd:String(lawdCd || areaSelect.value), propertyType:typeSelect.value, locale:'en', limits:budgetValues(), dong:String(dong || ''), buildings:Array.isArray(buildings) ? buildings : [] } }));
}
function currentParams(includeDong = true) {
  const params = new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value });
  const { maxRent, maxDeposit } = budgetValues();
  if (maxRent) params.set('maxRent', String(maxRent));
  if (maxDeposit) params.set('maxDeposit', String(maxDeposit));
  if (includeDong && currentDong) params.set('dong', currentDong);
  return params;
}
function updateLanguageSwitch() {
  if (languageSwitch) languageSwitch.href = `/zh/explore/?${currentParams(true).toString()}`;
}

function updateRentCheckHandoff({ lawdCd = areaSelect.value, propertyType = typeSelect.value } = {}) {
  if (!window.KHGAcquisitionLinks || typeof KHGAcquisitionLinks.updateRentCheckLinksForSelection !== 'function') return;
  KHGAcquisitionLinks.updateRentCheckLinksForSelection({
    doc:document,
    location,
    lawdCd,
    propertyType
  });
}

function setExplorerView(view = 'map') {
  const nextView = view === 'list' ? 'list' : 'map';
  explorerResults.classList.toggle('is-map-view', nextView === 'map');
  explorerResults.classList.toggle('is-list-view', nextView === 'list');
  explorerViewButtons.forEach(button => {
    const active = button.dataset.explorerView === nextView;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (nextView === 'map') requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

function highlightMapCard(dong) {
  const selected = String(dong || '');
  document.querySelectorAll('.neighborhood-card[data-dong]').forEach(card => {
    card.classList.toggle('is-map-selected', card.dataset.dong === selected);
  });
}

function cancelDongLoad() {
  const hadPending = dongLoadPending;
  dongLoadGate.invalidate();
  dongLoadPending = false;
  if (hadPending) exploreButton.disabled = false;
}

function clearMapSelection() {
  cancelDongLoad();
  currentMapSelection = null;
  if (mapSelection) mapSelection.hidden = true;
  highlightMapCard('');
  window.dispatchEvent(new CustomEvent('khg:map-clear-selection'));
}

function returnToNeighborhoods() {
  currentDong = '';
  currentBuildingKey = '';
  currentVisibleBuildingKeys = null;
  clearMapSelection();
  setExplorerLevel('neighborhoods', { districtCode:areaSelect.value });
  if (currentAreaData) {
    renderSummary(currentAreaData, '');
    publishMapDongs(currentAreaData.dongs || []);
  } else {
    void loadArea();
  }
  history.replaceState(null, '', `/explore/?${currentParams(false).toString()}`);
}

function returnToDistricts() {
  areaLoadGate.invalidate();
  cancelDongLoad();
  currentDong = '';
  currentBuildingKey = '';
  currentAreaData = null;
  currentData = null;
  areaSelect.value = 'all';
  setExplorerLevel('districts');
  void loadArea();
}

function handleSelectionChange() {
  areaLoadGate.invalidate();
  clearMapSelection();
  currentVisibleDongs = null;
  currentVisibleBuildingKeys = null;
  updateRentCheckHandoff();
  updateFilterSummary();
}

function renderMapSelection(model) {
  if (!mapSelection || !model || !model.dong) return;
  currentMapSelection = model;
  const evidenceCount = Number(model.evidenceCount || 0);
  const totalCount = Number(model.contractCount || 0);
  const isBuilding = model.kind === 'building';
  const statusCopy = model.budgetStatus === 'outside'
    ? 'Outside selected budget'
    : model.evidenceLevel === 'strong' ? 'Strong evidence' : 'Limited evidence';
  mapSelectionStatus.textContent = statusCopy;
  mapSelectionStatus.className = `explorer-map-selection-status is-${model.tone || 'limited'}`;
  mapSelectionName.innerHTML = isBuilding
    ? `<span>${escapeHtml(model.label || model.buildingName)}</span>${model.secondaryLabel ? `<small class="building-official-name">${escapeHtml(model.secondaryLabel)}</small>` : ''}`
    : dongDisplayHtml(model.dong);
  mapSelectionContracts.textContent = model.budgetStatus === 'unfiltered'
    ? `${totalCount.toLocaleString('en-US')} reported contracts`
    : `${evidenceCount.toLocaleString('en-US')} budget-matching contracts`;
  mapSelectionRent.innerHTML = model.rentWon == null ? '—' : moneyHtml(model.rentWon);
  mapSelectionDeposit.innerHTML = model.depositWon == null ? '—' : moneyHtml(model.depositWon);
  mapSelectionEvidence.textContent = isBuilding
    ? `This marker represents a verified building location and ${evidenceCount.toLocaleString('en-US')} relevant historical contracts, not an available unit or live listing.`
    : model.budgetStatus === 'outside'
    ? `No recent price context matched every active budget limit. The values above show this neighborhood's broader context from ${totalCount.toLocaleString('en-US')} reported contracts.`
    : model.evidenceLevel === 'strong'
      ? `Supported by ${evidenceCount.toLocaleString('en-US')} relevant reported contracts. This is historical market context, not a live listing.`
      : `Only ${evidenceCount.toLocaleString('en-US')} relevant reported contracts support this marker, so treat it as directional context.`;
  if (mapSelectionDetail) {
    mapSelectionDetail.href = isBuilding
      ? KHGExplorer.buildBuildingDetailUrl({ lawdCd:model.districtCode, type:model.propertyType, dong:model.dong, buildingKey:model.buildingKey })
      : KHGExplorer.buildDongSeoUrl({ lawdCd:model.districtCode, type:model.propertyType, dong:model.dong, lang:'en' }) ||
        KHGExplorer.buildExplorerDongUrl({ lawdCd:model.districtCode, type:model.propertyType, dong:model.dong, lang:'en' });
    mapSelectionDetail.textContent = isBuilding ? 'Open building details →' : 'Show buildings on map →';
  }
  mapSelection.hidden = false;
  highlightMapCard(model.dong);
  updateRentCheckHandoff({ lawdCd:model.districtCode, propertyType:model.propertyType });
}


function representativeBand(item) {
  return KHGExplorer.budgetFitForDong(item, budgetValues()).representativeBand;
}

function renderDongs(dongs, { publish = true } = {}) {
  if (!dongList) return;
  const allItems = Array.isArray(dongs) ? dongs : [];
  const budgetItems = filterDongsByBudget(allItems);
  const items = currentVisibleDongs instanceof Set
    ? budgetItems.filter(item => currentVisibleDongs.has(String(item.dong || '')))
    : budgetItems;
  updateBudgetNote(items.length, allItems.length);
  if (publish) publishMapDongs(allItems);
  if (hasBudgetFilter() && !items.length) {
    dongList.innerHTML = '<div class="explorer-empty">No neighborhood median fits both selected budget limits. Try a higher rent or deposit budget.</div>';
    return;
  }
  if (!items.length) {
    dongList.innerHTML = '<div class="explorer-empty">No neighborhood summary is available for this selection yet.</div>';
    return;
  }
  dongList.innerHTML = items.map(item => {
    const districtCode = item.districtCode || areaSelect.value;
    const districtName = item.districtName || KHGLocations.districtLabel(districtCode, 'en');
    const isAllSeoul = areaSelect.value === 'all';
    const band = representativeBand(item);
    const rentValue = band ? band.medianMonthlyRentWon : (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon);
    const depositValue = band ? band.medianDepositWon : (item.contextualMedianDepositWon ?? item.medianDepositWon);
    const rent = rentValue == null ? '—' : moneyHtml(rentValue);
    const deposit = depositValue == null ? '—' : moneyHtml(depositValue);
    const seoHref = KHGExplorer.buildDongSeoUrl({ lawdCd:districtCode, type:typeSelect.value, dong:item.dong, lang:'en' }) ||
      KHGExplorer.buildExplorerDongUrl({ lawdCd:districtCode, type:typeSelect.value, dong:item.dong, lang:'en' });
    return `<div class="neighborhood-result"><button class="neighborhood-card" type="button" data-dong="${escapeHtml(item.dong)}" data-district-code="${escapeHtml(districtCode)}">
      <span class="neighborhood-card-main"><strong>${dongDisplayHtml(item.dong)}</strong><small>${isAllSeoul ? `${escapeHtml(districtName)} · ` : ''}${Number(item.contractCount || 0).toLocaleString('en-US')} recent contracts</small></span>
      <span class="neighborhood-card-metric"><small>Rent context</small><strong>${rent}</strong></span>
      <span class="neighborhood-card-metric"><small>Deposit context</small><strong>${deposit}</strong></span>
      <span class="neighborhood-card-cta">Show buildings →</span>
    </button><a class="neighborhood-guide-link" href="${escapeHtml(seoHref)}">View neighborhood guide ↗</a></div>`;
  }).join('');
}

function districtMetricHtml(row) {
  const value = KHGExplorerDistrictMap.metricValue(row, currentMapMetric);
  if (value == null) return 'Not enough data';
  return currentMapMetric === 'adjusted-per-sqm' ? formatAdjustedPerSqm(value) : moneyHtml(value);
}

function renderDistricts(rows) {
  if (!districtList) return;
  const districts = (Array.isArray(rows) ? rows : []).map(KHGExplorerDistrictMap.normalizeDistrict);
  if (!districts.length) {
    districtList.innerHTML = '<div class="explorer-empty">District price context is temporarily unavailable.</div>';
    return;
  }
  districtList.innerHTML = districts.map(row => `<button class="district-card" type="button" data-district-code="${escapeHtml(row.districtCode)}"><span><strong>${escapeHtml(KHGLocations.districtLabel(row.districtCode, 'en'))}</strong><small>${Number(row.contractCount || 0).toLocaleString('en-US')} signed contracts</small></span><strong>${districtMetricHtml(row)}</strong><span aria-hidden="true">→</span></button>`).join('');
}

function updateMapMetric(metric) {
  currentMapMetric = ['adjusted-per-sqm','monthly','deposit'].includes(metric) ? metric : 'adjusted-per-sqm';
  mapMetricButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapMetric === currentMapMetric)));
  if (mapLegendTitle) mapLegendTitle.textContent = KHGExplorerDistrictMap.metricLabel(currentMapMetric, 'en');
  if (mapLegendMethod) mapLegendMethod.hidden = currentMapMetric !== 'adjusted-per-sqm';
  if (currentAreaData && explorerLevel === 'districts') renderDistricts(currentAreaData.districts || []);
  window.dispatchEvent(new CustomEvent('khg:map-metric-change', { detail:{ metric:currentMapMetric } }));
}

function activateDistrict(districtCode, { historyMode = 'push' } = {}) {
  const code = String(districtCode || '');
  if (!/^\d{5}$/.test(code)) return;
  areaLoadGate.invalidate();
  cancelDongLoad();
  selectedDistrictCode = code;
  areaSelect.value = code;
  currentDong = '';
  currentVisibleDongs = null;
  currentVisibleBuildingKeys = null;
  setExplorerLevel('neighborhoods', { districtCode:code });
  updateRentCheckHandoff({ lawdCd:code, propertyType:typeSelect.value });
  void loadArea({ historyMode });
}

function renderSummary(data, dong = '') {
  currentData = data;
  const nextDong = dong || '';
  if (currentDong !== nextDong) { currentBuildingKey = ''; buildingVisibleCount = 10; }
  currentDong = nextDong;
  syncWorkspaceState();
  const selectedAreaName = areaSelect.value === 'all' ? data.districtName : areaName();
  const heading = KHGExplorer.summaryHeading({
    lawdCd:data.districtCode || areaSelect.value,
    districtName:selectedAreaName,
    dong:currentDong,
    propertyType:data.propertyType || typeSelect.value,
    locale:'en'
  });
  title.textContent = heading.title;
  if (summaryArea) summaryArea.textContent = heading.area;
  if (summaryType) summaryType.textContent = heading.housingType;
  const summary = data.summary || {};
  const rentValue = summary.medianMonthlyRentWon;
  const depositValue = summary.medianDepositWon;
  metricRent.innerHTML = rentValue == null ? 'Not enough data' : moneyHtml(rentValue);
  metricDeposit.innerHTML = depositValue == null ? 'Not enough data' : moneyHtml(depositValue);
  metricContracts.textContent = Number(summary.totalContracts || summary.contractCount || 0).toLocaleString('en-US');
  const change = Number(summary.quarterChangePct);
  metricChange.textContent = Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 'Not enough data';
  if (metricPerSqm) metricPerSqm.textContent = formatAdjustedPerSqm(summary.adjustedPerSqmWon);
  dataThrough.textContent = summary.dataThroughMonth ? `Data through ${KHGDate.formatMonth(summary.dataThroughMonth, 'en-US')}` : 'Latest completed months';
  renderBuildings(data.buildings || []);
  const count = Number(summary.totalContracts || summary.contractCount || 0);
  status.textContent = count
    ? `Based on ${count.toLocaleString('en-US')} reported contracts${currentDong ? ` in ${dongDisplayName(currentDong)}` : ''} from the latest ${summary.monthsUsed || 6} completed months.`
    : 'Not enough reported transactions were available for a reliable market summary.';
  status.className = `market-status ${count ? 'success' : ''}`;
  if (currentAreaData) renderDongs(currentAreaData.dongs || [], { publish:false });
  updateLanguageSwitch();
}

function renderBuildings(buildings) {
  const buildingSection = document.querySelector('.building-section');
  if (!currentDong) {
    if (buildingSection) buildingSection.hidden = true;
    buildingList.innerHTML = '';
    return;
  }
  if (buildingSection) buildingSection.hidden = false;
  const visible = currentVisibleBuildingKeys instanceof Set
    ? buildings.filter(item => currentVisibleBuildingKeys.has(String(item.buildingKey || '')))
    : buildings;
  const items = KHGExplorer.sortBuildings(visible, buildingSort ? buildingSort.value : 'evidence');
  if (!items.length) {
    buildingList.innerHTML = '<div class="explorer-empty">No named buildings had reported contracts in this recent period.</div>';
    return;
  }
  buildingList.innerHTML = items.slice(0, buildingVisibleCount).map(item => {
    const dong = item.dong || currentDong;
    const location = [dongDisplayName(dong), areaName(), typeName()].filter(Boolean).join(' · ');
    const nameDisplay = KHGBuildingNames.getBuildingNameDisplay(item.buildingName, 'en');
    return `<button class="building-row" type="button" data-building-key="${escapeHtml(item.buildingKey)}" aria-label="Open ${escapeHtml(nameDisplay.primary)} building status">
      <div class="building-name"><strong>${escapeHtml(nameDisplay.primary)}</strong>${nameDisplay.secondary ? `<small class="building-official-name">${escapeHtml(nameDisplay.secondary)}</small>` : ''}<small>${escapeHtml(location)}</small></div>
      <div><span class="mobile-label">Typical size</span><strong>${formatArea(item.typicalAreaSqm)}</strong></div>
      <div class="building-per-sqm"><span class="mobile-label">Adjusted ₩/㎡</span><strong>${formatAdjustedPerSqm(item.adjustedPerSqmWon)}</strong></div>
      ${(() => { const band = representativeBand(item); const rentValue = band ? band.medianMonthlyRentWon : (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon); const depositValue = band ? band.medianDepositWon : (item.contextualMedianDepositWon ?? item.medianDepositWon); return `<div class="building-money building-price-pair"><span class="mobile-label">Rent / deposit</span><strong>${rentValue == null ? '—' : moneyHtml(rentValue)}</strong><small>${depositValue == null ? '—' : moneyHtml(depositValue)}</small></div>`; })()}
      <div><span class="mobile-label">Contracts</span><strong>${Number(item.contractCount || 0).toLocaleString('en-US')}</strong></div>
      <div class="building-actions"><span>View status →</span></div>
    </button>`;
  }).join('');
  if (buildingListMore) {
    buildingListMore.hidden = items.length <= buildingVisibleCount;
    buildingListMore.textContent = `Show 10 more buildings · ${Math.min(buildingVisibleCount, items.length)} of ${items.length}`;
  }
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

function setLoading(message = 'Loading official rental transactions…') {
  status.textContent = message;
  status.className = 'market-status loading';
  buildingList.innerHTML = '<div class="explorer-empty">Loading buildings…</div>';
  clearMapSelection();
  exploreButton.disabled = true;
}

async function loadDong(dong, { showBuildingsOnMap = false, lawdCd = areaSelect.value, historyMode = 'replace' } = {}) {
  currentDong = String(dong || '').trim();
  if (!currentDong) return;
  setExplorerLevel('buildings', { districtCode:lawdCd, dong:currentDong });
  setLoading(`Loading ${dongDisplayName(currentDong)} official rental transactions…`);
  const request = dongLoadGate.begin();
  dongLoadPending = true;
  updateLanguageSwitch();
  try {
    const params = currentParams(true);
    params.set('lawdCd', String(lawdCd || areaSelect.value));
    const response = await fetch(`/api/explore-dong?${params.toString()}`);
    const data = await response.json();
    if (!request.isCurrent()) return;
    if (!response.ok) throw new Error(data.error || 'Neighborhood data failed');
    renderSummary(data, data.dong || currentDong);
    if (showBuildingsOnMap) publishMapBuildings(data.dong || currentDong, data.buildings || [], data.districtCode || lawdCd);
    history[historyMode === 'push' ? 'pushState' : 'replaceState'](null, '', `/explore/?${currentParams(true).toString()}`);
  } catch (_) {
    if (!request.isCurrent()) return;
    status.textContent = 'Official transaction data for this neighborhood is temporarily unavailable.';
    status.className = 'market-status error';
    buildingList.innerHTML = '<div class="explorer-empty">We could not load neighborhood building data right now.</div>';
  } finally {
    if (request.isCurrent()) {
      dongLoadPending = false;
      exploreButton.disabled = false;
    }
  }
}

function activateNeighborhood(model, { historyMode = 'push' } = {}) {
  const transition = KHGExplorer.neighborhoodSelectionTransition(null, { type:'select', model });
  if (transition.phase !== 'activate') return;
  const selected = transition.model;
  const dong = String(selected.dong || '');
  if (!dong) return;
  cancelDongLoad();
  setExplorerLevel('buildings', { districtCode:selected.districtCode, dong });
  if (areaSelect.value === 'all' && /^\d{5}$/.test(String(selected.districtCode || ''))) {
    areaSelect.value = String(selected.districtCode);
    currentAreaData = null;
    currentVisibleDongs = null;
    updateRentCheckHandoff({ lawdCd:selected.districtCode, propertyType:typeSelect.value });
  }
  currentMapSelection = null;
  if (mapSelection) mapSelection.hidden = true;
  highlightMapCard(dong);
  window.dispatchEvent(new CustomEvent('khg:map-clear-selection'));
  const snapshot = areaSelect.value !== 'all' && KHGExplorer.areaSnapshotForDong(currentAreaData, dong);
  if (snapshot) {
    renderSummary(snapshot, dong);
    publishMapBuildings(dong, snapshot.buildings || [], selected.districtCode);
    history[historyMode === 'push' ? 'pushState' : 'replaceState'](null, '', `/explore/?${currentParams(true).toString()}`);
    return;
  }
  void loadDong(dong, { showBuildingsOnMap:true, lawdCd:selected.districtCode, historyMode });
}

async function loadArea({ requestedDong = '', historyMode = 'replace' } = {}) {
  const request = areaLoadGate.begin();
  const requestedDongName = String(requestedDong || '').trim();
  currentDong = requestedDongName;
  trackExplorer('explorer_search_start');
  setLoading();
  try {
    const apiParams = new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value });
    const isAllSeoul = areaSelect.value === 'all';
    const endpoint = isAllSeoul
      ? `/api/explore-seoul?type=${encodeURIComponent(typeSelect.value)}`
      : `/api/explore-area?${apiParams.toString()}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (!request.isCurrent()) return;
    if (!response.ok) {
      const error = new Error(data.error || 'Explorer data failed');
      error.status = response.status;
      throw error;
    }
    currentAreaData = data;
    if (isAllSeoul) {
      setExplorerLevel('districts');
      renderDistricts(data.districts || []);
      publishMapDistricts(data.districts || []);
    } else {
      setExplorerLevel('neighborhoods', { districtCode:data.districtCode || areaSelect.value });
      renderDongs(data.dongs || []);
    }
    trackExplorer('explorer_search_result', data, (data.dongs || []).length ? 'success' : 'empty');
    const hasRequestedDong = !isAllSeoul && requestedDongName && (data.dongs || []).some(item => item.dong === requestedDongName);
    if (hasRequestedDong) {
      await loadDong(requestedDongName);
      return;
    }
    currentDong = '';
    renderSummary(data, '');
    history[historyMode === 'push' ? 'pushState' : 'replaceState'](null, '', `/explore/?${currentParams(false).toString()}`);
  } catch (error) {
    if (!request.isCurrent()) return;
    trackExplorer('explorer_search_error', {
      errorCategory:window.KHGProductAnalytics && window.KHGProductAnalytics.errorCategory(error)
    }, 'error');
    currentAreaData = null;
    currentData = null;
    currentDong = '';
    status.textContent = 'Official transaction data is temporarily unavailable. Please try again later.';
    status.className = 'market-status error';
    metricRent.textContent = '—';
    metricDeposit.textContent = '—';
    metricContracts.textContent = '—';
    metricChange.textContent = '—';
    if (metricPerSqm) metricPerSqm.textContent = '—';
    if (dongList) dongList.innerHTML = '<div class="explorer-empty">Neighborhood data is unavailable.</div>';
    publishMapDongs([]);
    buildingList.innerHTML = '<div class="explorer-empty">We could not load building-level transaction data right now.</div>';
  } finally {
    if (request.isCurrent()) exploreButton.disabled = false;
  }
}

function applyQuerySelection() {
  const query = new URLSearchParams(location.search);
  const area = query.get('lawdCd');
  const type = query.get('type');
  const dong = query.get('dong') || '';
  const maxRent = query.get('maxRent') || '';
  const maxDeposit = query.get('maxDeposit') || '';
  if ([...areaSelect.options].some(option => option.value === area)) areaSelect.value = area;
  else areaSelect.value = 'all';
  if ([...typeSelect.options].some(option => option.value === type)) typeSelect.value = type;
  if (maxRentSelect && [...maxRentSelect.options].some(option => option.value === maxRent)) maxRentSelect.value = maxRent;
  if (maxDepositSelect && [...maxDepositSelect.options].some(option => option.value === maxDeposit)) maxDepositSelect.value = maxDeposit;
  currentDong = dong;
  currentBuildingKey = '';
  syncWorkspaceState();
  updateLanguageSwitch();
  updateRentCheckHandoff();
  return dong;
}

function showExploreResults({ requestedDong = '' } = {}) {
  explorerResults.hidden=false;
  setExplorerView(KHGExplorer.initialViewForWidth(window.innerWidth));
  updateRentCheckHandoff();
  updateFilterSummary();
  return loadArea({ requestedDong });
}

exploreButton.addEventListener('click', () => { void showExploreResults(); });
areaSelect.addEventListener('change',handleSelectionChange);
typeSelect.addEventListener('change',handleSelectionChange);
maxRentSelect.addEventListener('change',handleSelectionChange);
maxDepositSelect.addEventListener('change',handleSelectionChange);
if (buildingSort) buildingSort.addEventListener('change', () => {
  buildingVisibleCount = 10;
  if (currentData) renderBuildings(currentData.buildings || []);
});
if (buildingListMore) buildingListMore.addEventListener('click', () => {
  buildingVisibleCount += 10;
  if (currentData) renderBuildings(currentData.buildings || []);
});
if (sheetToggle) sheetToggle.addEventListener('click', () => {
  const expanded = !explorerResults.classList.contains('is-sheet-expanded');
  explorerResults.classList.toggle('is-sheet-expanded', expanded);
  sheetToggle.setAttribute('aria-expanded', String(expanded));
});
explorerViewButtons.forEach(button => button.addEventListener('click', () => setExplorerView(button.dataset.explorerView)));
if (mapSelectionClose) mapSelectionClose.addEventListener('click', () => {
  clearMapSelection();
});
if (explorerRailBack) explorerRailBack.addEventListener('click', () => {
  if (explorerLevel === 'buildings') returnToNeighborhoods();
  else returnToDistricts();
});
mapMetricButtons.forEach(button => button.addEventListener('click', () => updateMapMetric(button.dataset.mapMetric)));
mapHousingButtons.forEach(button => button.addEventListener('click', () => {
  const housing = String(button.dataset.mapHousing || '');
  if (![...typeSelect.options].some(option => option.value === housing)) return;
  typeSelect.value = housing;
  mapHousingButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  handleSelectionChange();
  void showExploreResults();
}));
if (explorerChangeFilters) explorerChangeFilters.addEventListener('click', () => {
  if (!explorerSearchCard) return;
  window.scrollTo({ top:Math.max(0, explorerSearchCard.offsetTop - 16), behavior:'smooth' });
  const areaInput = explorerSearchCard.querySelector('.district-combobox-input') || areaSelect;
  window.setTimeout(() => areaInput.focus(), 320);
});
if (currencySelect) currencySelect.addEventListener('change', () => {
  if (currentAreaData) renderDongs(currentAreaData.dongs || [], { publish:false });
  if (currentData) renderSummary(currentData, currentDong);
  if (currentMapSelection) renderMapSelection(currentMapSelection);
});
window.addEventListener('khg:map-select-dong', event => {
  const dong = String(event.detail && event.detail.dong || '');
  const model = event.detail && event.detail.model;
  if (!dong || !model) return;
  activateNeighborhood(model);
});
window.addEventListener('khg:map-select-district', event => {
  activateDistrict(event.detail && event.detail.districtCode);
});
window.addEventListener('khg:map-select-building', event => {
  if (mapSelection) mapSelection.hidden = true;
});
window.addEventListener('khg:map-back-neighborhoods', returnToNeighborhoods);
window.addEventListener('khg:building-window-state', event => {
  const detail = event.detail || {};
  currentBuildingKey = detail.open && detail.selection ? String(detail.selection.buildingKey || '') : '';
  syncWorkspaceState();
});
window.addEventListener('khg:map-viewport-change', event => {
  const detail = event.detail || {};
  if (detail.markerScope === 'building') {
    currentVisibleBuildingKeys = new Set(Array.isArray(detail.visibleBuildingKeys) ? detail.visibleBuildingKeys : []);
    if (currentData) renderBuildings(currentData.buildings || []);
    return;
  }
  currentVisibleDongs = new Set(Array.isArray(detail.visibleDongs) ? detail.visibleDongs : []);
  if (currentAreaData) renderDongs(currentAreaData.dongs || [], { publish:false });
});

function openBuildingFromRow(row) {
  if (!row || !currentData || !window.KHGExplorerBuildingWindow) return;
  const item = (currentData.buildings || []).find(building => building.buildingKey === row.dataset.buildingKey);
  if (!item) return;
  const selection = KHGExplorerBuildingWindow.selectionFromBuilding(item, {
    districtCode:currentData.districtCode || areaSelect.value,
    districtName:currentData.districtName || areaName(), propertyType:typeSelect.value, locale:'en'
  });
  currentBuildingKey = selection.buildingKey;
  syncWorkspaceState();
  window.dispatchEvent(new CustomEvent('khg:building-window-open', { detail:{ selection, trigger:row } }));
}
if (buildingList) {
  buildingList.addEventListener('click', event => {
    openBuildingFromRow(event.target.closest('.building-row[data-building-key]'));
  });
}
if (dongList) {
  dongList.addEventListener('click', event => {
    const card = event.target.closest('.neighborhood-card[data-dong]');
    if (!card) return;
    const dong = String(card.dataset.dong || '');
    const districtCode = String(card.dataset.districtCode || areaSelect.value);
    const item = (currentAreaData && currentAreaData.dongs || []).find(candidate =>
      String(candidate.dong || '') === dong && String(candidate.districtCode || areaSelect.value) === districtCode
    );
    activateNeighborhood({
      ...(item || {}), kind:'neighborhood', dong, districtCode,
      districtName:item && item.districtName || KHGLocations.districtLabel(districtCode, 'en'),
      propertyType:typeSelect.value
    });
  });
}
if (districtList) {
  districtList.addEventListener('click', event => {
    const card = event.target.closest('.district-card[data-district-code]');
    if (card) activateDistrict(card.dataset.districtCode);
  });
}

(async () => {
  const requestedDong = applyQuerySelection();
  await loadFx();
  await showExploreResults({ requestedDong });
})();
