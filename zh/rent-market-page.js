const root = document.querySelector('#rentMarketPage');
const currencySelect = document.querySelector('#currencySelect');
const marketStatus = document.querySelector('#marketStatus');
const metricContracts = document.querySelector('#metricContracts');
const metricRent = document.querySelector('#metricRent');
const metricDeposit = document.querySelector('#metricDeposit');
const metricJeonse = document.querySelector('#metricJeonse');
const quarterChange = document.querySelector('#quarterChange');
const sizeBandGrid = document.querySelector('#sizeBandGrid');
const depositBandGrid = document.querySelector('#depositBandGrid');
const recentContractsBody = document.querySelector('#recentContractsBody');
const dataThrough = document.querySelector('#dataThrough');
const neighborhoodLinks = document.querySelector('#neighborhoodLinks');
let fxRates = {};
let marketData = null;

const SIZE_LABELS = {
  under20: '20㎡以下',
  '20to30': '20–30㎡',
  '30to40': '30–40㎡',
  '40to60': '40–60㎡',
  over60: '60㎡以上'
};

function selectedCurrency() {
  return currencySelect ? currencySelect.value : 'CNY';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function moneyHtml(amountWon) {
  if (amountWon == null) return '<span class="money-primary">数据不足</span>';
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, 'zh-CN');
}

function sizeLabel(band) {
  return SIZE_LABELS[band.key] || band.label || '面积区间';
}


function depositRangeLabel(band) {
  const min = Number(band.minDepositWon || 0);
  const max = Number(band.maxDepositWon);
  if (!Number.isFinite(max)) return `押金 ${moneyHtml(min)} 以上`;
  if (min === 0) return `押金低于 ${moneyHtml(max)}`;
  return `押金 ${moneyHtml(min)}–${moneyHtml(max)}`;
}

function renderDepositBands(bands) {
  if (!depositBandGrid) return;
  if (!bands || !bands.length) { depositBandGrid.innerHTML = '<div class="explorer-empty">月租合同样本不足，无法按押金区间展示。</div>'; return; }
  depositBandGrid.innerHTML = bands.map(band => `<div class="size-band-card"><span>${depositRangeLabel(band)}</span><strong>${moneyHtml(band.medianMonthlyRentWon)} / 月</strong><small>${band.count} 笔合同 · 押金中位数 ${moneyHtml(band.medianDepositWon)}</small></div>`).join('');
}

function renderAreaGroups(areaGroups) {
  if (!sizeBandGrid) return;
  if (!areaGroups || !areaGroups.length) { sizeBandGrid.innerHTML = '<div class="explorer-empty">月租合同样本不足，无法按面积分组展示。</div>'; return; }
  sizeBandGrid.innerHTML = areaGroups.map(group => {
    const bands = Array.isArray(group.depositBands) ? [...group.depositBands].sort((a,b) => Number(b.count || 0) - Number(a.count || 0)) : [];
    const band = bands[0];
    return `<div class="size-band-card"><span>约 ${Number(group.approxAreaSqm).toFixed(0)}㎡</span><strong>${group.count} 笔合同</strong>${band ? `<small>${depositRangeLabel(band)} → 月租 ${moneyHtml(band.medianMonthlyRentWon)}</small>` : ''}<small>实际面积中位数 ${Number(group.medianAreaSqm).toFixed(1)}㎡</small></div>`;
  }).join('');
}

function renderRecentContracts(recentContracts) {
  if (!recentContracts || !recentContracts.length) {
    recentContractsBody.innerHTML = '<tr class="empty-row"><td colspan="6">目前没有可显示的近期申报合同。</td></tr>';
    return;
  }
  recentContractsBody.innerHTML = recentContracts.map(item => `
    <tr>
      <td>${(() => { const name = KHGBuildingNames.getBuildingNameDisplay(item.building || '-', 'zh'); return `<strong>${escapeHtml(name.primary)}</strong>${name.secondary ? `<small class="building-official-name">${escapeHtml(name.secondary)}</small>` : ''}`; })()}</td>
      <td>${item.contractType === 'new' ? '新签' : item.contractType === 'renewal' ? '续签' : '未识别'}</td>
      <td>${Number(item.areaSqm).toFixed(1)}㎡</td>
      <td>${moneyHtml(item.depositWon)}</td>
      <td>${moneyHtml(item.monthlyRentWon)}</td>
      <td>${KHGDate.formatDate(item.contractDate, 'zh-CN')}</td>
    </tr>
  `).join('');
}


function renderNeighborhoodLinks(dongs) {
  if (!neighborhoodLinks || !window.KHGExplorer) return;
  const rows = (Array.isArray(dongs) ? dongs : []).filter(item => item && item.dong && Number(item.contractCount || 0) >= 3).slice(0, 10);
  if (!rows.length) {
    neighborhoodLinks.innerHTML = '<span class="explorer-empty">近期成交不足，暂时没有可展示的街区页面。</span>';
    return;
  }
  const lawdCd = root.dataset.lawdCd;
  const type = root.dataset.propertyType;
  neighborhoodLinks.innerHTML = rows.map(item => {
    const href = KHGExplorer.buildDongSeoUrl({ lawdCd, type, dong:item.dong, lang:'zh' });
    return `<a href="${escapeHtml(href)}"><strong>${escapeHtml(item.dong)}</strong><span>${Number(item.contractCount || 0).toLocaleString('zh-CN')} 笔近期成交</span></a>`;
  }).join('');
}

function renderMarket(data) {
  marketData = data;
  metricContracts.textContent = Number(data.totalContracts || 0).toLocaleString('zh-CN');
  metricRent.textContent = Number(data.newContractMonthlyRentCount || 0).toLocaleString('zh-CN');
  metricDeposit.textContent = Number(data.renewalMonthlyRentCount || 0).toLocaleString('zh-CN');
  metricJeonse.innerHTML = data.jeonseCount ? moneyHtml(data.medianJeonseDepositWon) : '<span class="money-primary">暂无全租中位数</span>';
  const q = Number(data.quarterChangePct);
  quarterChange.textContent = Number.isFinite(q) ? `${q > 0 ? '+' : ''}${q.toFixed(1)}% · 近 3 个月 vs 前 3 个月` : '数据不足，暂无法比较近 3 个月走势';
  dataThrough.textContent = data.dataThroughMonth ? `数据截至 ${KHGDate.formatMonth(data.dataThroughMonth, 'zh-CN')}` : '最近已完成月份';
  renderDepositBands(data.depositBands || []);
  renderAreaGroups(data.areaGroups || []);
  renderRecentContracts(data.recentContracts || []);
  renderNeighborhoodLinks(data.dongs || []);
  const basis = data.contextualBasis === 'new-contracts' ? '按押金区间的月租优先使用能够识别为新签的合同。' : '新签/续签标记不足，因此按押金区间的月租使用全部已申报月租合同。';
  marketStatus.textContent = data.totalContracts
    ? `基于最近 ${data.monthsUsed || 6} 个完整月份的 ${Number(data.totalContracts).toLocaleString('zh-CN')} 份已申报租赁合同。${basis}`
    : '可用的申报租赁成交不足，暂时无法生成可靠的市场摘要。';
  marketStatus.className = `market-status ${data.totalContracts ? 'success' : ''}`;
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

async function loadMarket() {
  const lawdCd = root.dataset.lawdCd;
  const propertyType = root.dataset.propertyType;
  marketStatus.textContent = '正在加载官方租赁成交数据…';
  marketStatus.className = 'market-status loading';
  try {
    const response = await fetch(`/api/rent-market?type=${encodeURIComponent(propertyType)}&lawdCd=${encodeURIComponent(lawdCd)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Market data failed');
    renderMarket(data);
  } catch (_) {
    marketStatus.textContent = '官方租赁成交数据暂时无法加载，请稍后再试。';
    marketStatus.className = 'market-status error';
  }
}

if (currencySelect) {
  currencySelect.addEventListener('change', () => {
    if (marketData) renderMarket(marketData);
  });
}

(async () => {
  await loadFx();
  await loadMarket();
})();
