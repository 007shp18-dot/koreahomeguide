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

const LISTING_NOTE = '没有实时房源；这里展示的是历史真实签约数据。';

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">数据不足</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'zh-CN');
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function areaName() { return KHGLocations.districtLabel(areaSelect.value, 'zh-CN'); }
function typeName(type = typeSelect.value) { return KHGLocations.propertyTypeLabel(type, 'zh-CN'); }
function dongDisplayName(dong) { return KHGLocations.dongLabel(dong, 'zh-CN'); }
function dongDisplayHtml(dong) {
  const parts = KHGExplorer.localizedDongParts(dong, 'zh-CN');
  const korean = parts.korean ? `<span class="location-name-ko">（${escapeHtml(parts.korean)}）</span>` : '';
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
function filterDongsByBudget(items) {
  return KHGExplorer.filterDongsByBudget(items, budgetValues());
}
function updateBudgetNote(filteredCount, totalCount) {
  if (!budgetFilterNote) return;
  budgetFilterNote.textContent = hasBudgetFilter()
    ? `${totalCount} 个街区中有 ${filteredCount} 个符合所选月租/押金中位数条件`
    : '选择街区后查看具体建筑';
}
function publishMapDongs(dongs) {
  window.dispatchEvent(new CustomEvent('khg:explorer-dongs', { detail:{ lawdCd:areaSelect.value, propertyType:typeSelect.value, locale:'zh-CN', limits:budgetValues(), dongs:Array.isArray(dongs) ? dongs : [] } }));
}
function publishMapBuildings(dong, buildings, lawdCd = areaSelect.value) {
  window.dispatchEvent(new CustomEvent('khg:explorer-buildings', { detail:{ lawdCd:String(lawdCd || areaSelect.value), propertyType:typeSelect.value, locale:'zh-CN', limits:budgetValues(), dong:String(dong || ''), buildings:Array.isArray(buildings) ? buildings : [] } }));
}
function currentParams(includeDong = true) {
  const params = new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value });
  const { maxRent, maxDeposit } = budgetValues();
  if (maxRent) params.set('maxRent', String(maxRent));
  if (maxDeposit) params.set('maxDeposit', String(maxDeposit));
  if (includeDong && currentDong) params.set('dong', currentDong);
  return params;
}
function updateLanguageSwitch() { if (languageSwitch) languageSwitch.href = `/explore/?${currentParams(true).toString()}`; }

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
}

function renderMapSelection(model) {
  if (!mapSelection || !model || !model.dong) return;
  currentMapSelection = model;
  const evidenceCount = Number(model.evidenceCount || 0);
  const totalCount = Number(model.contractCount || 0);
  const isBuilding = model.kind === 'building';
  const statusCopy = model.budgetStatus === 'outside'
    ? '超出所选预算'
    : model.evidenceLevel === 'strong' ? '较强依据' : '有限依据';
  mapSelectionStatus.textContent = statusCopy;
  mapSelectionStatus.className = `explorer-map-selection-status is-${model.tone || 'limited'}`;
  mapSelectionName.innerHTML = isBuilding
    ? `<span>${escapeHtml(model.label || model.buildingName)}</span>${model.secondaryLabel ? `<small class="building-official-name">${escapeHtml(model.secondaryLabel)}</small>` : ''}`
    : dongDisplayHtml(model.dong);
  mapSelectionContracts.textContent = model.budgetStatus === 'unfiltered'
    ? `${totalCount.toLocaleString('zh-CN')} 笔申报成交`
    : `${evidenceCount.toLocaleString('zh-CN')} 笔符合预算的成交`;
  mapSelectionRent.innerHTML = model.rentWon == null ? '—' : moneyHtml(model.rentWon);
  mapSelectionDeposit.innerHTML = model.depositWon == null ? '—' : moneyHtml(model.depositWon);
  mapSelectionEvidence.textContent = isBuilding
    ? `该标记代表经过核验的建筑位置和 ${evidenceCount.toLocaleString('zh-CN')} 笔相关历史合同，并非具体可租单元或实时房源。`
    : model.budgetStatus === 'outside'
    ? `近期价格条件没有同时符合全部预算限制。上方数值是该街区 ${totalCount.toLocaleString('zh-CN')} 笔申报成交的较宽市场参考。`
    : model.evidenceLevel === 'strong'
      ? `由 ${evidenceCount.toLocaleString('zh-CN')} 笔相关申报成交支持。这是历史市场参考，并非实时房源。`
      : `只有 ${evidenceCount.toLocaleString('zh-CN')} 笔相关申报成交支持这个标记，请将其视为方向性参考。`;
  if (mapSelectionDetail) {
    if (isBuilding) {
      mapSelectionDetail.href = KHGExplorer.buildBuildingDetailUrl({ lawdCd:model.districtCode, type:model.propertyType, dong:model.dong, buildingKey:model.buildingKey });
      mapSelectionDetail.textContent = '查看建筑详情 →';
    } else {
      const detailLang = KHGExplorer.supportsZhIndexing(model.districtCode) ? 'zh' : 'en';
      mapSelectionDetail.href = KHGExplorer.buildDongSeoUrl({ lawdCd:model.districtCode, type:model.propertyType, dong:model.dong, lang:detailLang });
      mapSelectionDetail.textContent = '查看街区详情 →';
    }
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
    dongList.innerHTML = '<div class="explorer-empty">没有街区的月租和押金中位数同时符合当前预算。请提高月租或押金预算后再试。</div>';
    return;
  }
  if (!items.length) {
    dongList.innerHTML = '<div class="explorer-empty">当前条件下暂时没有可用的街区摘要。</div>';
    return;
  }
  dongList.innerHTML = items.map(item => {
    const districtCode = item.districtCode || areaSelect.value;
    const districtName = KHGLocations.districtLabel(districtCode, 'zh-CN') || item.districtName;
    const isAllSeoul = areaSelect.value === 'all';
    const band = representativeBand(item);
    const rentValue = band ? band.medianMonthlyRentWon : (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon);
    const depositValue = band ? band.medianDepositWon : (item.contextualMedianDepositWon ?? item.medianDepositWon);
    const rent = rentValue == null ? '—' : moneyHtml(rentValue);
    const deposit = depositValue == null ? '—' : moneyHtml(depositValue);
    const linkLang = KHGExplorer.supportsZhIndexing(districtCode) ? 'zh' : 'en';
    const seoHref = KHGExplorer.buildDongSeoUrl({ lawdCd:districtCode, type:typeSelect.value, dong:item.dong, lang:linkLang });
    return `<a class="neighborhood-card" data-dong="${escapeHtml(item.dong)}" href="${escapeHtml(seoHref)}">
      <span class="neighborhood-card-main"><strong>${dongDisplayHtml(item.dong)}</strong><small>${isAllSeoul ? `${escapeHtml(districtName)} · ` : ''}${Number(item.contractCount || 0).toLocaleString('zh-CN')} 笔近期成交</small></span>
      <span class="neighborhood-card-metric"><small>参考月租</small><strong>${rent}</strong></span>
      <span class="neighborhood-card-metric"><small>参考押金</small><strong>${deposit}</strong></span>
      <span class="neighborhood-card-cta">查看街区 →</span>
    </a>`;
  }).join('');
}

function renderSummary(data, dong = '') {
  currentData = data;
  currentDong = dong || '';
  const selectedAreaName = areaSelect.value === 'all'
    ? (data.districtName === 'All supported Seoul' ? '全首尔支持地区' : data.districtName)
    : areaName();
  title.innerHTML = currentDong
    ? `${escapeHtml(selectedAreaName)} · ${dongDisplayHtml(currentDong)} · ${escapeHtml(typeName(data.propertyType || typeSelect.value))}`
    : `${escapeHtml(selectedAreaName)} · ${escapeHtml(typeName(data.propertyType || typeSelect.value))}`;
  const summary = data.summary || {};
  const rentValue = summary.medianMonthlyRentWon;
  const depositValue = summary.medianDepositWon;
  metricRent.innerHTML = rentValue == null ? '数据不足' : moneyHtml(rentValue);
  metricDeposit.innerHTML = depositValue == null ? '数据不足' : moneyHtml(depositValue);
  metricContracts.textContent = Number(summary.totalContracts || summary.contractCount || 0).toLocaleString('zh-CN');
  const change = Number(summary.quarterChangePct);
  metricChange.textContent = Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '数据不足';
  dataThrough.textContent = summary.dataThroughMonth ? `数据截至 ${KHGDate.formatMonth(summary.dataThroughMonth, 'zh-CN')}` : '最近已完成月份';
  renderBuildings(data.buildings || []);
  const count = Number(summary.totalContracts || summary.contractCount || 0);
  status.textContent = count
    ? `基于最近 ${summary.monthsUsed || 6} 个完整月份${currentDong ? `中 ${dongDisplayName(currentDong)}` : ''}的 ${count.toLocaleString('zh-CN')} 笔官方申报合同。${LISTING_NOTE}`
    : '近期官方申报交易不足，暂时无法形成可靠的市场参考。';
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
    buildingList.innerHTML = '<div class="explorer-empty">近期官方数据中没有可识别名称的建筑。</div>';
    return;
  }
  buildingList.innerHTML = buildings.slice(0, 30).map(item => {
    const dong = item.dong || currentDong;
    const interactiveParams = new URLSearchParams({ lawdCd:currentData && currentData.districtCode || areaSelect.value, type:typeSelect.value });
    if (dong) interactiveParams.set('dong', dong);
    interactiveParams.set('buildingKey', item.buildingKey);
    const interactiveHref = `/zh/explore/building/?${interactiveParams.toString()}`;
    const location = [dong ? dongDisplayName(dong) : '', areaName(), typeName()].filter(Boolean).join(' · ');
    const nameDisplay = KHGBuildingNames.getBuildingNameDisplay(item.buildingName, 'zh');
    return `<article class="building-row">
      <div class="building-name"><strong>${escapeHtml(nameDisplay.primary)}</strong>${nameDisplay.secondary ? `<small class="building-official-name">${escapeHtml(nameDisplay.secondary)}</small>` : ''}<small>${escapeHtml(location)}</small></div>
      <div><span class="mobile-label">典型面积</span><strong>${formatArea(item.typicalAreaSqm)}</strong></div>
      ${(() => { const band = representativeBand(item); const rentValue = band ? band.medianMonthlyRentWon : (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon); const depositValue = band ? band.medianDepositWon : (item.contextualMedianDepositWon ?? item.medianDepositWon); return `<div class="building-money"><span class="mobile-label">参考月租</span><strong>${rentValue == null ? '—' : moneyHtml(rentValue)}</strong></div><div class="building-money"><span class="mobile-label">参考押金</span><strong>${depositValue == null ? '—' : moneyHtml(depositValue)}</strong></div>`; })()}
      <div><span class="mobile-label">成交</span><strong>${Number(item.contractCount || 0).toLocaleString('zh-CN')}</strong></div>
      <div class="building-actions"><a rel="nofollow" href="${escapeHtml(interactiveHref)}">查看建筑成交 →</a></div>
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

function setLoading(message = '正在加载官方租赁成交数据…') {
  status.textContent = message;
  status.className = 'market-status loading';
  buildingList.innerHTML = '<div class="explorer-empty">正在加载建筑…</div>';
  clearMapSelection();
  exploreButton.disabled = true;
}

async function loadDong(dong, { showBuildingsOnMap = false, lawdCd = areaSelect.value } = {}) {
  currentDong = String(dong || '').trim();
  if (!currentDong) return;
  setLoading(`正在加载 ${dongDisplayName(currentDong)} 的官方租赁成交数据…`);
  updateLanguageSwitch();
  try {
    const params = currentParams(true);
    params.set('lawdCd', String(lawdCd || areaSelect.value));
    const response = await fetch(`/api/explore-dong?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Neighborhood data failed');
    renderSummary(data, data.dong || currentDong);
    if (showBuildingsOnMap) publishMapBuildings(data.dong || currentDong, data.buildings || [], data.districtCode || lawdCd);
    history.replaceState(null, '', `/zh/explore/?${currentParams(false).toString()}`);
  } catch (_) {
    status.textContent = '该街区的官方成交数据暂时无法加载，请稍后再试。';
    status.className = 'market-status error';
    buildingList.innerHTML = '<div class="explorer-empty">目前无法加载该街区的建筑成交数据。</div>';
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
    history.replaceState(null, '', `/zh/explore/?${currentParams(false).toString()}`);
  } catch (_) {
    currentAreaData = null;
    currentData = null;
    currentDong = '';
    status.textContent = '官方成交数据暂时无法加载，请稍后再试。';
    status.className = 'market-status error';
    metricRent.textContent = '—';
    metricDeposit.textContent = '—';
    metricContracts.textContent = '—';
    metricChange.textContent = '—';
    if (dongList) dongList.innerHTML = '<div class="explorer-empty">街区数据暂时不可用。</div>';
    publishMapDongs([]);
    buildingList.innerHTML = '<div class="explorer-empty">目前无法加载建筑级成交数据。</div>';
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

function showExploreResults() {
  explorerChips.hidden=false;
  explorerResults.hidden=false;
  setExplorerView('map');
  updateRentCheckHandoff();
  return loadArea();
}

exploreButton.addEventListener('click',showExploreResults);
areaSelect.addEventListener('change',handleSelectionChange);
typeSelect.addEventListener('change',handleSelectionChange);
maxRentSelect.addEventListener('change',handleSelectionChange);
maxDepositSelect.addEventListener('change',handleSelectionChange);
explorerViewButtons.forEach(button => button.addEventListener('click', () => setExplorerView(button.dataset.explorerView)));
if (mapSelectionClose) mapSelectionClose.addEventListener('click', clearMapSelection);
document.querySelectorAll('[data-explore-area]').forEach(button => button.addEventListener('click', () => {
  areaSelect.value = button.dataset.exploreArea;
  handleSelectionChange();
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
    history.replaceState(null, '', `/zh/explore/?${currentParams(false).toString()}`);
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
  applyQuerySelection();
  await loadFx();
})();
