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

const DISTRICT_NAMES = { '11680':'江南区', '11440':'麻浦区', '11170':'龙山区', '11200':'城东区', '11560':'永登浦区' };
const TYPE_NAMES = { apartment:'公寓', officetel:'Officetel', villa:'Villa / 多户住宅' };
const LISTING_NOTE = '没有实时房源；这里展示的是历史真实签约数据。';

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">数据不足</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'zh-CN');
}
function areaName() { return DISTRICT_NAMES[areaSelect.value] || areaSelect.options[areaSelect.selectedIndex].text; }
function typeName(type = typeSelect.value) { return TYPE_NAMES[type] || KHGExplorer.propertyTypeLabel(type); }
function formatArea(area) { return area == null ? '—' : `${Number(area).toFixed(1)}㎡`; }
function currentParams() { return new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value }); }
function updateLanguageSwitch() { if (languageSwitch) languageSwitch.href = `/explore/?${currentParams().toString()}`; }

function renderSummary(data) {
  currentData = data;
  title.textContent = `${areaName()} · ${typeName(data.propertyType)}`;
  const summary = data.summary || {};
  metricRent.innerHTML = summary.medianMonthlyRentWon == null ? '数据不足' : moneyHtml(summary.medianMonthlyRentWon);
  metricDeposit.innerHTML = summary.medianDepositWon == null ? '数据不足' : moneyHtml(summary.medianDepositWon);
  metricContracts.textContent = Number(summary.totalContracts || 0).toLocaleString('zh-CN');
  const change = Number(summary.quarterChangePct);
  metricChange.textContent = Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '数据不足';
  dataThrough.textContent = summary.dataThroughMonth ? `数据截至 ${KHGDate.formatMonth(summary.dataThroughMonth, 'zh-CN')}` : '最近已完成月份';
  renderBuildings(data.buildings || []);
  status.textContent = summary.totalContracts
    ? `基于最近 ${summary.monthsUsed || 6} 个完整月份的 ${Number(summary.totalContracts).toLocaleString('zh-CN')} 笔官方申报成交。`
    : '可用的官方申报成交太少，暂时无法形成可靠的市场概览。';
  status.className = `market-status ${summary.totalContracts ? 'success' : ''}`;
  updateLanguageSwitch();
}

function renderBuildings(buildings) {
  if (!buildings.length) {
    buildingList.innerHTML = `<div class="explorer-empty">近期没有带明确建筑名称的申报成交。${LISTING_NOTE}</div>`;
    return;
  }
  buildingList.innerHTML = buildings.slice(0, 30).map(item => {
    const params = new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value, buildingKey:item.buildingKey });
    const href = `/zh/explore/building/?${params.toString()}`;
    return `<article class="building-row">
      <div class="building-name"><strong>${item.buildingName}</strong><small>${areaName()} · ${typeName()}</small></div>
      <div><span class="mobile-label">典型面积</span><strong>${formatArea(item.typicalAreaSqm)}</strong></div>
      <div class="building-money"><span class="mobile-label">月租</span><strong>${item.medianMonthlyRentWon == null ? '—' : moneyHtml(item.medianMonthlyRentWon)}</strong></div>
      <div class="building-money"><span class="mobile-label">押金</span><strong>${item.medianDepositWon == null ? '—' : moneyHtml(item.medianDepositWon)}</strong></div>
      <div><span class="mobile-label">成交</span><strong>${Number(item.contractCount || 0).toLocaleString('zh-CN')}</strong></div>
      <a href="${href}">查看建筑 →</a>
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
  status.textContent = '正在加载官方租赁成交数据…';
  status.className = 'market-status loading';
  buildingList.innerHTML = '<div class="explorer-empty">正在加载建筑…</div>';
  exploreButton.disabled = true;
  try {
    const params = currentParams();
    const response = await fetch(`/api/explore-area?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Explorer data failed');
    renderSummary(data);
    history.replaceState(null, '', `/zh/explore/?${params.toString()}`);
  } catch (_) {
    currentData = null;
    status.textContent = '官方成交数据暂时无法加载，请稍后再试。';
    status.className = 'market-status error';
    metricRent.textContent = '—';
    metricDeposit.textContent = '—';
    metricContracts.textContent = '—';
    metricChange.textContent = '—';
    buildingList.innerHTML = '<div class="explorer-empty">暂时无法加载建筑级成交数据。</div>';
    updateLanguageSwitch();
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
