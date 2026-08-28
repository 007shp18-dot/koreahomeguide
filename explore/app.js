const areaSelect = document.querySelector('#exploreArea');
const typeSelect = document.querySelector('#exploreType');
const maxRentSelect = document.querySelector('#exploreMaxRent');
const maxDepositSelect = document.querySelector('#exploreMaxDeposit');
const exploreButton = document.querySelector('#exploreButton');
const currencySelect = document.querySelector('#currencySelect');
const languageSwitch = document.querySelector('#languageSwitch');
const title = document.querySelector('#explorerTitle');
const status = document.querySelector('#explorerStatus');
const dataThrough = document.querySelector('#explorerDataThrough');
const metricRent = document.querySelector('#metricRent');
const metricDeposit = document.querySelector('#metricDeposit');
const metricContracts = document.querySelector('#metricContracts');
const metricChange = document.querySelector('#metricChange');
const dongList = document.querySelector('#dongList');
const buildingList = document.querySelector('#buildingList');
const budgetFilterNote = document.querySelector('#budgetFilterNote');
const explorerChips = document.querySelector('#explorerChips');
const explorerResults = document.querySelector('#explorerResultsShell');
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
let fxRates = {};
let currentAreaData = null;
let currentData = null;
let currentDong = '';
let currentMapSelection = null;

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
function budgetValues() {
  return {
    maxRent:Number(maxRentSelect && maxRentSelect.value || 0),
    maxDeposit:Number(maxDepositSelect && maxDepositSelect.value || 0)
  };
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

function clearMapSelection() {
  currentMapSelection = null;
  if (mapSelection) mapSelection.hidden = true;
  highlightMapCard('');
  window.dispatchEvent(new CustomEvent('khg:map-clear-selection'));
}

function handleSelectionChange() {
  clearMapSelection();
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
    mapSelectionDetail.textContent = isBuilding ? 'Open building details →' : 'View neighborhood details →';
  }
  mapSelection.hidden = false;
  highlightMapCard(model.dong);
  updateRentCheckHandoff({ lawdCd:model.districtCode, propertyType:model.propertyType });
}


function representativeBand(item) {
  return KHGExplorer.budgetFitForDong(item, budgetValues()).representativeBand;
}

function renderDongs(dongs) {
  if (!dongList) return;
  const allItems = Array.isArray(dongs) ? dongs : [];
  const items = filterDongsByBudget(allItems);
  updateBudgetNote(items.length, allItems.length);
  publishMapDongs(allItems);
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
    return `<a class="neighborhood-card" data-dong="${escapeHtml(item.dong)}" href="${escapeHtml(seoHref)}">
      <span class="neighborhood-card-main"><strong>${dongDisplayHtml(item.dong)}</strong><small>${isAllSeoul ? `${escapeHtml(districtName)} · ` : ''}${Number(item.contractCount || 0).toLocaleString('en-US')} recent contracts</small></span>
      <span class="neighborhood-card-metric"><small>Rent context</small><strong>${rent}</strong></span>
      <span class="neighborhood-card-metric"><small>Deposit context</small><strong>${deposit}</strong></span>
      <span class="neighborhood-card-cta">View neighborhood →</span>
    </a>`;
  }).join('');
}

function renderSummary(data, dong = '') {
  currentData = data;
  currentDong = dong || '';
  const selectedAreaName = areaSelect.value === 'all' ? data.districtName : areaName();
  title.innerHTML = currentDong
    ? `${escapeHtml(selectedAreaName)} · ${dongDisplayHtml(currentDong)} · ${escapeHtml(typeName(data.propertyType || typeSelect.value))}`
    : `${escapeHtml(selectedAreaName)} · ${escapeHtml(typeName(data.propertyType || typeSelect.value))}`;
  const summary = data.summary || {};
  const rentValue = summary.medianMonthlyRentWon;
  const depositValue = summary.medianDepositWon;
  metricRent.innerHTML = rentValue == null ? 'Not enough data' : moneyHtml(rentValue);
  metricDeposit.innerHTML = depositValue == null ? 'Not enough data' : moneyHtml(depositValue);
  metricContracts.textContent = Number(summary.totalContracts || summary.contractCount || 0).toLocaleString('en-US');
  const change = Number(summary.quarterChangePct);
  metricChange.textContent = Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 'Not enough data';
  dataThrough.textContent = summary.dataThroughMonth ? `Data through ${KHGDate.formatMonth(summary.dataThroughMonth, 'en-US')}` : 'Latest completed months';
  renderBuildings(data.buildings || []);
  const count = Number(summary.totalContracts || summary.contractCount || 0);
  status.textContent = count
    ? `Based on ${count.toLocaleString('en-US')} reported contracts${currentDong ? ` in ${dongDisplayName(currentDong)}` : ''} from the latest ${summary.monthsUsed || 6} completed months.`
    : 'Not enough reported transactions were available for a reliable market summary.';
  status.className = `market-status ${count ? 'success' : ''}`;
  if (currentAreaData) renderDongs(currentAreaData.dongs || []);
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
  if (!buildings.length) {
    buildingList.innerHTML = '<div class="explorer-empty">No named buildings had reported contracts in this recent period.</div>';
    return;
  }
  buildingList.innerHTML = buildings.slice(0, 30).map(item => {
    const dong = item.dong || currentDong;
    const interactiveHref = KHGExplorer.buildBuildingDetailUrl({ lawdCd:currentData && currentData.districtCode || areaSelect.value, type:typeSelect.value, dong, buildingKey:item.buildingKey });
    const location = [dongDisplayName(dong), areaName(), typeName()].filter(Boolean).join(' · ');
    const nameDisplay = KHGBuildingNames.getBuildingNameDisplay(item.buildingName, 'en');
    return `<article class="building-row">
      <div class="building-name"><strong>${escapeHtml(nameDisplay.primary)}</strong>${nameDisplay.secondary ? `<small class="building-official-name">${escapeHtml(nameDisplay.secondary)}</small>` : ''}<small>${escapeHtml(location)}</small></div>
      <div><span class="mobile-label">Typical size</span><strong>${formatArea(item.typicalAreaSqm)}</strong></div>
      ${(() => { const band = representativeBand(item); const rentValue = band ? band.medianMonthlyRentWon : (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon); const depositValue = band ? band.medianDepositWon : (item.contextualMedianDepositWon ?? item.medianDepositWon); return `<div class="building-money"><span class="mobile-label">Rent context</span><strong>${rentValue == null ? '—' : moneyHtml(rentValue)}</strong></div><div class="building-money"><span class="mobile-label">Deposit context</span><strong>${depositValue == null ? '—' : moneyHtml(depositValue)}</strong></div>`; })()}
      <div><span class="mobile-label">Contracts</span><strong>${Number(item.contractCount || 0).toLocaleString('en-US')}</strong></div>
      <div class="building-actions"><a rel="nofollow" href="${escapeHtml(interactiveHref)}">Open building details →</a></div>
    </article>`;
  }).join('');
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

async function loadDong(dong, { showBuildingsOnMap = false, lawdCd = areaSelect.value } = {}) {
  currentDong = String(dong || '').trim();
  if (!currentDong) return;
  setLoading(`Loading ${dongDisplayName(currentDong)} official rental transactions…`);
  updateLanguageSwitch();
  try {
    const params = currentParams(true);
    params.set('lawdCd', String(lawdCd || areaSelect.value));
    const response = await fetch(`/api/explore-dong?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Neighborhood data failed');
    renderSummary(data, data.dong || currentDong);
    if (showBuildingsOnMap) publishMapBuildings(data.dong || currentDong, data.buildings || [], data.districtCode || lawdCd);
    history.replaceState(null, '', `/explore/?${currentParams(false).toString()}`);
  } catch (_) {
    status.textContent = 'Official transaction data for this neighborhood is temporarily unavailable.';
    status.className = 'market-status error';
    buildingList.innerHTML = '<div class="explorer-empty">We could not load neighborhood building data right now.</div>';
  } finally {
    exploreButton.disabled = false;
  }
}

async function loadArea({ requestedDong = '' } = {}) {
  currentDong = String(requestedDong || '').trim();
  setLoading();
  try {
    const apiParams = new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value });
    const isAllSeoul = areaSelect.value === 'all';
    const endpoint = isAllSeoul
      ? `/api/explore-seoul?type=${encodeURIComponent(typeSelect.value)}`
      : `/api/explore-area?${apiParams.toString()}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Explorer data failed');
    currentAreaData = data;
    renderDongs(data.dongs || []);
    const hasRequestedDong = !isAllSeoul && currentDong && (data.dongs || []).some(item => item.dong === currentDong);
    if (hasRequestedDong) {
      await loadDong(currentDong);
      return;
    }
    currentDong = '';
    renderSummary(data, '');
    history.replaceState(null, '', `/explore/?${currentParams(false).toString()}`);
  } catch (_) {
    currentAreaData = null;
    currentData = null;
    currentDong = '';
    status.textContent = 'Official transaction data is temporarily unavailable. Please try again later.';
    status.className = 'market-status error';
    metricRent.textContent = '—';
    metricDeposit.textContent = '—';
    metricContracts.textContent = '—';
    metricChange.textContent = '—';
    if (dongList) dongList.innerHTML = '<div class="explorer-empty">Neighborhood data is unavailable.</div>';
    publishMapDongs([]);
    buildingList.innerHTML = '<div class="explorer-empty">We could not load building-level transaction data right now.</div>';
  } finally {
    exploreButton.disabled = false;
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
  if ([...typeSelect.options].some(option => option.value === type)) typeSelect.value = type;
  if (maxRentSelect && [...maxRentSelect.options].some(option => option.value === maxRent)) maxRentSelect.value = maxRent;
  if (maxDepositSelect && [...maxDepositSelect.options].some(option => option.value === maxDeposit)) maxDepositSelect.value = maxDeposit;
  currentDong = dong;
  updateLanguageSwitch();
  updateRentCheckHandoff();
  return dong;
}

function showExploreResults({ requestedDong = '' } = {}) {
  explorerChips.hidden=false;
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
explorerViewButtons.forEach(button => button.addEventListener('click', () => setExplorerView(button.dataset.explorerView)));
if (mapSelectionClose) mapSelectionClose.addEventListener('click', clearMapSelection);
if (explorerChangeFilters) explorerChangeFilters.addEventListener('click', () => {
  if (!explorerSearchCard) return;
  window.scrollTo({ top:Math.max(0, explorerSearchCard.offsetTop - 16), behavior:'smooth' });
  const areaInput = explorerSearchCard.querySelector('.district-combobox-input') || areaSelect;
  window.setTimeout(() => areaInput.focus(), 320);
});
document.querySelectorAll('[data-explore-area]').forEach(button => button.addEventListener('click', () => {
  areaSelect.value = button.dataset.exploreArea;
  areaSelect.dispatchEvent(new Event('change',{bubbles:true}));
  loadArea();
}));
if (currencySelect) currencySelect.addEventListener('change', () => {
  if (currentAreaData) renderDongs(currentAreaData.dongs || []);
  if (currentData) renderSummary(currentData, currentDong);
  if (currentMapSelection) renderMapSelection(currentMapSelection);
});
window.addEventListener('khg:map-select-dong', event => {
  const dong = String(event.detail && event.detail.dong || '');
  const model = event.detail && event.detail.model;
  if (!dong || !model) return;
  highlightMapCard(model.dong);
  renderMapSelection(model);
  const snapshot = areaSelect.value !== 'all' && KHGExplorer.areaSnapshotForDong(currentAreaData, dong);
  if (snapshot) {
    renderSummary(snapshot, dong);
    publishMapBuildings(dong, snapshot.buildings || [], model.districtCode);
    history.replaceState(null, '', `/explore/?${currentParams(false).toString()}`);
  } else if (currentDong === dong && currentData && Array.isArray(currentData.buildings)) {
    publishMapBuildings(dong, currentData.buildings, model.districtCode);
  } else {
    void loadDong(dong, { showBuildingsOnMap:true, lawdCd:model.districtCode });
  }
});
window.addEventListener('khg:map-select-building', event => {
  const model = event.detail && event.detail.model;
  if (model) renderMapSelection(model);
});
window.addEventListener('khg:map-back-neighborhoods', clearMapSelection);

(async () => {
  const requestedDong = applyQuerySelection();
  await loadFx();
  if (requestedDong) await showExploreResults({ requestedDong });
})();
