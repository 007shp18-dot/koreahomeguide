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

const DISTRICT_NAMES = { '11680':'江南区', '11440':'麻浦区', '11170':'龙山区', '11200':'城东区', '11560':'永登浦区' };
const TYPE_NAMES = { apartment:'公寓', officetel:'Officetel', villa:'Villa / 多户住宅' };

function selectedCurrency() { return currencySelect ? currencySelect.value : 'KRW'; }
function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">数据不足</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'zh-CN');
}
function formatArea(value) { return value == null ? '数据不足' : `${Number(value).toFixed(1)}㎡`; }
function districtName() { return DISTRICT_NAMES[lawdCd] || '首尔'; }
function typeName() { return TYPE_NAMES[type] || KHGExplorer.propertyTypeLabel(type); }
function matchingQuery() { return new URLSearchParams({ lawdCd, type, buildingKey }).toString(); }

function renderTrend(points) {
  const usable = (points || []).filter(point => Number.isFinite(Number(point.medianMonthlyRentWon)) && Number(point.medianMonthlyRentWon) > 0);
  if (usable.length < 3) {
    trendChart.innerHTML = '<div class="explorer-empty">月度样本不足，暂时无法展示有意义的趋势。</div>';
    return;
  }
  const max = Math.max(...usable.map(point => Number(point.medianMonthlyRentWon)));
  trendChart.innerHTML = usable.map(point => {
    const value = Number(point.medianMonthlyRentWon);
    const height = Math.max(12, Math.round((value / max) * 100));
    return `<div class="trend-column"><div class="trend-value">${moneyHtml(value)}</div><div class="trend-bar-track"><span class="trend-bar" style="height:${height}%"></span></div><strong>${KHGDate.formatMonth(point.month, 'zh-CN')}</strong><small>${point.count} 笔合同</small></div>`;
  }).join('');
}

function renderContracts(items) {
  if (!items || !items.length) {
    recentBuildingContracts.innerHTML = '<tr class="empty-row"><td colspan="4">该建筑近期没有可用的官方申报合同。</td></tr>';
    return;
  }
  recentBuildingContracts.innerHTML = items.map(item => `<tr><td>${KHGDate.formatDate(item.contractDate, 'zh-CN')}</td><td>${formatArea(item.areaSqm)}</td><td>${moneyHtml(item.depositWon)}</td><td>${Number(item.monthlyRentWon) === 0 ? '<span class="money-primary">全租 · ₩0</span>' : moneyHtml(item.monthlyRentWon)}</td></tr>`).join('');
}

function buildRentCheckUrl(data) {
  const params = new URLSearchParams({ lawdCd, type });
  if (Number.isFinite(Number(data.medianDepositWon))) params.set('deposit', String(Math.round(Number(data.medianDepositWon))));
  if (Number.isFinite(Number(data.medianMonthlyRentWon))) params.set('rent', String(Math.round(Number(data.medianMonthlyRentWon))));
  if (Number.isFinite(Number(data.typicalAreaSqm))) params.set('area', String(Number(data.typicalAreaSqm).toFixed(1)));
  return `/zh/tools/seoul-rent-check/?${params.toString()}`;
}

function renderBuilding(data) {
  buildingData = data;
  buildingName.textContent = data.buildingName;
  buildingMeta.textContent = `${districtName()} · ${typeName()} · 首尔`;
  document.title = `${data.buildingName} 租金数据 | 首尔租金探索`;
  buildingRent.innerHTML = data.medianMonthlyRentWon == null ? '数据不足' : moneyHtml(data.medianMonthlyRentWon);
  buildingDeposit.innerHTML = data.medianDepositWon == null ? '数据不足' : moneyHtml(data.medianDepositWon);
  buildingArea.textContent = formatArea(data.typicalAreaSqm);
  buildingContracts.textContent = Number(data.contractCount || 0).toLocaleString('zh-CN');
  const change = Number(data.quarterChangePct);
  buildingChange.textContent = Number.isFinite(change) ? `近期变化：${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '近期变化：数据不足';
  renderTrend(data.monthlyTrend || []);
  renderContracts(data.recentTransactions || []);
  rentCheckCta.href = buildRentCheckUrl(data);
  rentCheckCta.textContent = '检查这个租金 →';
  backToExplore.href = `/zh/explore/?${new URLSearchParams({ lawdCd, type }).toString()}`;
  if (languageSwitch) languageSwitch.href = `/explore/building/?${matchingQuery()}`;
  buildingStatus.textContent = `基于最近 6 个完整月份中该建筑的 ${Number(data.contractCount || 0).toLocaleString('zh-CN')} 笔官方申报合同。`;
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
  if (languageSwitch) languageSwitch.href = `/explore/building/?${matchingQuery()}`;
  if (!lawdCd || !type || !buildingKey) {
    buildingName.textContent = '建筑数据链接不完整。';
    buildingStatus.textContent = '请返回租金探索并重新选择建筑。';
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
    buildingName.textContent = '建筑数据暂时不可用。';
    buildingStatus.textContent = '该建筑近期可能没有官方申报合同，或官方数据暂时无法加载。';
    buildingStatus.className = 'market-status error';
    trendChart.innerHTML = '<div class="explorer-empty">暂无建筑趋势数据。</div>';
    recentBuildingContracts.innerHTML = '<tr class="empty-row"><td colspan="4">暂无建筑成交记录。</td></tr>';
  }
}

currencySelect.addEventListener('change', () => { if (buildingData) renderBuilding(buildingData); });
(async () => { await loadFx(); await loadBuilding(); })();
