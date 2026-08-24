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

const DISTRICT_NAMES = { '11680':'江南区', '11440':'麻浦区', '11170':'龙山区', '11200':'城东区', '11560':'永登浦区' };
const TYPE_NAMES = { apartment:'公寓', officetel:'Officetel', villa:'Villa / 多户住宅' };
const DONG_NAMES_ZH = {
  '연남동':'延南洞 (연남동)', '서교동':'西桥洞 (서교동)', '망원동':'望远洞 (망원동)', '합정동':'合井洞 (합정동)',
  '역삼동':'驿三洞 (역삼동)', '논현동':'论岘洞 (논현동)', '청담동':'清潭洞 (청담동)', '삼성동':'三成洞 (삼성동)',
  '한남동':'汉南洞 (한남동)', '이태원동':'梨泰院洞 (이태원동)', '성수동1가':'圣水洞1街 (성수동1가)', '성수동2가':'圣水洞2街 (성수동2가)',
  '여의도동':'汝矣岛洞 (여의도동)', '당산동':'堂山洞 (당산동)'
};
const LISTING_NOTE = '没有实时房源；这里展示的是历史真实签约数据。';

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">数据不足</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'zh-CN');
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function areaName() { return DISTRICT_NAMES[areaSelect.value] || areaSelect.options[areaSelect.selectedIndex].text; }
function typeName(type = typeSelect.value) { return TYPE_NAMES[type] || KHGExplorer.propertyTypeLabel(type); }
function dongDisplayName(dong) { return DONG_NAMES_ZH[dong] || dong; }
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
function currentParams(includeDong = true) {
  const params = new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value });
  const { maxRent, maxDeposit } = budgetValues();
  if (maxRent) params.set('maxRent', String(maxRent));
  if (maxDeposit) params.set('maxDeposit', String(maxDeposit));
  if (includeDong && currentDong) params.set('dong', currentDong);
  return params;
}
function updateLanguageSwitch() { if (languageSwitch) languageSwitch.href = `/explore/?${currentParams(true).toString()}`; }

function renderDongs(dongs) {
  if (!dongList) return;
  const allItems = Array.isArray(dongs) ? dongs : [];
  const items = filterDongsByBudget(allItems);
  updateBudgetNote(items.length, allItems.length);
  if (hasBudgetFilter() && !items.length) {
    dongList.innerHTML = '<div class="explorer-empty">没有街区的月租和押金中位数同时符合当前预算。请提高月租或押金预算后再试。</div>';
    return;
  }
  const allActive = currentDong ? '' : ' is-active';
  const allLabel = hasBudgetFilter() ? '全部符合条件的街区' : '全部街区';
  const all = `<button class="dong-chip${allActive}" type="button" data-dong=""><strong>${allLabel}</strong><small>${items.length} 个洞</small></button>`;
  const cards = items.map(item => {
    const active = item.dong === currentDong ? ' is-active' : '';
    const rent = item.medianMonthlyRentWon == null ? '—' : moneyHtml(item.medianMonthlyRentWon);
    const seoHref = KHGExplorer.buildDongSeoUrl({ lawdCd:areaSelect.value, type:typeSelect.value, dong:item.dong, lang:'zh' });
    return `<div class="dong-chip-wrap"><button class="dong-chip${active}" type="button" data-dong="${escapeHtml(item.dong)}"><strong>${escapeHtml(dongDisplayName(item.dong))}</strong><span>${rent}</span><small>${Number(item.contractCount || 0).toLocaleString('zh-CN')} 笔合同</small></button><a class="dong-seo-link" href="${escapeHtml(seoHref)}">街区页面 →</a></div>`;
  }).join('');
  dongList.innerHTML = all + cards;
  dongList.querySelectorAll('[data-dong]').forEach(button => button.addEventListener('click', () => {
    const dong = button.dataset.dong || '';
    if (!dong) {
      currentDong = '';
      renderDongs(currentAreaData ? currentAreaData.dongs : []);
      if (currentAreaData) renderSummary(currentAreaData, '');
      history.replaceState(null, '', `/zh/explore/?${currentParams(false).toString()}`);
      updateLanguageSwitch();
      return;
    }
    loadDong(dong);
  }));
}

function renderSummary(data, dong = '') {
  currentData = data;
  currentDong = dong || '';
  title.textContent = [areaName(), currentDong ? dongDisplayName(currentDong) : '', typeName(data.propertyType || typeSelect.value)].filter(Boolean).join(' · ');
  const summary = data.summary || {};
  metricRent.innerHTML = summary.medianMonthlyRentWon == null ? '数据不足' : moneyHtml(summary.medianMonthlyRentWon);
  metricDeposit.innerHTML = summary.medianDepositWon == null ? '数据不足' : moneyHtml(summary.medianDepositWon);
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
  if (hasBudgetFilter() && !currentDong) {
    buildingList.innerHTML = '<div class="explorer-empty">请先从上方符合预算的街区中选择一个，再查看具体建筑和近期合同。</div>';
    return;
  }
  if (!buildings.length) {
    buildingList.innerHTML = '<div class="explorer-empty">近期官方数据中没有可识别名称的建筑。</div>';
    return;
  }
  buildingList.innerHTML = buildings.slice(0, 30).map(item => {
    const dong = item.dong || currentDong;
    const interactiveParams = new URLSearchParams({ lawdCd:areaSelect.value, type:typeSelect.value });
    if (dong) interactiveParams.set('dong', dong);
    interactiveParams.set('buildingKey', item.buildingKey);
    const interactiveHref = `/zh/explore/building/?${interactiveParams.toString()}`;
    const seoHref = KHGExplorer.buildBuildingSeoUrl({ lawdCd:areaSelect.value, type:typeSelect.value, dong, buildingName:item.buildingName, buildingKey:item.buildingKey, lang:'zh' });
    const location = [dong ? dongDisplayName(dong) : '', areaName(), typeName()].filter(Boolean).join(' · ');
    return `<article class="building-row">
      <div class="building-name"><strong>${escapeHtml(item.buildingName)}</strong><small>${escapeHtml(location)}</small></div>
      <div><span class="mobile-label">典型面积</span><strong>${formatArea(item.typicalAreaSqm)}</strong></div>
      <div class="building-money"><span class="mobile-label">月租</span><strong>${item.medianMonthlyRentWon == null ? '—' : moneyHtml(item.medianMonthlyRentWon)}</strong></div>
      <div class="building-money"><span class="mobile-label">押金</span><strong>${item.medianDepositWon == null ? '—' : moneyHtml(item.medianDepositWon)}</strong></div>
      <div><span class="mobile-label">成交</span><strong>${Number(item.contractCount || 0).toLocaleString('zh-CN')}</strong></div>
      <div class="building-actions"><a href="${escapeHtml(seoHref)}">查看建筑页面 →</a><a class="secondary" href="${escapeHtml(interactiveHref)}">交互查看</a></div>
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
  exploreButton.disabled = true;
}

async function loadDong(dong) {
  currentDong = String(dong || '').trim();
  if (!currentDong) return;
  setLoading(`正在加载 ${dongDisplayName(currentDong)} 的官方租赁成交数据…`);
  updateLanguageSwitch();
  try {
    const params = currentParams(true);
    const response = await fetch(`/api/explore-dong?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Neighborhood data failed');
    renderSummary(data, data.dong || currentDong);
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
