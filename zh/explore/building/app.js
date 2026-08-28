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
    language:'zh-CN', districtCode:data.districtCode || lawdCd,
    propertyType:data.propertyType || type,
    contractCount:Number(data.contractCount || 0), resultState, errorCategory
  });
}

function selectedCurrency() { return currencySelect ? currencySelect.value : 'CNY'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">数据不足</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'zh-CN');
}
function formatArea(value) { return value == null ? '数据不足' : `${Number(value).toFixed(1)}㎡`; }
function districtName() { return KHGLocations.districtLabel(lawdCd, 'zh-CN') || '首尔'; }
function typeName() { return KHGLocations.propertyTypeLabel(type, 'zh-CN'); }
function dongDisplayName(dong) { return KHGLocations.dongLabel(dong, 'zh-CN'); }
function contextParams(data = {}) {
  const params = new URLSearchParams({ lawdCd, type });
  const dong = data.dong || requestedDong;
  if (dong) params.set('dong', dong);
  return params;
}
function matchingQuery(data = {}) {
  const params = contextParams(data);
  params.set('buildingKey', buildingKey);
  return params.toString();
}
function contractTypeLabel(value) {
  if (value === 'new') return '新签';
  if (value === 'renewal') return '续签';
  return '未识别';
}
function depositRangeLabel(band) {
  const min = Number(band.minDepositWon || 0);
  const max = Number(band.maxDepositWon);
  if (!Number.isFinite(max)) return `押金 ${moneyHtml(min)} 以上`;
  if (min === 0) return `押金低于 ${moneyHtml(max)}`;
  return `押金 ${moneyHtml(min)}–${moneyHtml(max)}`;
}
function renderDepositBands(items) {
  if (!items || !items.length) { buildingDepositBands.innerHTML = '<div class="explorer-empty">月租合同样本不足，无法按押金区间展示。</div>'; return; }
  buildingDepositBands.innerHTML = items.map(band => `<div class="size-band-card"><span>${depositRangeLabel(band)}</span><strong>${moneyHtml(band.medianMonthlyRentWon)} / 月</strong><small>${band.count} 笔合同 · 押金中位数 ${moneyHtml(band.medianDepositWon)}</small></div>`).join('');
}
function renderAreaGroups(items) {
  if (!items || !items.length) { buildingAreaGroups.innerHTML = '<div class="explorer-empty">样本不足，无法按面积分组。</div>'; return; }
  buildingAreaGroups.innerHTML = items.map(group => `<div class="size-band-card"><span>约 ${group.approxAreaSqm}㎡</span><strong>${moneyHtml(group.medianMonthlyRentWon)} / 月</strong><small>${group.count} 笔合同 · 押金中位数 ${moneyHtml(group.medianDepositWon)}</small></div>`).join('');
}
function renderTrend(points) {
  const usable = (points || []).filter(point => Number.isFinite(Number(point.medianMonthlyRentWon)) && Number(point.medianMonthlyRentWon) > 0);
  if (usable.length < 3) { trendChart.innerHTML = '<div class="explorer-empty">月度样本不足，暂时无法展示有意义的趋势。</div>'; return; }
  const max = Math.max(...usable.map(point => Number(point.medianMonthlyRentWon)));
  trendChart.innerHTML = usable.map(point => {
    const value = Number(point.medianMonthlyRentWon);
    const height = Math.max(12, Math.round((value / max) * 100));
    return `<div class="trend-column"><div class="trend-value">${moneyHtml(value)}</div><div class="trend-bar-track"><span class="trend-bar" style="height:${height}%"></span></div><strong>${KHGDate.formatMonth(point.month, 'zh-CN')}</strong><small>${point.count} 笔合同</small></div>`;
  }).join('');
}
function renderContracts(items) {
  if (!items || !items.length) { recentBuildingContracts.innerHTML = '<tr class="empty-row"><td colspan="5">该建筑近期没有可用的官方申报合同。</td></tr>'; return; }
  recentBuildingContracts.innerHTML = items.map(item => KHGExplorer.buildLabeledTableRow([
    { label:'日期', html:KHGDate.formatDate(item.contractDate, 'zh-CN') },
    { label:'类型', html:contractTypeLabel(item.contractType) },
    { label:'面积', html:formatArea(item.areaSqm) },
    { label:'押金', html:moneyHtml(item.depositWon) },
    { label:'月租', html:Number(item.monthlyRentWon) === 0 ? '<span class="money-primary">全租 · ₩0</span>' : moneyHtml(item.monthlyRentWon) }
  ])).join('');
}
function renderSales(data) {
  const summary = data && data.saleSummary;
  if (!buildingSalesSection) return;
  if (!summary || !summary.contractCount) { buildingSalesSection.hidden = true; return; }
  buildingSalesSection.hidden = false;
  buildingSaleGroups.innerHTML = (summary.areaGroups || []).map(group => `<div class="size-band-card"><span>约 ${group.approxAreaSqm}㎡</span><strong>${moneyHtml(group.medianSalePriceWon)}</strong><small>${group.count} 笔买卖 · 最近 ${KHGDate.formatDate(group.latestContractDate, 'zh-CN')}</small></div>`).join('');
  recentBuildingSales.innerHTML = (summary.recentSales || []).map(item => KHGExplorer.buildLabeledTableRow([
    { label:'日期', html:KHGDate.formatDate(item.contractDate, 'zh-CN') },
    { label:'面积', html:formatArea(item.areaSqm) },
    { label:'成交价', html:moneyHtml(item.dealAmountWon) },
    { label:'楼层', html:item.floor == null ? '—' : `${item.floor}层` }
  ])).join('');
}
function buildRentCheckUrl(data) {
  const params = new URLSearchParams({ lawdCd, type });
  const actual = (data.recentTransactions || []).find(item => Number(item.monthlyRentWon) > 0);
  if (actual) {
    params.set('deposit', String(Math.round(Number(actual.depositWon))));
    params.set('rent', String(Math.round(Number(actual.monthlyRentWon))));
    params.set('area', String(Number(actual.areaSqm).toFixed(1)));
  } else if (Number.isFinite(Number(data.typicalAreaSqm))) params.set('area', String(Number(data.typicalAreaSqm).toFixed(1)));
  return `/zh/tools/seoul-rent-check/?${params.toString()}`;
}
function renderBuilding(data) {
  buildingData = data;
  const nameDisplay = KHGBuildingNames.getBuildingNameDisplay(data.buildingName, 'zh');
  buildingName.textContent = nameDisplay.primary;
  if (buildingOfficialName) { buildingOfficialName.textContent = nameDisplay.secondary; buildingOfficialName.hidden = !nameDisplay.secondary; }
  buildingMeta.textContent = [districtName(), data.dong ? dongDisplayName(data.dong) : '', typeName(), '首尔'].filter(Boolean).join(' · ');
  document.title = `${nameDisplay.primary} 租金数据 | 首尔租金探索`;
  buildingContracts.textContent = Number(data.contractCount || 0).toLocaleString('zh-CN');
  buildingNewContracts.textContent = Number(data.newContractMonthlyRentCount || 0).toLocaleString('zh-CN');
  buildingArea.textContent = formatArea(data.typicalAreaSqm);
  buildingJeonse.innerHTML = data.medianJeonseDepositWon == null ? '<span class="money-primary">数据不足</span>' : moneyHtml(data.medianJeonseDepositWon);
  const counts = data.contractTypeCounts || {};
  buildingContractMix.textContent = `${Number(counts.new || 0)} 新签 · ${Number(counts.renewal || 0)} 续签 · ${Number(counts.unknown || 0)} 未识别`;
  renderDepositBands(data.depositBands || []);
  renderAreaGroups(data.areaGroups || []);
  const change = Number(data.quarterChangePct);
  buildingChange.textContent = Number.isFinite(change) ? `原始月租中位数变化：${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '原始趋势：数据不足';
  renderTrend(data.monthlyTrend || []);
  renderContracts(data.recentTransactions || []);
  renderSales(data);
  rentCheckCta.href = buildRentCheckUrl(data);
  rentCheckCta.textContent = '检查这个租金 →';
  backToExplore.href = `/zh/explore/?${contextParams(data).toString()}`;
  if (languageSwitch) languageSwitch.href = `/explore/building/?${matchingQuery(data)}`;
  const basis = data.contextualBasis === 'new-contracts' ? '按押金和面积的统计优先使用能够识别为新签的合同。' : '新签/续签标记不足，因此按押金和面积的统计使用全部已申报月租合同。';
  buildingStatus.textContent = `基于最近 6 个完整月份中该建筑的 ${Number(data.contractCount || 0).toLocaleString('zh-CN')} 笔官方申报合同。${basis}`;
  buildingStatus.className = 'market-status success';
}
async function loadFx() {
  currencySelect.disabled = true;
  try {
    const response = await fetch('/api/fx'); const data = await response.json();
    if (!response.ok) throw new Error('FX unavailable');
    fxRates = data.rates || {};
    if (!fxRates[currencySelect.value] && currencySelect.value !== 'KRW') currencySelect.value = 'KRW';
  } catch (_) { fxRates = {}; currencySelect.value = 'KRW'; }
  finally { currencySelect.disabled = false; }
}
async function loadBuilding() {
  if (languageSwitch) languageSwitch.href = `/explore/building/?${matchingQuery()}`;
  if (!lawdCd || !type || !buildingKey) { buildingName.textContent = '建筑数据链接不完整。'; buildingStatus.textContent = '请返回租金探索并重新选择建筑。'; buildingStatus.className = 'market-status error'; trackBuilding({}, 'error', 'request'); return; }
  try {
    const params = new URLSearchParams({ lawdCd, type, buildingKey });
    const response = await fetch(`/api/explore-building?${params.toString()}`); const data = await response.json();
    if (!response.ok) { const error = new Error(data.error || 'Building data failed'); error.status = response.status; throw error; }
    renderBuilding(data);
    trackBuilding(data, Number(data.contractCount || 0) > 0 ? 'success' : 'empty');
  } catch (error) {
    trackBuilding({}, 'error', window.KHGProductAnalytics && window.KHGProductAnalytics.errorCategory(error));
    buildingName.textContent = '建筑数据暂时不可用。';
    buildingStatus.textContent = '该建筑近期可能没有官方申报合同，或官方数据暂时无法加载。';
    buildingStatus.className = 'market-status error';
    trendChart.innerHTML = '<div class="explorer-empty">暂无建筑趋势数据。</div>';
    recentBuildingContracts.innerHTML = '<tr class="empty-row"><td colspan="5">暂无建筑成交记录。</td></tr>';
  }
}
currencySelect.addEventListener('change', () => { if (buildingData) renderBuilding(buildingData); });
(async () => { await loadFx(); await loadBuilding(); })();
