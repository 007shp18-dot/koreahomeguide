const KHGDate = require('../date-utils.js');
const {
  dongSlugFromName,
  buildDongSeoUrl,
  buildBuildingSeoUrl,
  buildingSlug
} = require('./seo-route-utils.cjs');

const ORIGIN = 'https://koreahomeguide.com';

const ZH_DONG_LABELS = Object.freeze({
  '연남동':'延南洞 (연남동)'
});

const ZH_DISTRICT_LABELS = Object.freeze({
  'Gangnam-gu':'江南区 (Gangnam-gu)',
  'Mapo-gu':'麻浦区 (Mapo-gu)',
  'Yongsan-gu':'龙山区 (Yongsan-gu)',
  'Seongdong-gu':'城东区 (Seongdong-gu)',
  'Yeongdeungpo-gu':'永登浦区 (Yeongdeungpo-gu)'
});

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

function districtDisplay(name, lang) {
  if (isZh(lang)) return ZH_DISTRICT_LABELS[name] || name;
  return name;
}

function dongDisplay(dong, lang) {
  const raw = String(dong || '');
  if (isZh(lang)) return ZH_DONG_LABELS[raw] || raw;
  const slug = dongSlugFromName(raw);
  if (!slug || /[\p{Script=Hangul}]/u.test(slug)) return raw;
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function propertyDisplay(type, lang) {
  const en = { apartment:'Apartment', officetel:'Officetel', villa:'Villa / Multi-family' };
  const zh = { apartment:'公寓', officetel:'Officetel（办公住宅）', villa:'Villa / 多户住宅' };
  return (isZh(lang) ? zh : en)[type] || type;
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
      zh:buildBuildingSeoUrl({ areaCode, dong, propertyType, building, lang:'zh' })
    };
  }
  return {
    en:buildDongSeoUrl({ areaCode, dong, propertyType, lang:'en' }),
    zh:buildDongSeoUrl({ areaCode, dong, propertyType, lang:'zh' })
  };
}

function pageHead({ lang, title, description, canonicalPath, alternateEn, alternateZh, robots = 'index,follow', jsonLd }) {
  const canonical = `${ORIGIN}${canonicalPath}`;
  const htmlLang = isZh(lang) ? 'zh-CN' : 'en';
  return `<!doctype html><html lang="${htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${escapeHtml(robots)}"><link rel="canonical" href="${escapeHtml(canonical)}"><link rel="alternate" hreflang="en" href="${escapeHtml(`${ORIGIN}${alternateEn}`)}"><link rel="alternate" hreflang="zh-CN" href="${escapeHtml(`${ORIGIN}${alternateZh}`)}"><link rel="alternate" hreflang="x-default" href="${escapeHtml(`${ORIGIN}${alternateEn}`)}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><script async src="https://www.googletagmanager.com/gtag/js?id=G-6SXH5BREDP"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-6SXH5BREDP');</script><link rel="stylesheet" href="/styles.css"><style>.seo-page{max-width:1040px;margin:0 auto;padding:42px 22px 72px}.seo-breadcrumbs{font-size:14px;color:#667085;margin-bottom:20px}.seo-breadcrumbs a{color:inherit}.seo-hero h1{font-size:clamp(32px,5vw,54px);line-height:1.04;margin:8px 0 14px}.seo-hero p{max-width:780px;color:#475467;font-size:17px;line-height:1.65}.seo-eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.seo-fresh{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:18px;color:#667085;font-size:13px}.seo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:28px 0}.seo-card,.seo-section{border:1px solid #e4e7ec;border-radius:18px;background:#fff}.seo-card{padding:18px}.seo-card span{display:block;color:#667085;font-size:13px}.seo-card strong{display:block;font-size:22px;margin-top:8px}.seo-money{display:block}.seo-krw{display:block;color:#667085;font-weight:500;margin-top:3px}.seo-section{padding:24px;margin-top:18px}.seo-section h2{margin:0 0 8px;font-size:24px}.seo-section p{color:#667085}.seo-buildings{display:grid;gap:10px;margin-top:16px}.seo-building-link{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid #eef0f3;color:inherit;text-decoration:none}.seo-building-link:first-child{border-top:0}.seo-building-link span:last-child{text-align:right;color:#667085}.seo-table-wrap{overflow-x:auto}.seo-table{width:100%;border-collapse:collapse;min-width:680px}.seo-table th,.seo-table td{padding:12px 10px;border-bottom:1px solid #eef0f3;text-align:left;vertical-align:top}.seo-table th{font-size:12px;color:#667085;text-transform:uppercase}.seo-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.seo-action{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:12px;border:1px solid #d0d5dd;text-decoration:none;color:#101828;font-weight:700}.seo-action.primary{background:#101828;color:#fff;border-color:#101828}.seo-trend{display:flex;gap:10px;align-items:flex-end;overflow-x:auto;margin-top:18px}.seo-trend-item{min-width:96px;padding:12px;border:1px solid #eef0f3;border-radius:12px}.seo-trend-item strong,.seo-trend-item small{display:block}.seo-footer{margin-top:34px;color:#667085;font-size:13px}.seo-error{max-width:680px;margin:80px auto;padding:0 22px}.seo-error h1{font-size:38px}.seo-error p{color:#667085;line-height:1.6}@media(max-width:760px){.seo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.seo-page{padding-top:28px}.seo-building-link{display:block}.seo-building-link span:last-child{text-align:left;display:block;margin-top:6px}}@media(max-width:420px){.seo-grid{grid-template-columns:1fr}}</style>${jsonLd ? `<script type="application/ld+json">${jsonForHtml(jsonLd)}</script>` : ''}</head><body>`;
}

function header(lang, switchPath) {
  const zh = isZh(lang);
  return `<header class="compact-header"><a class="brand" href="${zh ? '/zh/' : '/'}"><span class="brand-mark">K</span><span>KoreaHomeGuide</span></a><nav><a href="${zh ? '/zh/explore/' : '/explore/'}">${zh ? '租金探索' : 'Rent Explorer'}</a><a href="${zh ? '/zh/tools/seoul-rent-check/' : '/tools/seoul-rent-check/'}">${zh ? '租金检查' : 'Rent Check'}</a><a href="${zh ? '/zh/guides/wolse-vs-jeonse/' : '/guides/wolse-vs-jeonse/'}">${zh ? '指南' : 'Guides'}</a></nav><div class="header-actions"><a class="language-link" href="${escapeHtml(switchPath)}">${zh ? 'English' : '中文'}</a></div></header>`;
}

function footer(lang) {
  return `<footer class="seo-footer"><strong>KoreaHomeGuide</strong> · ${isZh(lang) ? '韩国官方申报租赁成交数据的市场参考。' : 'Official reported rental transaction data for general market reference.'}</footer>`;
}

function webPageDatasetJsonLd({ lang, title, description, canonicalPath, districtName, dong, propertyType }) {
  const zh = isZh(lang);
  return {
    '@context':'https://schema.org',
    '@graph':[
      { '@type':'WebPage', name:title, description, url:`${ORIGIN}${canonicalPath}`, inLanguage:zh ? 'zh-CN' : 'en' },
      { '@type':'Dataset', name:zh ? `${dong}租赁成交统计` : `${dong} rental transaction statistics`, description:zh ? '基于韩国国土交通部申报租赁成交数据整理的近期市场统计。' : 'Recent market statistics derived from rental transactions reported to Korea’s Ministry of Land, Infrastructure and Transport.', spatialCoverage:`${dong}, ${districtName}, Seoul`, temporalCoverage:'latest six completed months', variableMeasured:propertyType, creator:{ '@type':'Organization', name:'KoreaHomeGuide' }, isBasedOn:{ '@type':'Dataset', name:zh ? '韩国国土交通部租赁成交数据' : 'MOLIT reported rental transaction data', creator:{ '@type':'GovernmentOrganization', name:'Ministry of Land, Infrastructure and Transport, Republic of Korea' } } }
    ]
  };
}

function recentContractsTable(items, lang, rates, withBuilding = true) {
  const zh = isZh(lang);
  const rows = (Array.isArray(items) ? items : []).slice(0, 10);
  if (!rows.length) return `<p>${zh ? '近期没有足够的申报成交记录。' : 'No recent reported contracts were available.'}</p>`;
  return `<div class="seo-table-wrap"><table class="seo-table"><thead><tr>${withBuilding ? `<th>${zh ? '建筑' : 'Building'}</th>` : ''}<th>${zh ? '面积' : 'Size'}</th><th>${zh ? '押金' : 'Deposit'}</th><th>${zh ? '月租' : 'Monthly rent'}</th><th>${zh ? '签约日期' : 'Contract date'}</th></tr></thead><tbody>${rows.map(item => `<tr>${withBuilding ? `<td>${escapeHtml(item.building || '-')}</td>` : ''}<td>${escapeHtml(areaText(item.areaSqm))}</td><td>${moneyHtml(item.depositWon, lang, rates)}</td><td>${Number(item.monthlyRentWon) === 0 ? `<span class="seo-money">${zh ? '全租式 · ₩0' : 'Jeonse-style · ₩0'}</span>` : moneyHtml(item.monthlyRentWon, lang, rates)}</td><td>${escapeHtml(KHGDate.formatDate(item.contractDate, zh ? 'zh-CN' : 'en-US'))}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderDongPage({ lang = 'en', areaCode, districtName, dong, propertyType, summary, buildings = [], fxRates = {} }) {
  const zh = isZh(lang);
  const paths = languagePairPaths({ areaCode, dong, propertyType });
  const canonicalPath = zh ? paths.zh : paths.en;
  const dName = dongDisplay(dong, lang);
  const district = districtDisplay(districtName, lang);
  const pLabel = propertyDisplay(propertyType, lang);
  const title = zh ? `${dName} ${pLabel}租金行情 | 首尔` : `${dName} ${pLabel} Rent Prices | Seoul`;
  const description = zh
    ? `查看${district}${dName}${pLabel}近6个完整月份的韩国官方申报租赁成交：月租、押金、全租押金、近期成交与建筑数据。`
    : `See six completed months of official reported ${pLabel.toLowerCase()} rental transactions in ${dName}, ${districtName}: rent, deposits, recent contracts and buildings.`;
  const jsonLd = webPageDatasetJsonLd({ lang, title, description, canonicalPath, districtName, dong, propertyType });
  const head = pageHead({ lang, title, description, canonicalPath, alternateEn:paths.en, alternateZh:paths.zh, robots:'index,follow', jsonLd });
  const switchPath = zh ? paths.en : paths.zh;
  const dataMonth = summary && summary.dataThroughMonth ? KHGDate.formatMonth(summary.dataThroughMonth, zh ? 'zh-CN' : 'en-US') : (zh ? '最近完整月份' : 'Latest completed months');
  const buildingLinks = (Array.isArray(buildings) ? buildings : []).filter(item => item && item.buildingName && item.buildingKey).slice(0, 30).map(item => {
    const href = buildBuildingSeoUrl({ areaCode, dong, propertyType, building:item, lang });
    return `<a class="seo-building-link" href="${escapeHtml(href)}"><span><strong>${escapeHtml(item.buildingName)}</strong><small>${escapeHtml(areaText(item.typicalAreaSqm))} · ${numberText(item.contractCount, lang)} ${zh ? '笔成交' : 'contracts'}</small></span><span>${item.medianMonthlyRentWon == null ? '—' : moneyHtml(item.medianMonthlyRentWon, lang, fxRates)}</span></a>`;
  }).join('');
  const exploreParams = new URLSearchParams({ lawdCd:String(areaCode), type:String(propertyType), dong:String(dong) }).toString();
  const rentCheckPath = `${zh ? '/zh' : ''}/tools/seoul-rent-check/?${new URLSearchParams({ lawdCd:String(areaCode), type:String(propertyType) }).toString()}`;
  const otherTypes = ['apartment','officetel','villa'].filter(t => t !== propertyType).map(t => `<a class="seo-action" href="${escapeHtml(buildDongSeoUrl({ areaCode, dong, propertyType:t, lang }))}">${escapeHtml(propertyDisplay(t, lang))}</a>`).join('');
  return `${head}${header(lang, switchPath)}<main class="seo-page"><div class="seo-breadcrumbs"><a href="${zh ? '/zh/' : '/'}">${zh ? '首尔' : 'Seoul'}</a> → <a href="${zh ? `/zh/rent/${districtName.toLowerCase()}/${propertyType}/` : `/rent/${districtName.toLowerCase()}/${propertyType}/`}">${escapeHtml(district)}</a> → ${escapeHtml(dName)}</div><section class="seo-hero"><span class="seo-eyebrow">${zh ? '韩国官方租赁成交' : 'OFFICIAL RENTAL TRANSACTIONS'}</span><h1>${escapeHtml(title.replace(zh ? ' | 首尔' : ' | Seoul',''))}</h1><p>${zh ? `这里展示${escapeHtml(dName)}近期已申报并完成的租赁成交，用于了解签约前的市场价格区间。数据来自韩国国土交通部，不代表房屋估价。` : `This page summarizes recently reported completed rental contracts in ${escapeHtml(dName)} so you can understand the market before you sign. It uses Ministry of Land data and is not an appraisal.`}</p><div class="seo-fresh"><span>${zh ? '数据截至' : 'Data through'} ${escapeHtml(dataMonth)}</span><span>${zh ? '近6个完整月份' : '6-month rolling view'}</span><span>${zh ? '韩国国土交通部数据' : 'Official MOLIT data'}</span></div></section><section class="seo-grid"><div class="seo-card"><span>${zh ? '申报成交数' : 'Reported contracts'}</span><strong>${numberText(summary && (summary.totalContracts || summary.contractCount), lang)}</strong></div><div class="seo-card"><span>${zh ? '月租中位数' : 'Median monthly rent'}</span><strong>${moneyHtml(summary && summary.medianMonthlyRentWon, lang, fxRates)}</strong></div><div class="seo-card"><span>${zh ? '月租合同押金中位数' : 'Median deposit'}</span><strong>${moneyHtml(summary && summary.medianDepositWon, lang, fxRates)}</strong></div><div class="seo-card"><span>${zh ? '全租押金中位数' : 'Median jeonse deposit'}</span><strong>${moneyHtml(summary && summary.medianJeonseDepositWon, lang, fxRates)}</strong></div></section><section class="seo-section"><h2>${zh ? '近期走势' : 'Recent direction'}</h2><strong>${escapeHtml(directionText(summary && summary.quarterChangePct, lang))}</strong></section><section class="seo-section"><h2>${zh ? '近期签约成交' : 'Recently signed contracts'}</h2><p>${zh ? '以下均为已申报成交记录。月租为0时，表示全租式合同。' : 'These are completed reported contracts. A zero monthly rent indicates a jeonse-style contract.'}</p>${recentContractsTable(summary && summary.recentTransactions, lang, fxRates, true)}</section><section class="seo-section"><h2>${zh ? `${escapeHtml(dName)}的建筑` : `Buildings in ${escapeHtml(dName)}`}</h2><p>${zh ? '按近期申报成交数量展示有明确建筑名称的数据。' : 'Named buildings are shown using recent reported contract activity.'}</p><div class="seo-buildings">${buildingLinks || `<p>${zh ? '近期数据中没有足够的具名建筑记录。' : 'No named buildings had enough recent reported activity.'}</p>`}</div></section><section class="seo-section"><h2>${zh ? '继续比较' : 'Continue comparing'}</h2><div class="seo-actions"><a class="seo-action primary" href="${zh ? '/zh/explore/' : '/explore/'}?${escapeHtml(exploreParams)}">${zh ? '在租金探索中打开' : 'Open in Rent Explorer'}</a><a class="seo-action" href="${escapeHtml(rentCheckPath)}">${zh ? '检查你的实际报价' : 'Check your actual rent quote'}</a>${otherTypes}</div></section>${footer(lang)}</main></body></html>`;
}

function isBuildingIndexable(detail) {
  if (!detail || Number(detail.contractCount || 0) < 3) return false;
  const metrics = [detail.medianMonthlyRentWon, detail.medianDepositWon];
  return metrics.some(value => Number.isFinite(Number(value)) && Number(value) > 0);
}

function buildingComparison(detail, summary, dong, lang) {
  const buildingMedian = Number(detail && detail.medianMonthlyRentWon);
  const dongMedian = Number(summary && summary.medianMonthlyRentWon);
  if (!(buildingMedian > 0) || !(dongMedian > 0)) return '';
  const diff = ((buildingMedian - dongMedian) / dongMedian) * 100;
  if (Math.abs(diff) < 0.05) return isZh(lang) ? `该建筑的月租中位数与${dongDisplay(dong, lang)}中位数基本一致。` : `This building's median monthly rent is about the same as the ${dongDisplay(dong, lang)} median.`;
  const pct = Math.abs(diff).toFixed(1);
  if (isZh(lang)) return `该建筑的月租中位数约比${dongDisplay(dong, lang)}中位数${diff > 0 ? '高' : '低'}${pct}%。`;
  return `This building's median monthly rent is about ${pct}% ${diff > 0 ? 'above' : 'below'} the ${dongDisplay(dong, lang)} median.`;
}

function renderBuildingPage({ lang = 'en', areaCode, districtName, dong, propertyType, summary, detail, fxRates = {} }) {
  const zh = isZh(lang);
  const paths = languagePairPaths({ areaCode, dong, propertyType, building:detail });
  const canonicalPath = zh ? paths.zh : paths.en;
  const dName = dongDisplay(dong, lang);
  const district = districtDisplay(districtName, lang);
  const pLabel = propertyDisplay(propertyType, lang);
  const safeBuildingName = detail && detail.buildingName ? detail.buildingName : (zh ? '建筑' : 'Building');
  const title = zh ? `${safeBuildingName}租金数据 | ${dName}` : `${safeBuildingName} Rent Data | ${dName}, Seoul`;
  const description = zh ? `查看${safeBuildingName}近期韩国官方申报租赁成交、典型月租、押金、面积与${dName}市场对比。` : `See recent official reported rental transactions, typical rent, deposit, size and neighborhood comparison for ${safeBuildingName} in ${dName}, Seoul.`;
  const robots = isBuildingIndexable(detail) ? 'index,follow' : 'noindex,follow';
  const jsonLd = webPageDatasetJsonLd({ lang, title, description, canonicalPath, districtName, dong, propertyType });
  const head = pageHead({ lang, title, description, canonicalPath, alternateEn:paths.en, alternateZh:paths.zh, robots, jsonLd });
  const switchPath = zh ? paths.en : paths.zh;
  const dongPath = buildDongSeoUrl({ areaCode, dong, propertyType, lang });
  const comparison = buildingComparison(detail, summary, dong, lang);
  const trend = (detail.monthlyTrend || []).filter(point => Number(point.medianMonthlyRentWon) > 0).map(point => `<div class="seo-trend-item"><strong>${escapeHtml(KHGDate.formatMonth(point.month, zh ? 'zh-CN' : 'en-US'))}</strong>${moneyHtml(point.medianMonthlyRentWon, lang, fxRates)}<small>${numberText(point.count, lang)} ${zh ? '笔' : 'contracts'}</small></div>`).join('');
  const rentParams = new URLSearchParams({ lawdCd:String(areaCode), type:String(propertyType) });
  if (Number.isFinite(Number(detail.medianDepositWon))) rentParams.set('deposit', String(Math.round(Number(detail.medianDepositWon))));
  if (Number.isFinite(Number(detail.medianMonthlyRentWon))) rentParams.set('rent', String(Math.round(Number(detail.medianMonthlyRentWon))));
  if (Number.isFinite(Number(detail.typicalAreaSqm))) rentParams.set('area', String(Number(detail.typicalAreaSqm).toFixed(1)));
  const rentPath = `${zh ? '/zh' : ''}/tools/seoul-rent-check/?${rentParams.toString()}`;
  return `${head}${header(lang, switchPath)}<main class="seo-page"><div class="seo-breadcrumbs"><a href="${zh ? '/zh/' : '/'}">${zh ? '首尔' : 'Seoul'}</a> → ${escapeHtml(district)} → <a href="${escapeHtml(dongPath)}">${escapeHtml(dName)}</a> → ${escapeHtml(safeBuildingName)}</div><section class="seo-hero"><span class="seo-eyebrow">${zh ? '建筑租赁成交数据' : 'BUILDING RENT DATA'}</span><h1>${escapeHtml(safeBuildingName)}</h1><p>${escapeHtml(district)} · ${escapeHtml(dName)} · ${escapeHtml(pLabel)}</p><p>${zh ? '以下数据来自近期已申报的租赁成交，用于提供市场参考。建筑内不同房屋的楼层、朝向、装修与合同条件可能不同。' : 'These figures summarize recent reported rental contracts for market context. Individual units can differ by floor, orientation, condition and contract terms.'}</p></section><section class="seo-grid"><div class="seo-card"><span>${zh ? '月租中位数' : 'Median monthly rent'}</span><strong>${moneyHtml(detail.medianMonthlyRentWon, lang, fxRates)}</strong></div><div class="seo-card"><span>${zh ? '押金中位数' : 'Median deposit'}</span><strong>${moneyHtml(detail.medianDepositWon, lang, fxRates)}</strong></div><div class="seo-card"><span>${zh ? '典型面积' : 'Typical size'}</span><strong>${escapeHtml(areaText(detail.typicalAreaSqm))}</strong></div><div class="seo-card"><span>${zh ? '近6个月成交数' : '6-month contracts'}</span><strong>${numberText(detail.contractCount, lang)}</strong></div></section>${comparison ? `<section class="seo-section"><h2>${zh ? '与街区比较' : 'Compared with the neighborhood'}</h2><p>${escapeHtml(comparison)}</p></section>` : ''}<section class="seo-section"><h2>${zh ? '月度租金走势' : 'Monthly rent trend'}</h2><div class="seo-trend">${trend || `<p>${zh ? '月度数据不足，暂不显示走势。' : 'Not enough monthly observations to show a trend.'}</p>`}</div></section><section class="seo-section"><h2>${zh ? '近期签约成交' : 'Recent signed contracts'}</h2>${recentContractsTable(detail.recentTransactions, lang, fxRates, false)}</section><section class="seo-section"><div class="seo-actions"><a class="seo-action primary" href="${escapeHtml(rentPath)}">${zh ? '检查这个租金报价' : 'Check this rent'}</a><a class="seo-action" href="${escapeHtml(dongPath)}">${zh ? `返回${escapeHtml(dName)}` : `Back to ${escapeHtml(dName)}`}</a></div></section>${footer(lang)}</main></body></html>`;
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

function renderErrorPage({ lang = 'en', status = 404, title, message }) {
  const zh = isZh(lang);
  const safeTitle = title || (status === 503 ? (zh ? '数据暂时不可用' : 'Data temporarily unavailable') : (zh ? '未找到该市场页面' : 'Market page not found'));
  const safeMessage = message || (status === 503 ? (zh ? '官方成交数据暂时无法加载，请稍后再试。' : 'Official transaction data could not be loaded right now. Please try again later.') : (zh ? '该地址没有可用的近期官方成交数据。' : 'No recent official transaction data is available for this address.'));
  const dummy = '/';
  const head = pageHead({ lang, title:safeTitle, description:safeMessage, canonicalPath:dummy, alternateEn:'/', alternateZh:'/zh/', robots:'noindex,follow' });
  return `${head}<main class="seo-error"><span class="seo-eyebrow">${status}</span><h1>${escapeHtml(safeTitle)}</h1><p>${escapeHtml(safeMessage)}</p><a class="seo-action" href="${zh ? '/zh/explore/' : '/explore/'}">${zh ? '打开租金探索' : 'Open Rent Explorer'}</a></main></body></html>`;
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
