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
let fxRates = {};
let currentAreaData = null;
let currentData = null;
let currentDong = '';

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">Not enough data</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'en-US');
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function areaName() { return areaSelect.options[areaSelect.selectedIndex].text; }
function typeName() { return KHGExplorer.propertyTypeLabel(typeSelect.value); }
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
    ? `${filteredCount} of ${totalCount} neighborhoods fit the selected median-rent/deposit limits`
    : 'Choose a neighborhood to see buildings';
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


function representativeBand(item) {
  const bands = Array.isArray(item && item.depositBands) ? item.depositBands : [];
  if (!bands.length) return null;
  const { maxRent, maxDeposit } = budgetValues();
  const matches = bands.filter(band => {
    const rent = Number(band.medianMonthlyRentWon);
    const deposit = Number(band.medianDepositWon);
    if (maxRent && (!Number.isFinite(rent) || rent > maxRent)) return false;
    if (maxDeposit && (!Number.isFinite(deposit) || deposit > maxDeposit)) return false;
    return true;
  });
  const pool = matches.length ? matches : bands;
  return [...pool].sort((a,b) => Number(b.count || 0) - Number(a.count || 0))[0] || null;
}

function renderDongs(dongs) {
  if (!dongList) return;
  const allItems = Array.isArray(dongs) ? dongs : [];
  const items = filterDongsByBudget(allItems);
  updateBudgetNote(items.length, allItems.length);
  if (hasBudgetFilter() && !items.length) {
    dongList.innerHTML = '<div class="explorer-empty">No neighborhood median fits both selected budget limits. Try a higher rent or deposit budget.</div>';
    return;
  }
  if (!items.length) {
    dongList.innerHTML = '<div class="explorer-empty">No neighborhood summary is available for this selection yet.</div>';
    return;
  }
  dongList.innerHTML = items.map(item => {
    const band = representativeBand(item);
    const rentValue = band ? band.medianMonthlyRentWon : (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon);
    const depositValue = band ? band.medianDepositWon : (item.contextualMedianDepositWon ?? item.medianDepositWon);
    const rent = rentValue == null ? '—' : moneyHtml(rentValue);
    const deposit = depositValue == null ? '—' : moneyHtml(depositValue);
    const seoHref = KHGExplorer.buildDongSeoUrl({ lawdCd:areaSelect.value, type:typeSelect.value, dong:item.dong, lang:'en' });
    return `<a class="neighborhood-card" href="${escapeHtml(seoHref)}">
      <span class="neighborhood-card-main"><strong>${escapeHtml(item.dong)}</strong><small>${Number(item.contractCount || 0).toLocaleString('en-US')} recent contracts</small></span>
      <span class="neighborhood-card-metric"><small>Rent context</small><strong>${rent}</strong></span>
      <span class="neighborhood-card-metric"><small>Deposit context</small><strong>${deposit}</strong></span>
      <span class="neighborhood-card-cta">View neighborhood →</span>
    </a>`;
  }).join('');
}

function renderSummary(data, dong = '') {
  currentData = data;
  currentDong = dong || '';
  const district = data.districtName || areaName();
  title.textContent = [district, currentDong, KHGExplorer.propertyTypeLabel(data.propertyType || typeSelect.value)].filter(Boolean).join(' · ');
  const summary = data.summary || {};
  const band = representativeBand(summary);
  const rentValue = band ? band.medianMonthlyRentWon : (summary.contextualMedianMonthlyRentWon ?? summary.medianMonthlyRentWon);
  const depositValue = band ? band.medianDepositWon : (summary.contextualMedianDepositWon ?? summary.medianDepositWon);
  metricRent.innerHTML = rentValue == null ? 'Not enough data' : moneyHtml(rentValue);
  metricDeposit.innerHTML = depositValue == null ? 'Not enough data' : moneyHtml(depositValue);
  metricContracts.textContent = Number(summary.totalContracts || summary.contractCount || 0).toLocaleString('en-US');
  const change = Number(summary.quarterChangePct);
  metricChange.textContent = Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 'Not enough data';
  dataThrough.textContent = summary.dataThroughMonth ? `Data through ${KHGDate.formatMonth(summary.dataThroughMonth, 'en-US')}` : 'Latest completed months';
  renderBuildings(data.buildings || []);
  const count = Number(summary.totalContracts || summary.contractCount || 0);
  status.textContent = count
    ? `Based on ${count.toLocaleString('en-US')} reported contracts${currentDong ? ` in ${currentDong}` : ''} from the latest ${summary.monthsUsed || 6} completed months.`
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
    const interactiveHref = KHGExplorer.buildBuildingDetailUrl({ lawdCd:areaSelect.value, type:typeSelect.value, dong, buildingKey:item.buildingKey });
    const seoHref = KHGExplorer.buildBuildingSeoUrl({ lawdCd:areaSelect.value, type:typeSelect.value, dong, buildingName:item.buildingName, buildingKey:item.buildingKey, lang:'en' });
    const location = [dong, areaName(), typeName()].filter(Boolean).join(' · ');
    const nameDisplay = KHGBuildingNames.getBuildingNameDisplay(item.buildingName, 'en');
    return `<article class="building-row">
      <div class="building-name"><strong>${escapeHtml(nameDisplay.primary)}</strong>${nameDisplay.secondary ? `<small class="building-official-name">${escapeHtml(nameDisplay.secondary)}</small>` : ''}<small>${escapeHtml(location)}</small></div>
      <div><span class="mobile-label">Typical size</span><strong>${formatArea(item.typicalAreaSqm)}</strong></div>
      ${(() => { const band = representativeBand(item); const rentValue = band ? band.medianMonthlyRentWon : (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon); const depositValue = band ? band.medianDepositWon : (item.contextualMedianDepositWon ?? item.medianDepositWon); return `<div class="building-money"><span class="mobile-label">Rent context</span><strong>${rentValue == null ? '—' : moneyHtml(rentValue)}</strong></div><div class="building-money"><span class="mobile-label">Deposit context</span><strong>${depositValue == null ? '—' : moneyHtml(depositValue)}</strong></div>`; })()}
      <div><span class="mobile-label">Contracts</span><strong>${Number(item.contractCount || 0).toLocaleString('en-US')}</strong></div>
      <div class="building-actions"><a href="${escapeHtml(seoHref)}">Building page →</a><a class="secondary" href="${escapeHtml(interactiveHref)}">Interactive view</a></div>
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
  exploreButton.disabled = true;
}

async function loadDong(dong) {
  currentDong = String(dong || '').trim();
  if (!currentDong) return;
  setLoading(`Loading ${currentDong} official rental transactions…`);
  updateLanguageSwitch();
  try {
    const params = currentParams(true);
    const response = await fetch(`/api/explore-dong?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Neighborhood data failed');
    renderSummary(data, data.dong || currentDong);
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
    const response = await fetch(`/api/explore-area?${apiParams.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Explorer data failed');
    currentAreaData = data;
    renderDongs(data.dongs || []);
    const hasRequestedDong = currentDong && (data.dongs || []).some(item => item.dong === currentDong);
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
  return dong;
}

exploreButton.addEventListener('click', () => loadArea());
areaSelect.addEventListener('change', () => loadArea());
typeSelect.addEventListener('change', () => loadArea());
if (maxRentSelect) maxRentSelect.addEventListener('change', () => loadArea());
if (maxDepositSelect) maxDepositSelect.addEventListener('change', () => loadArea());
document.querySelectorAll('[data-explore-area]').forEach(button => button.addEventListener('click', () => {
  areaSelect.value = button.dataset.exploreArea;
  loadArea();
}));
if (currencySelect) currencySelect.addEventListener('change', () => {
  if (currentAreaData) renderDongs(currentAreaData.dongs || []);
  if (currentData) renderSummary(currentData, currentDong);
});

(async () => {
  const requestedDong = applyQuerySelection();
  await loadFx();
  await loadArea({ requestedDong });
})();
