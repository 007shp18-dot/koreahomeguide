const KHGDate = require('../date-utils.js');
const { getBuildingNameDisplay } = require('../building-name-utils.js');
const KHGLocations = require('../location-catalog.js');
const {
  buildDongSeoUrl,
  buildBuildingSeoUrl,
  buildingSlug
} = require('./seo-route-utils.cjs');

const ORIGIN = 'https://koreahomeguide.com';
const PUBLIC_DATA_LICENSE = 'https://www.data.go.kr/ugs/selectPortalPolicyView.do';

function isZh(lang) {
  return String(lang || '').toLowerCase().startsWith('zh');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[ch]);
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function districtDisplay(name, lang, areaCode = '') {
  const match = KHGLocations.DISTRICTS[String(areaCode || '')]
    ? String(areaCode)
    : Object.keys(KHGLocations.DISTRICTS).find(code => KHGLocations.DISTRICTS[code].en === name);
  return match ? KHGLocations.districtLabel(match, isZh(lang) ? 'zh-CN' : 'en') : String(name || '');
}

function dongDisplay(dong, lang) {
  return KHGLocations.dongLabel(dong, isZh(lang) ? 'zh-CN' : 'en');
}

function propertyDisplay(type, lang) {
  return KHGLocations.propertyTypeLabel(type, isZh(lang) ? 'zh-CN' : 'en');
}

function wonText(amount, lang) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return '—';
  return `₩${Math.round(numeric).toLocaleString(isZh(lang) ? 'zh-CN' : 'en-US')}`;
}

function moneyHtml(amount, lang, rates = {}) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return '<span class="seo-money">—</span>';
  const zh = isZh(lang);
  const currency = zh ? 'CNY' : 'USD';
  const symbol = zh ? '¥' : '$';
  const rate = Number(rates && rates[currency]);
  const won = wonText(numeric, lang);
  if (!Number.isFinite(rate) || rate <= 0) return `<span class="seo-money">${escapeHtml(won)}</span>`;
  const converted = Math.round(numeric * rate).toLocaleString(zh ? 'zh-CN' : 'en-US');
  return `<span class="seo-money">${symbol}${converted}</span><small class="seo-krw">≈ ${escapeHtml(won)}</small>`;
}

function numberText(value, lang) {
  const n = Number(value || 0);
  return n.toLocaleString(isZh(lang) ? 'zh-CN' : 'en-US');
}

function areaText(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(1)}㎡` : '—';
}

function directionText(value, lang) {
  const n = Number(value);
  if (!Number.isFinite(n)) return isZh(lang) ? '数据不足' : 'Not enough data';
  const pct = `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
  return isZh(lang) ? `${pct}（较此前3个月）` : `${pct} vs prior 3 months`;
}

function languagePairPaths({ areaCode, dong, propertyType, building }) {
  if (building) {
    return {
      en:buildBuildingSeoUrl({ areaCode, dong, propertyType, building, lang:'en' }),
      zh:KHGLocations.supportsZhIndexing(areaCode)
        ? buildBuildingSeoUrl({ areaCode, dong, propertyType, building, lang:'zh' })
        : ''
    };
  }
  return {
    en:buildDongSeoUrl({ areaCode, dong, propertyType, lang:'en' }),
    zh:KHGLocations.supportsZhIndexing(areaCode)
      ? buildDongSeoUrl({ areaCode, dong, propertyType, lang:'zh' })
      : ''
  };
}

function zhExplorerFallback({ areaCode, propertyType, dong = '' }) {
  const params = new URLSearchParams({ lawdCd:String(areaCode || ''), type:String(propertyType || '') });
  if (dong) params.set('dong', String(dong));
  return `/zh/explore/?${params.toString()}`;
}

function buildInteractiveBuildingUrl({ areaCode, dong, propertyType, buildingKey, lang = 'en' }) {
  const params = new URLSearchParams({
    lawdCd:String(areaCode || ''),
    type:String(propertyType || ''),
    dong:String(dong || ''),
    buildingKey:String(buildingKey || '')
  });
  return `${isZh(lang) ? '/zh' : ''}/explore/building/?${params.toString()}`;
}

function pageHead({ lang, title, description, canonicalPath, alternateEn, alternateZh, robots = 'index,follow', jsonLd, acquisition = false }) {
  const canonical = `${ORIGIN}${canonicalPath}`;
  const htmlLang = isZh(lang) ? 'zh-CN' : 'en';
  const zhAlternate = alternateZh
    ? `<link rel="alternate" hreflang="zh-CN" href="${escapeHtml(`${ORIGIN}${alternateZh}`)}">`
    : '';
  const acquisitionScripts = acquisition
    ? '<script defer src="/acquisition-context.js"></script><script defer src="/acquisition-links.js"></script>'
    : '';
  return `<!doctype html><html lang="${htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${escapeHtml(robots)}"><link rel="canonical" href="${escapeHtml(canonical)}"><link rel="alternate" hreflang="en" href="${escapeHtml(`${ORIGIN}${alternateEn}`)}">${zhAlternate}<link rel="alternate" hreflang="x-default" href="${escapeHtml(`${ORIGIN}${alternateEn}`)}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><script defer src="/privacy-consent.js"></script>${acquisitionScripts}<link rel="stylesheet" href="/styles.css"><style>.seo-page{max-width:1040px;margin:0 auto;padding:42px 22px 72px}.seo-breadcrumbs{font-size:14px;color:#667085;margin-bottom:20px}.seo-breadcrumbs a{color:inherit}.seo-hero h1{font-size:clamp(32px,5vw,54px);line-height:1.04;margin:8px 0 14px}.seo-hero p{max-width:780px;color:#475467;font-size:17px;line-height:1.65}.seo-eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.seo-fresh{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:18px;color:#667085;font-size:13px}.seo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:28px 0}.seo-card,.seo-section{border:1px solid #e4e7ec;border-radius:18px;background:#fff}.seo-card{padding:18px}.seo-card span{display:block;color:#667085;font-size:13px}.seo-card strong{display:block;font-size:22px;margin-top:8px}.seo-money{display:block}.seo-krw{display:block;color:#667085;font-weight:500;margin-top:3px}.seo-section{padding:24px;margin-top:18px}.seo-section h2{margin:0 0 8px;font-size:24px}.seo-section p{color:#667085}.seo-buildings{display:grid;gap:10px;margin-top:16px}.seo-building-link{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid #eef0f3;color:inherit;text-decoration:none}.seo-building-link:first-child{border-top:0}.seo-building-link span:last-child{text-align:right;color:#667085}.seo-building-official{display:block;margin-top:3px;color:#667085;font-size:12px;font-weight:600}.seo-table-wrap{overflow-x:auto}.seo-table{width:100%;border-collapse:collapse;min-width:680px}.seo-table th,.seo-table td{padding:12px 10px;border-bottom:1px solid #eef0f3;text-align:left;vertical-align:top}.seo-table th{font-size:12px;color:#667085;text-transform:uppercase}.seo-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.seo-action{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:12px;border:1px solid #d0d5dd;text-decoration:none;color:#101828;font-weight:700}.seo-action.primary{background:#101828;color:#fff;border-color:#101828}.seo-trend{display:flex;gap:10px;align-items:flex-end;overflow-x:auto;margin-top:18px}.seo-trend-item{min-width:96px;padding:12px;border:1px solid #eef0f3;border-radius:12px}.seo-trend-item strong,.seo-trend-item small{display:block}.seo-footer{margin-top:34px;color:#667085;font-size:13px}.seo-error{max-width:680px;margin:80px auto;padding:0 22px}.seo-error h1{font-size:38px}.seo-error p{color:#667085;line-height:1.6}@media(max-width:760px){.seo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.seo-page{padding-top:28px}.seo-building-link{display:block}.seo-building-link span:last-child{text-align:left;display:block;margin-top:6px}}@media(max-width:420px){.seo-grid{grid-template-columns:1fr}}.seo-building-page{max-width:980px}.seo-building-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:28px;padding:18px 0 6px}.seo-building-title h1{font-size:clamp(36px,5vw,58px);line-height:1.02;letter-spacing:-.045em;margin:8px 0 10px}.seo-building-title p{margin:0;color:#667085}.seo-hero-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.seo-core-metrics{margin:24px 0 18px}.seo-card-primary{border-color:#cfded4;background:#f5f9f6}.seo-card small{display:block;color:#98a2b3;font-size:11px;margin-top:6px}.seo-comparison{display:flex;gap:10px;align-items:baseline;padding:14px 2px 22px;color:#475467}.seo-comparison strong{font-size:13px;color:#344054}.seo-comparison span{font-size:14px}.seo-jump-nav{display:flex;gap:8px;margin:0 0 12px;padding-top:8px;border-top:1px solid #eaecf0}.seo-jump-nav a{padding:9px 12px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:12px;font-weight:700}.seo-market-note{margin:24px 0 0;color:#667085;font-size:12px;line-height:1.6}@media(max-width:760px){.seo-building-hero{align-items:flex-start;flex-direction:column}.seo-hero-actions{justify-content:flex-start}.seo-comparison{align-items:flex-start;flex-direction:column}.seo-jump-nav{overflow-x:auto}}</style>${jsonLd ? `<script type="application/ld+json">${jsonForHtml(jsonLd)}</script>` : ''}</head><body>`;
}

function header(lang, switchPath) {
  const zh = isZh(lang);
  return `<header class="compact-header"><a class="brand" href="${zh ? '/zh/' : '/'}"><span class="brand-mark">K</span><span>KoreaHomeGuide</span></a><nav><a href="${zh ? '/zh/explore/' : '/explore/'}">${zh ? '租金探索' : 'Rent Explorer'}</a><a href="${zh ? '/zh/tools/seoul-rent-check/' : '/tools/seoul-rent-check/'}">${zh ? '租金检查' : 'Rent Check'}</a><a href="${zh ? '/zh/guides/wolse-vs-jeonse/' : '/guides/wolse-vs-jeonse/'}">${zh ? '指南' : 'Guides'}</a></nav><div class="header-actions"><a class="language-link" href="${escapeHtml(switchPath)}">${zh ? 'English' : '中文'}</a></div></header>`;
}

function footer(lang) {
  const zh = isZh(lang);
  return `<footer class="seo-footer"><strong>KoreaHomeGuide</strong> · ${zh ? '韩国官方申报租赁成交数据的市场参考。' : 'Official reported rental transaction data for general market reference.'} <a href="${zh ? '/zh/privacy/' : '/privacy/'}">${zh ? '隐私说明' : 'Privacy'}</a>.</footer>`;
}


function contextRailHtml({ lang, rentCheckPath, explorePath, guidePath, building = false }) {
  const zh = isZh(lang);
  const safeRent = escapeHtml(rentCheckPath || (zh ? '/zh/tools/seoul-rent-check/' : '/tools/seoul-rent-check/'));
  const safeExplore = escapeHtml(explorePath || (zh ? '/zh/explore/' : '/explore/'));
  const safeGuide = escapeHtml(guidePath || (zh ? '/zh/guides/before-you-sign/' : '/guides/before-you-sign/'));
  return `<aside class="context-rail" aria-label="${zh ? '相关工具' : 'Related tools'}"><section class="context-module soft"><span class="context-kicker">${zh ? '租金检查' : 'RENT CHECK'}</span><h3>${zh ? (building ? '检查这个建筑的实际报价' : '已经拿到租金报价？') : (building ? 'Check a quote for this building' : 'Already have a rent quote?')}</h3><p>${zh ? '用押金、月租、面积和房型与近期官方成交进行比较。' : 'Compare deposit, monthly rent, size, and housing type with recent official contracts.'}</p><a class="context-link" href="${safeRent}">${zh ? '检查租金报价 →' : 'Check a rent quote →'}</a></section><section class="context-module"><span class="context-kicker">${zh ? '继续探索' : 'EXPLORE'}</span><h3>${zh ? '比较周边街区和建筑' : 'Compare nearby neighborhoods and buildings'}</h3><p>${zh ? '从同一市场继续查看近期签约价格。' : 'Keep exploring recent signed prices in the same market.'}</p><a class="context-link" href="${safeExplore}">${zh ? '打开租金探索 →' : 'Open Rent Explorer →'}</a></section><section class="context-module"><span class="context-kicker">${zh ? '签约前' : 'BEFORE YOU SIGN'}</span><h3>${zh ? '大额押金前先做关键检查' : 'Protect a large deposit before signing'}</h3><p>${zh ? '确认登记簿、房东、居所申报、确定日期和押金保障。' : 'Review the registry, landlord, residence reporting, fixed date, and deposit protection.'}</p><a class="context-link" href="${safeGuide}">${zh ? '阅读签约指南 →' : 'Read the signing guide →'}</a></section><div class="ad-slot" data-slot="sidebar" aria-hidden="true"></div></aside>`;
}
function webPageDatasetJsonLd({ lang, title, description, canonicalPath, districtName, dong, propertyType }) {
  const zh = isZh(lang);
  const derivedDescription = zh
    ? '该数据集汇总韩国国土交通部公开申报的租赁成交记录，展示首尔各法定洞最近六个完整月份的押金、月租、面积和合同类型统计。'
    : 'Recent market statistics derived from rental transactions reported to Korea’s Ministry of Land, Infrastructure and Transport.';
  const sourceDescription = zh
    ? '韩国国土交通部根据相关法律收集并通过公共数据门户发布的官方租赁成交记录，包含押金、月租、面积、合同日期和合同类型等字段。'
    : 'Official rental transaction records collected under Korean law and published by the Ministry of Land, Infrastructure and Transport through Korea’s Public Data Portal.';
  return {
    '@context':'https://schema.org',
    '@graph':[
      { '@type':'WebPage', name:title, description, url:`${ORIGIN}${canonicalPath}`, inLanguage:zh ? 'zh-CN' : 'en' },
      {
        '@type':'Dataset',
        name:zh ? `${dong}租赁成交统计` : `${dong} rental transaction statistics`,
        description:derivedDescription,
        license:PUBLIC_DATA_LICENSE,
        spatialCoverage:`${dong}, ${districtName}, Seoul`,
        temporalCoverage:'latest six completed months',
        variableMeasured:propertyType,
        creator:{ '@type':'Organization', name:'KoreaHomeGuide' },
        isBasedOn:{
          '@type':'Dataset',
          name:zh ? '韩国国土交通部租赁成交数据' : 'MOLIT reported rental transaction data',
          description:sourceDescription,
          license:PUBLIC_DATA_LICENSE,
          creator:{ '@type':'Organization', name:'Ministry of Land, Infrastructure and Transport, Republic of Korea' }
        }
      }
    ]
  };
}

function contractTypeLabel(value, lang) {
  const zh = isZh(lang);
  if (value === 'new') return zh ? '新签' : 'New';
  if (value === 'renewal') return zh ? '续签' : 'Renewal';
  return zh ? '未标明' : 'Not specified';
}

function depositRangeText(band, lang) {
  if (!band) return '—';
  const min = Number(band.minDepositWon);
  const max = Number(band.maxDepositWon);
  if (Number.isFinite(min) && !Number.isFinite(max)) return `${wonText(min, lang)}+`;
  if ((!Number.isFinite(min) || min <= 0) && Number.isFinite(max)) return `< ${wonText(max, lang)}`;
  if (Number.isFinite(min) && Number.isFinite(max)) return `${wonText(min, lang)}–${wonText(max, lang)}`;
  return '—';
}

function representativeBand(item) {
  const bands = Array.isArray(item && item.depositBands) ? item.depositBands.filter(b => Number(b && b.count) > 0) : [];
  if (!bands.length) return null;
  return [...bands].sort((a,b) => Number(b.count || 0) - Number(a.count || 0))[0];
}

function depositBandsHtml(bands, lang, rates) {
  const zh = isZh(lang);
  const rows = (Array.isArray(bands) ? bands : []).filter(b => Number(b && b.count) > 0);
  if (!rows.length) return `<p>${zh ? '没有足够的月租成交可按押金区间展示。' : 'Not enough monthly-rent contracts to show deposit-based rent context.'}</p>`;
  return `<div class="seo-grid">${rows.slice(0,8).map(band => `<div class="seo-card"><span>${zh ? '押金区间' : 'Deposit range'} · ${escapeHtml(depositRangeText(band, lang))}</span><strong>${moneyHtml(band.medianMonthlyRentWon, lang, rates)}</strong><small>${zh ? '月租中位数' : 'Median monthly rent'} · ${numberText(band.count, lang)} ${zh ? '笔' : 'contracts'}</small><small>${zh ? '该组押金中位数' : 'Median deposit in this group'}: ${escapeHtml(wonText(band.medianDepositWon, lang))}</small></div>`).join('')}</div>`;
}

function areaGroupsHtml(groups, lang, rates) {
  const zh = isZh(lang);
  const rows = (Array.isArray(groups) ? groups : []).filter(g => Number(g && g.count) > 0);
  if (!rows.length) return `<p>${zh ? '面积分组数据不足。' : 'Not enough observations for floor-area groups.'}</p>`;
  return `<div class="seo-grid">${rows.slice(0,10).map(group => {
    const band = representativeBand(group);
    return `<div class="seo-card"><span>${zh ? '约' : 'Around'} ${escapeHtml(areaText(group.approxAreaSqm))}</span><strong>${numberText(group.count, lang)} ${zh ? '笔成交' : 'contracts'}</strong>${band ? `<small>${escapeHtml(depositRangeText(band, lang))} ${zh ? '押金 → 月租' : 'deposit → rent'} ${escapeHtml(wonText(band.medianMonthlyRentWon, lang))}</small>` : ''}<small>${zh ? '实际面积中位数' : 'Median observed size'}: ${escapeHtml(areaText(group.medianAreaSqm))}</small></div>`;
  }).join('')}</div>`;
}

function contractMixHtml(counts, lang) {
  const zh = isZh(lang);
  const c = counts || {};
  return `<div class="seo-grid"><div class="seo-card"><span>${zh ? '新签' : 'New contracts'}</span><strong>${numberText(c.new, lang)}</strong></div><div class="seo-card"><span>${zh ? '续签' : 'Renewals'}</span><strong>${numberText(c.renewal, lang)}</strong></div><div class="seo-card"><span>${zh ? '未标明' : 'Not specified'}</span><strong>${numberText(c.unknown, lang)}</strong></div></div>`;
}

function recentContractsTable(items, lang, rates, withBuilding = true) {
  const zh = isZh(lang);
  const rows = (Array.isArray(items) ? items : []).slice(0, 10);
  if (!rows.length) return `<p>${zh ? '近期没有足够的申报成交记录。' : 'No recent reported contracts were available.'}</p>`;
  return `<div class="seo-table-wrap"><table class="seo-table"><thead><tr>${withBuilding ? `<th>${zh ? '建筑' : 'Building'}</th>` : ''}<th>${zh ? '类型' : 'Type'}</th><th>${zh ? '面积' : 'Size'}</th><th>${zh ? '押金' : 'Deposit'}</th><th>${zh ? '月租' : 'Monthly rent'}</th><th>${zh ? '签约日期' : 'Contract date'}</th></tr></thead><tbody>${rows.map(item => `<tr>${withBuilding ? (() => { const name = getBuildingNameDisplay(item.building || '-', lang); return `<td><strong>${escapeHtml(name.primary)}</strong>${name.secondary ? `<small class="seo-building-official">${escapeHtml(name.secondary)}</small>` : ''}</td>`; })() : ''}<td>${escapeHtml(contractTypeLabel(item.contractType, lang))}</td><td>${escapeHtml(areaText(item.areaSqm))}</td><td>${moneyHtml(item.depositWon, lang, rates)}</td><td>${Number(item.monthlyRentWon) === 0 ? `<span class="seo-money">${zh ? '全租式 · ₩0' : 'Jeonse-style · ₩0'}</span>` : moneyHtml(item.monthlyRentWon, lang, rates)}</td><td>${escapeHtml(KHGDate.formatDate(item.contractDate, zh ? 'zh-CN' : 'en-US'))}</td></tr>`).join('')}</tbody></table></div>`;
}

function saleAreaGroupsHtml(saleSummary, lang, rates) {
  const zh = isZh(lang);
  const rows = saleSummary && Array.isArray(saleSummary.areaGroups) ? saleSummary.areaGroups : [];
  if (!rows.length) return '';
  return `<div class="seo-grid">${rows.slice(0,8).map(group => `<div class="seo-card"><span>${zh ? '约' : 'Around'} ${escapeHtml(areaText(group.approxAreaSqm))}</span><strong>${moneyHtml(group.medianSalePriceWon, lang, rates)}</strong><small>${zh ? '买卖成交中位价' : 'Median sale price'} · ${numberText(group.count, lang)} ${zh ? '笔' : 'sales'}</small><small>${zh ? '最近成交' : 'Latest'}: ${moneyHtml(group.latestSalePriceWon, lang, rates)} · ${escapeHtml(KHGDate.formatDate(group.latestContractDate, zh ? 'zh-CN' : 'en-US'))}</small></div>`).join('')}</div>`;
}

function recentSalesTable(items, lang, rates) {
  const zh = isZh(lang);
  const rows = (Array.isArray(items) ? items : []).slice(0,10);
  if (!rows.length) return '';
  return `<div class="seo-table-wrap"><table class="seo-table"><thead><tr><th>${zh ? '面积' : 'Size'}</th><th>${zh ? '成交价' : 'Sale price'}</th><th>${zh ? '楼层' : 'Floor'}</th><th>${zh ? '成交日期' : 'Contract date'}</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(areaText(row.areaSqm))}</td><td>${moneyHtml(row.dealAmountWon, lang, rates)}</td><td>${row.floor == null || !Number.isFinite(Number(row.floor)) ? '—' : escapeHtml(String(row.floor))}</td><td>${escapeHtml(KHGDate.formatDate(row.contractDate, zh ? 'zh-CN' : 'en-US'))}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderDongPage({ lang = 'en', areaCode, districtName, dong, propertyType, summary, buildings = [], fxRates = {} }) {
  const zh = isZh(lang);
  const paths = languagePairPaths({ areaCode, dong, propertyType });
  const canonicalPath = zh ? (paths.zh || paths.en) : paths.en;
  const dName = dongDisplay(dong, lang);
  const district = districtDisplay(districtName, lang, areaCode);
  const pLabel = propertyDisplay(propertyType, lang);
  const title = zh ? `${dName} ${pLabel}租金行情 | 首尔` : `${dName} ${pLabel} Rent Prices | Seoul`;
  const description = zh
    ? `查看${district}${dName}${pLabel}近6个完整月份的韩国官方申报租赁成交，按押金区间和面积理解月租，并区分新签与续签合同。`
    : `See six completed months of official reported ${pLabel.toLowerCase()} rental transactions in ${dName}, ${districtName}, with monthly rent grouped by deposit and contract type.`;
  const jsonLd = webPageDatasetJsonLd({ lang, title, description, canonicalPath, districtName, dong, propertyType });
  const head = pageHead({ lang, title, description, canonicalPath, alternateEn:paths.en, alternateZh:paths.zh, robots:'index,follow', jsonLd, acquisition:true });
  const switchPath = zh ? paths.en : (paths.zh || zhExplorerFallback({ areaCode, propertyType, dong }));
  const dataMonth = summary && summary.dataThroughMonth ? KHGDate.formatMonth(summary.dataThroughMonth, zh ? 'zh-CN' : 'en-US') : (zh ? '最近完整月份' : 'Latest completed months');
  const buildingLinks = (Array.isArray(buildings) ? buildings : []).filter(item => item && item.buildingName && item.buildingKey).slice(0, 30).map(item => {
    const href = buildInteractiveBuildingUrl({ areaCode, dong, propertyType, buildingKey:item.buildingKey, lang });
    const name = getBuildingNameDisplay(item.buildingName, lang);
    const band = representativeBand(item);
    const depositContext = band
      ? escapeHtml(depositRangeText(band, lang))
      : (Number(item.medianJeonseDepositWon) > 0 ? escapeHtml(wonText(item.medianJeonseDepositWon, lang)) : '—');
    const rentContext = band ? escapeHtml(wonText(band.medianMonthlyRentWon, lang)) : '—';
    return `<a class="seo-building-link" href="${escapeHtml(href)}" rel="nofollow"><div class="seo-building-main"><strong>${escapeHtml(name.primary)}</strong>${name.secondary ? `<small class="seo-building-official">${escapeHtml(name.secondary)}</small>` : ''}<div class="seo-building-meta"><span>${escapeHtml(areaText(item.typicalAreaSqm))}</span><span>${numberText(item.contractCount, lang)} ${zh ? '笔成交' : 'contracts'}</span></div></div><div class="seo-building-price-context"><div><span class="seo-context-label">${zh ? '押金' : 'Deposit'}</span><strong>${depositContext}</strong></div><div><span class="seo-context-label">${zh ? '月租' : 'Monthly rent'}</span><strong>${rentContext}</strong></div></div></a>`;
  }).join('');
  const exploreParams = new URLSearchParams({ lawdCd:String(areaCode), type:String(propertyType), dong:String(dong) }).toString();
  const rentCheckPath = `${zh ? '/zh' : ''}/tools/seoul-rent-check/?${new URLSearchParams({ lawdCd:String(areaCode), type:String(propertyType) }).toString()}`;
  const otherTypes = ['apartment','officetel','villa','detached'].filter(t => t !== propertyType).map(t => `<a class="seo-action" href="${escapeHtml(buildDongSeoUrl({ areaCode, dong, propertyType:t, lang }))}">${escapeHtml(propertyDisplay(t, lang))}</a>`).join('');
  return `${head}${header(lang, switchPath)}<main class="seo-page product-layout"><div class="seo-breadcrumbs"><a href="${zh ? '/zh/' : '/'}">${zh ? '首尔' : 'Seoul'}</a> → <a href="${zh ? `/zh/rent/${districtName.toLowerCase()}/${propertyType}/` : `/rent/${districtName.toLowerCase()}/${propertyType}/`}">${escapeHtml(district)}</a> → ${escapeHtml(dName)}</div><div class="product-main"><section class="seo-hero"><span class="seo-eyebrow">${zh ? '韩国官方租赁成交' : 'OFFICIAL RENTAL TRANSACTIONS'}</span><h1>${escapeHtml(title.replace(zh ? ' | 首尔' : ' | Seoul',''))}</h1><p>${zh ? `这里展示${escapeHtml(dName)}近期已申报并完成的租赁成交。月租必须和押金一起看，因此本页按押金区间展示，而不是把不同押金结构混成一个“典型月租”。` : `These are recently reported completed rental contracts in ${escapeHtml(dName)}. Monthly rent is shown together with deposit bands so very different deposit structures are not blended into one misleading typical price.`}</p><div class="seo-fresh"><span>${zh ? '数据截至' : 'Data through'} ${escapeHtml(dataMonth)}</span><span>${zh ? '近6个完整月份' : '6-month rolling view'}</span><span>${zh ? '韩国国土交通部数据' : 'Official MOLIT data'}</span></div></section><section class="seo-grid"><div class="seo-card"><span>${zh ? '申报成交数' : 'Reported contracts'}</span><strong>${numberText(summary && (summary.totalContracts || summary.contractCount), lang)}</strong></div><div class="seo-card"><span>${zh ? '新签月租合同' : 'New monthly-rent contracts'}</span><strong>${numberText(summary && summary.newContractMonthlyRentCount, lang)}</strong></div><div class="seo-card"><span>${zh ? '续签月租合同' : 'Renewal contracts'}</span><strong>${numberText(summary && summary.renewalMonthlyRentCount, lang)}</strong></div><div class="seo-card"><span>${zh ? '全租押金中位数' : 'Median jeonse deposit'}</span><strong>${moneyHtml(summary && summary.medianJeonseDepositWon, lang, fxRates)}</strong></div></section><section class="seo-section"><h2>${zh ? '按押金区间看月租' : 'Monthly rent by deposit'}</h2><p>${zh ? '新签合同数量足够时优先使用新签合同；否则使用已申报的月租合同。每个卡片中的押金与月租来自同一组合同。' : 'When enough new contracts are identified, they are preferred. Each card keeps deposit and monthly rent within the same group of contracts.'}</p>${depositBandsHtml(summary && summary.depositBands, lang, fxRates)}</section><section class="seo-section"><h2>${zh ? '按使用面积比较' : 'By floor area'}</h2>${areaGroupsHtml(summary && summary.areaGroups, lang, fxRates)}</section><section class="seo-section"><h2>${zh ? '新签 vs 续签' : 'New vs renewal'}</h2>${contractMixHtml(summary && summary.contractTypeCounts, lang)}</section><section class="seo-section"><h2>${zh ? '近期签约成交' : 'Recently signed contracts'}</h2><p>${zh ? '以下均为已申报成交记录。月租为0时，表示全租式合同。' : 'These are completed reported contracts. A zero monthly rent indicates a jeonse-style contract.'}</p>${recentContractsTable(summary && summary.recentTransactions, lang, fxRates, true)}</section><section class="seo-section"><h2>${zh ? `${escapeHtml(dName)}的建筑` : `Buildings in ${escapeHtml(dName)}`}</h2><p>${zh ? '建筑列表也使用同一押金区间内的月租作为上下文，不把不同押金结构合成一个数字。' : 'Building rows use rent and deposit from the same deposit band rather than an independent pair of medians.'}</p><div class="seo-buildings">${buildingLinks || `<p>${zh ? '近期数据中没有足够的具名建筑记录。' : 'No named buildings had enough recent reported activity.'}</p>`}</div></section><section class="seo-section"><h2>${zh ? '继续比较' : 'Continue comparing'}</h2><div class="seo-actions"><a class="seo-action primary" href="${zh ? '/zh/explore/' : '/explore/'}?${escapeHtml(exploreParams)}">${zh ? '在租金探索中打开' : 'Open in Rent Explorer'}</a><a class="seo-action" href="${escapeHtml(rentCheckPath)}">${zh ? '检查你的实际报价' : 'Check your actual rent quote'}</a>${otherTypes}</div></section></div>${contextRailHtml({ lang, rentCheckPath, explorePath:(zh ? '/zh/explore/' : '/explore/'), building:false })}${footer(lang)}</main></body></html>`;
}

function isBuildingIndexable(detail) {
  return false;
}

function renderBuildingPage({ lang = 'en', areaCode, districtName, dong, propertyType, summary, detail, fxRates = {} }) {
  const zh = isZh(lang);
  const paths = languagePairPaths({ areaCode, dong, propertyType, building:detail });
  const canonicalPath = zh ? (paths.zh || paths.en) : paths.en;
  const dName = dongDisplay(dong, lang);
  const district = districtDisplay(districtName, lang, areaCode);
  const pLabel = propertyDisplay(propertyType, lang);
  const safeBuildingName = detail && detail.buildingName ? detail.buildingName : (zh ? '建筑' : 'Building');
  const buildingNameDisplay = getBuildingNameDisplay(safeBuildingName, lang);
  const displayBuildingName = buildingNameDisplay.primary || safeBuildingName;
  const title = zh ? `${displayBuildingName}租金与成交数据 | ${dName}` : `${displayBuildingName} Rent & Transaction Data | ${dName}, Seoul`;
  const description = zh ? `查看${displayBuildingName}近期韩国官方申报租赁成交，按押金和面积拆分月租，并区分新签与续签${propertyType === 'apartment' ? '，同时查看公寓买卖成交' : ''}。` : `See recent official reported transactions for ${displayBuildingName}, with monthly rent separated by deposit and floor area, plus new versus renewal contracts${propertyType === 'apartment' ? ' and apartment sale transactions' : ''}.`;
  const robots = 'noindex,follow';
  const jsonLd = webPageDatasetJsonLd({ lang, title, description, canonicalPath, districtName, dong, propertyType });
  const head = pageHead({ lang, title, description, canonicalPath, alternateEn:paths.en, alternateZh:paths.zh, robots, jsonLd });
  const switchPath = zh ? paths.en : (paths.zh || zhExplorerFallback({ areaCode, propertyType, dong }));
  const dongPath = buildDongSeoUrl({ areaCode, dong, propertyType, lang });
  const trend = (detail.monthlyTrend || []).filter(point => Number(point.medianMonthlyRentWon) > 0).map(point => `<div class="seo-trend-item"><strong>${escapeHtml(KHGDate.formatMonth(point.month, zh ? 'zh-CN' : 'en-US'))}</strong>${moneyHtml(point.medianMonthlyRentWon, lang, fxRates)}<small>${numberText(point.count, lang)} ${zh ? '笔' : 'contracts'}</small></div>`).join('');
  const rentParams = new URLSearchParams({ lawdCd:String(areaCode), type:String(propertyType) });
  const txRows = Array.isArray(detail.recentTransactions) ? detail.recentTransactions : [];
  const quoteTx = txRows.find(row => row && row.contractType === 'new' && Number(row.monthlyRentWon) > 0) || txRows.find(row => row && Number(row.monthlyRentWon) > 0);
  if (quoteTx) {
    if (Number.isFinite(Number(quoteTx.depositWon))) rentParams.set('deposit', String(Math.round(Number(quoteTx.depositWon))));
    if (Number.isFinite(Number(quoteTx.monthlyRentWon))) rentParams.set('rent', String(Math.round(Number(quoteTx.monthlyRentWon))));
    if (Number.isFinite(Number(quoteTx.areaSqm))) rentParams.set('area', String(Number(quoteTx.areaSqm)));
  }
  const rentPath = `${zh ? '/zh' : ''}/tools/seoul-rent-check/?${rentParams.toString()}`;
  const checkLabel = zh ? '检查租金报价' : 'Check a rent quote';
  const salesSection = propertyType === 'apartment' && detail.saleSummary && Array.isArray(detail.saleSummary.areaGroups) && detail.saleSummary.areaGroups.length
    ? `<section class="seo-section" id="recent-sales"><h2>${zh ? '近期公寓买卖成交' : 'Recent apartment sales'}</h2><p>${zh ? '买卖成交与租赁成交分开显示，并按面积分组。' : 'Sale transactions are kept separate from rental contracts and grouped by floor area.'}</p>${saleAreaGroupsHtml(detail.saleSummary, lang, fxRates)}${recentSalesTable(detail.recentSales || detail.saleSummary.recentSales, lang, fxRates)}</section>` : '';
  return `${head}${header(lang, switchPath)}<main class="seo-page seo-building-page product-layout"><div class="seo-breadcrumbs"><a href="${zh ? '/zh/' : '/'}">${zh ? '首尔' : 'Seoul'}</a> → ${escapeHtml(district)} → <a href="${escapeHtml(dongPath)}">${escapeHtml(dName)}</a> → ${escapeHtml(displayBuildingName)}</div><div class="product-main"><section class="seo-building-hero"><div class="seo-building-title"><span class="seo-eyebrow">${zh ? '建筑成交数据' : 'BUILDING TRANSACTION DATA'}</span><h1>${escapeHtml(displayBuildingName)}</h1>${buildingNameDisplay.secondary ? `<p class="seo-building-official">${escapeHtml(buildingNameDisplay.secondary)}</p>` : ''}<p>${escapeHtml(district)} · ${escapeHtml(dName)} · ${escapeHtml(pLabel)}</p></div><div class="seo-hero-actions"><a class="seo-action primary" href="${escapeHtml(rentPath)}">${checkLabel}</a><a class="seo-action" href="${escapeHtml(dongPath)}">${zh ? `返回${escapeHtml(dName)}` : `Back to ${escapeHtml(dName)}`}</a></div></section><section class="seo-grid seo-core-metrics"><div class="seo-card"><span>${zh ? '近期成交' : 'Recent contracts'}</span><strong>${numberText(detail.contractCount, lang)}</strong><small>${zh ? '近6个完整月份' : 'Last 6 completed months'}</small></div><div class="seo-card"><span>${zh ? '新签月租合同' : 'New monthly-rent contracts'}</span><strong>${numberText(detail.newContractMonthlyRentCount, lang)}</strong></div><div class="seo-card"><span>${zh ? '典型面积' : 'Typical size'}</span><strong>${escapeHtml(areaText(detail.typicalAreaSqm))}</strong></div><div class="seo-card"><span>${zh ? '全租押金中位数' : 'Median jeonse deposit'}</span><strong>${moneyHtml(detail.medianJeonseDepositWon, lang, fxRates)}</strong></div></section><nav class="seo-jump-nav" aria-label="${zh ? '页面内容' : 'Page sections'}"><a href="#deposit-rent">${zh ? '押金与月租' : 'Rent by deposit'}</a><a href="#area-rent">${zh ? '面积' : 'Floor area'}</a><a href="#recent-contracts">${zh ? '近期成交' : 'Recent contracts'}</a>${salesSection ? `<a href="#recent-sales">${zh ? '买卖成交' : 'Sales'}</a>` : ''}</nav><section class="seo-section" id="deposit-rent"><h2>${zh ? '按押金区间看月租' : 'Monthly rent by deposit'}</h2><p>${zh ? '同一押金区间内比较月租；新签合同数量足够时优先使用新签合同。' : 'Monthly rent is compared within the same deposit range. New contracts are preferred when enough are identified.'}</p>${depositBandsHtml(detail.depositBands, lang, fxRates)}</section><section class="seo-section" id="area-rent"><h2>${zh ? '按使用面积比较' : 'By floor area'}</h2><p>${zh ? '59㎡和84㎡等不同面积不会再合成一个建筑“典型月租”。' : 'Different size groups, such as roughly 60㎡ and 85㎡, are kept separate instead of being blended into one building-wide rent figure.'}</p>${areaGroupsHtml(detail.areaGroups, lang, fxRates)}</section><section class="seo-section"><h2>${zh ? '新签 vs 续签' : 'New vs renewal'}</h2>${contractMixHtml(detail.contractTypeCounts, lang)}</section><section class="seo-section" id="rent-trend"><h2>${zh ? '原始月租走势' : 'Raw monthly-rent trend'}</h2><p>${zh ? '此走势会混合不同押金结构，只作为原始成交活动参考；判断具体报价时请使用上方押金区间。' : 'This raw trend can mix different deposit structures. Use the deposit-band sections above for a specific rent comparison.'}</p><div class="seo-trend">${trend || `<p>${zh ? '月度数据不足，暂不显示走势。' : 'Not enough monthly observations to show a trend.'}</p>`}</div></section><section class="seo-section" id="recent-contracts"><h2>${zh ? '近期签约成交' : 'Recent signed contracts'}</h2><p>${zh ? '以下是近期已申报成交记录，不是当前房源。' : 'These are recently reported signed contracts, not live inventory.'}</p>${recentContractsTable(detail.recentTransactions, lang, fxRates, false)}</section>${salesSection}<p class="seo-market-note">${zh ? '数据用于市场参考。具体房屋的楼层、朝向、装修与合同条件可能不同。买卖与租赁数据均来自各自的官方申报成交数据。' : 'Use this as market context. Individual units can differ by floor, orientation, condition and contract terms. Rental and sale transactions are displayed as separate official reported datasets.'}</p></div>${contextRailHtml({ lang, rentCheckPath:rentPath, explorePath:dongPath, building:true })}${footer(lang)}</main></body></html>`;
}

async function fetchFxRates(fetchImpl = fetch) {
  try {
    const response = await fetchImpl('https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,CNY');
    if (!response || !response.ok) return {};
    const data = await response.json();
    const usd = Number(data && data.rates && data.rates.USD);
    const cny = Number(data && data.rates && data.rates.CNY);
    const rates = {};
    if (Number.isFinite(usd) && usd > 0) rates.USD = usd;
    if (Number.isFinite(cny) && cny > 0) rates.CNY = cny;
    return rates;
  } catch (_) {
    return {};
  }
}

function renderErrorPage({ lang = 'en', status = 404, title, message, actionHref, robots = 'noindex,follow' }) {
  const zh = isZh(lang);
  const safeTitle = title || (status === 503 ? (zh ? '数据暂时不可用' : 'Data temporarily unavailable') : (zh ? '未找到该市场页面' : 'Market page not found'));
  const safeMessage = message || (status === 503 ? (zh ? '官方成交数据暂时无法加载，请稍后再试。' : 'Official transaction data could not be loaded right now. Please try again later.') : (zh ? '该地址没有可用的近期官方成交数据。' : 'No recent official transaction data is available for this address.'));
  const safeActionHref = actionHref || (zh ? '/zh/explore/' : '/explore/');
  const dummy = '/';
  const head = pageHead({ lang, title:safeTitle, description:safeMessage, canonicalPath:dummy, alternateEn:'/', alternateZh:'/zh/', robots });
  return `${head}<main class="seo-error"><span class="seo-eyebrow">${status}</span><h1>${escapeHtml(safeTitle)}</h1><p>${escapeHtml(safeMessage)}</p><a class="seo-action" href="${escapeHtml(safeActionHref)}">${zh ? '打开租金探索' : 'Open Rent Explorer'}</a></main></body></html>`;
}

module.exports = {
  ORIGIN,
  escapeHtml,
  moneyHtml,
  districtDisplay,
  dongDisplay,
  propertyDisplay,
  isBuildingIndexable,
  renderDongPage,
  renderBuildingPage,
  renderErrorPage,
  fetchFxRates
};
