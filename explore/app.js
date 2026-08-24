const areaSelect = document.querySelector('#exploreArea');
const typeSelect = document.querySelector('#exploreType');
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
const buildingList = document.querySelector('#buildingList');
let fxRates = {};
let currentData = null;

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">Not enough data</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'en-US');
}
function areaName() { return areaSelect.options[areaSelect.selectedIndex].text; }
function typeName() { return KHGExplorer.propertyTypeLabel(typeSelect.value); }
function formatArea(area) { return area == null ? '—' : `${Number(area).toFixed(1)}㎡`; }
function updateLanguageSwitch() { if (languageSwitch) languageSwitch.href = `/zh/explore/?${new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value }).toString()}`; }

function renderSummary(data) {
  currentData = data;
  title.textContent = `${data.districtName} · ${KHGExplorer.propertyTypeLabel(data.propertyType)}`;
  const summary = data.summary || {};
  metricRent.innerHTML = summary.medianMonthlyRentWon == null ? 'Not enough data' : moneyHtml(summary.medianMonthlyRentWon);
  metricDeposit.innerHTML = summary.medianDepositWon == null ? 'Not enough data' : moneyHtml(summary.medianDepositWon);
  metricContracts.textContent = Number(summary.totalContracts || 0).toLocaleString('en-US');
  const change = Number(summary.quarterChangePct);
  metricChange.textContent = Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 'Not enough data';
  dataThrough.textContent = summary.dataThroughMonth ? `Data through ${summary.dataThroughMonth}` : 'Latest completed months';
  renderBuildings(data.buildings || []);
  status.textContent = summary.totalContracts
    ? `Based on ${Number(summary.totalContracts).toLocaleString('en-US')} reported contracts from the latest ${summary.monthsUsed || 6} completed months.`
    : 'Not enough reported transactions were available for a reliable market summary.';
  status.className = `market-status ${summary.totalContracts ? 'success' : ''}`;
  updateLanguageSwitch();
}

function renderBuildings(buildings) {
  if (!buildings.length) {
    buildingList.innerHTML = '<div class="explorer-empty">No named buildings had reported contracts in this recent period.</div>';
    return;
  }
  buildingList.innerHTML = buildings.slice(0, 30).map(item => {
    const href = KHGExplorer.buildBuildingDetailUrl({ lawdCd:areaSelect.value, type:typeSelect.value, buildingKey:item.buildingKey });
    return `<article class="building-row">
      <div class="building-name"><strong>${item.buildingName}</strong><small>${areaName()} · ${typeName()}</small></div>
      <div><span class="mobile-label">Typical size</span><strong>${formatArea(item.typicalAreaSqm)}</strong></div>
      <div class="building-money"><span class="mobile-label">Monthly rent</span><strong>${item.medianMonthlyRentWon == null ? '—' : moneyHtml(item.medianMonthlyRentWon)}</strong></div>
      <div class="building-money"><span class="mobile-label">Deposit</span><strong>${item.medianDepositWon == null ? '—' : moneyHtml(item.medianDepositWon)}</strong></div>
      <div><span class="mobile-label">Contracts</span><strong>${Number(item.contractCount || 0).toLocaleString('en-US')}</strong></div>
      <a href="${href}">View building →</a>
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

async function loadArea() {
  status.textContent = 'Loading official rental transactions…';
  status.className = 'market-status loading';
  buildingList.innerHTML = '<div class="explorer-empty">Loading buildings…</div>';
  exploreButton.disabled = true;
  try {
    const params = new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value });
    const response = await fetch(`/api/explore-area?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Explorer data failed');
    renderSummary(data);
    history.replaceState(null, '', `/explore/?${params.toString()}`);
  } catch (_) {
    currentData = null;
    status.textContent = 'Official transaction data is temporarily unavailable. Please try again later.';
    status.className = 'market-status error';
    metricRent.textContent = '—';
    metricDeposit.textContent = '—';
    metricContracts.textContent = '—';
    metricChange.textContent = '—';
    buildingList.innerHTML = '<div class="explorer-empty">We could not load building-level transaction data right now.</div>';
  } finally {
    exploreButton.disabled = false;
  }
}

function applyQuerySelection() {
  const query = new URLSearchParams(location.search);
  const area = query.get('lawdCd');
  const type = query.get('type');
  if ([...areaSelect.options].some(option => option.value === area)) areaSelect.value = area;
  if ([...typeSelect.options].some(option => option.value === type)) typeSelect.value = type;
  updateLanguageSwitch();
}

exploreButton.addEventListener('click', loadArea);
areaSelect.addEventListener('change', loadArea);
typeSelect.addEventListener('change', loadArea);
document.querySelectorAll('[data-explore-area]').forEach(button => button.addEventListener('click', () => {
  areaSelect.value = button.dataset.exploreArea;
  loadArea();
}));
if (currencySelect) currencySelect.addEventListener('change', () => { if (currentData) renderSummary(currentData); });

(async () => {
  applyQuerySelection();
  await loadFx();
  await loadArea();
})();
