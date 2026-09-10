'use strict';

const KHGLocations = require('../location-catalog.js');
const { buildDongSeoUrl } = require('./seo-route-utils.cjs');
const { opportunityPath } = require('./opportunity-market.cjs');
const { escapeHtml, moneyHtml } = require('./seo-page-renderer.cjs');
const { supportsZhIndexing } = require('../providers/seoul-config.cjs');

const ORIGIN = 'https://koreahomeguide.com';
const LICENSE = 'https://www.data.go.kr/ugs/selectPortalPolicyView.do';

function isZh(lang) {
  return String(lang || '').toLowerCase().startsWith('zh');
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function numberText(value, lang) {
  return Number(value || 0).toLocaleString(isZh(lang) ? 'zh-CN' : 'en-US');
}

function threeMonthCoverage(dataThroughMonth) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(dataThroughMonth || ''));
  if (!match) return undefined;
  const endYear = Number(match[1]);
  const endMonth = Number(match[2]);
  if (endMonth < 1 || endMonth > 12) return undefined;
  const start = new Date(Date.UTC(endYear, endMonth - 3, 1));
  const startMonth = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${startMonth}/${dataThroughMonth}`;
}

function propertyName(type, lang, plural = false) {
  const zh = isZh(lang);
  if (zh) return ({ apartment:'公寓', officetel:'办公公寓', villa:'低层多户住宅' })[type] || type;
  const value = ({ apartment:'apartment', officetel:'officetel', villa:'villa / low-rise home' })[type] || type;
  return plural ? `${value}s` : value;
}

function constraintCopy(query, lang) {
  const zh = isZh(lang);
  if (query.mode === 'budget') {
    const money = `₩${numberText(query.budgetWon, lang)}`;
    return zh ? {
      title:`首尔月租不超过${money}的${propertyName(query.propertyType, lang)}`,
      eyebrow:'按月租预算找地区',
      summary:`按近期已申报成交中，同一押金区间的月租中位数不超过${money}进行筛选。`,
      constraint:money
    } : {
      title:`Seoul ${propertyName(query.propertyType, lang, true)} under ${money}`,
      eyebrow:'EXPLORE BY MONTHLY BUDGET',
      summary:`Neighborhoods are screened using a median monthly rent at or below ${money} within one matching deposit band.`,
      constraint:money
    };
  }
  const money = `₩${numberText(query.depositWon, lang)}`;
  return zh ? {
    title:`首尔押金${numberText(query.depositWon / 10_000, lang)}万韩元的办公公寓`,
    eyebrow:'按可用押金找地区',
    summary:`本页首版仅比较办公公寓，并使用包含${money}的押金区间来比较月租。`,
    constraint:money
  } : {
    title:`Seoul officetels in the ${money} deposit band`,
    eyebrow:'EXPLORE BY AVAILABLE DEPOSIT',
    summary:`This first release compares officetels using the reported deposit band that contains ${money}.`,
    constraint:money
  };
}

function locationLabel(item, lang) {
  const locale = isZh(lang) ? 'zh-CN' : 'en';
  const district = KHGLocations.districtLabel(item.districtCode, locale);
  const dong = KHGLocations.dongLabel(item.dong, locale);
  return { district, dong };
}

function explorerPath(item, query, lang) {
  const params = new URLSearchParams({
    lawdCd:item.districtCode,
    type:query.propertyType
  });
  if (query.mode === 'budget') params.set('maxRent', String(query.budgetWon));
  else params.set('maxDeposit', String(query.depositWon));
  params.set('dong', item.dong);
  return `${isZh(lang) ? '/zh' : ''}/explore/?${params.toString()}`;
}

function datasetJsonLd({ title, description, canonical, model, dataThroughMonth }) {
  return {
    '@context':'https://schema.org',
    '@type':'Dataset',
    name:title,
    description,
    url:canonical,
    license:LICENSE,
    creator:{ '@type':'Organization', name:'KoreaHomeGuide', url:ORIGIN },
    isBasedOn:{ '@type':'Dataset', name:'Official reported rental transactions from the Ministry of Land, Infrastructure and Transport, Republic of Korea' },
    temporalCoverage:threeMonthCoverage(dataThroughMonth),
    variableMeasured:['Monthly rent','Rental deposit','Reported contract count'],
    measurementTechnique:`Three completed months; minimum ${model.query.mode === 'deposit' ? 'deposit-band' : 'budget-band'} evidence per neighborhood`
  };
}

function renderOpportunityPage({ lang = 'en', model, dataThroughMonth = '', fxRates = {} } = {}) {
  if (!model || !model.query) throw new TypeError('opportunity model is required');
  const zh = isZh(lang);
  const query = model.query;
  const copy = constraintCopy(query, lang);
  const canonicalPath = opportunityPath(query, lang);
  const alternateEn = opportunityPath(query, 'en');
  const alternateZh = opportunityPath(query, 'zh');
  const canonical = `${ORIGIN}${canonicalPath}`;
  const robots = model.indexable ? 'index,follow' : 'noindex,follow';
  const description = zh
    ? `${copy.title}：基于韩国国土交通部近3个完整月份的已申报租赁成交，按押金区间比较地区。`
    : `${copy.title}, ranked from three completed months of official reported rental contracts while keeping monthly rent and deposit in the same evidence band.`;
  const dataset = datasetJsonLd({ title:copy.title, description, canonical, model, dataThroughMonth });
  const resultEvidenceLabel = query.mode === 'deposit'
    ? (zh ? '办公公寓成交依据 · 同一押金区间月租中位数' : 'Officetel evidence · median rent in matching deposit band')
    : (zh ? '同一押金区间月租中位数' : 'Median rent in matching deposit band');
  const cards = model.neighborhoods.map((item, index) => {
    const labels = locationLabel(item, lang);
    const dongPath = buildDongSeoUrl({ areaCode:item.districtCode, dong:item.dong, propertyType:query.propertyType, lang });
    const explore = explorerPath(item, query, lang);
    const evidenceLink = !zh || supportsZhIndexing(item.districtCode)
      ? `<a href="${escapeHtml(dongPath)}">${zh ? '查看地区成交依据' : 'View neighborhood evidence'}</a>`
      : '';
    return `<li class="opportunity-card">
<span class="opportunity-rank">${index + 1}</span>
<div class="opportunity-place">
<span>${escapeHtml(labels.district)}</span>
<h2>${escapeHtml(labels.dong)}</h2>
</div>
<div class="opportunity-price">
<span>${resultEvidenceLabel}</span>${moneyHtml(item.medianMonthlyRentWon, lang, fxRates)}</div>
<div class="opportunity-facts">
<span>${zh ? '该组押金中位数' : 'Median deposit in this band'} <b>${moneyHtml(item.medianDepositWon, lang, fxRates)}</b>
</span>
<span>${numberText(item.matchingContractCount, lang)} ${zh ? '笔匹配成交' : 'matching contracts'}</span>
</div>
<div class="opportunity-actions">
${evidenceLink}
<a class="primary" href="${escapeHtml(explore)}">${zh ? '在地图中打开' : 'Open on the map'} →</a>
</div>
</li>`;
  }).join('');
  const limited = model.indexable ? '' : `<div class="opportunity-limited" role="status">${zh ? '这一精确条件的证据仍然有限，因此本页暂不进入搜索索引。' : 'Evidence is still limited for this exact constraint, so this page is not included in search indexing yet.'}</div>`;
  const rentParams = new URLSearchParams({ type:query.propertyType });
  if (query.mode === 'budget') rentParams.set('rent', String(query.budgetWon));
  else rentParams.set('deposit', String(query.depositWon));
  const rentCheckPath = `${zh ? '/zh' : ''}/tools/seoul-rent-check/?${rentParams.toString()}`;
  const methodCopy = zh
    ? `本页使用韩国国土交通部已申报的${propertyName(query.propertyType, lang)}月租成交，覆盖近3个完整月份，数据截至 ${dataThroughMonth || '—'}。每个地区至少需要3笔同一押金区间成交；页面至少需要3个地区和15笔匹配成交才会进入搜索索引。月租较低者优先；这不是当前房源列表。`
    : `This page uses three completed months of reported ${propertyName(query.propertyType, lang)} rental contracts from MOLIT, data through ${dataThroughMonth || '—'}. Each neighborhood needs at least three contracts in one matching deposit band; the page needs three neighborhoods and fifteen matching contracts to enter search indexing. Lower contextual median rent ranks first. This is not a list of current homes.`;

  return `<!doctype html>
<html lang="${zh ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(copy.title)} | KoreaHomeGuide</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="alternate" hreflang="en" href="${ORIGIN}${escapeHtml(alternateEn)}">
<link rel="alternate" hreflang="zh-CN" href="${ORIGIN}${escapeHtml(alternateZh)}">
<link rel="alternate" hreflang="x-default" href="${ORIGIN}${escapeHtml(alternateEn)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(copy.title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:image" content="${ORIGIN}/assets/og/og-default.png">
<script defer src="/privacy-consent.js"></script>
<script defer src="/mobile-navigation.js"></script>
<script defer src="/acquisition-context.js"></script>
<script defer src="/acquisition-links.js"></script>
<link rel="stylesheet" href="/styles.css?v=20">
<style>.opportunity-page{max-width:1080px;margin:0 auto;padding:42px 22px 80px}.opportunity-breadcrumbs{margin-bottom:24px;color:var(--muted);font-size:13px}.opportunity-breadcrumbs a{color:inherit}.opportunity-hero{max-width:820px}.opportunity-hero h1{margin:9px 0 16px;font-size:clamp(36px,6vw,64px);line-height:1.02;letter-spacing:-.045em}.opportunity-hero p{max-width:760px;color:var(--ink-soft);font-size:17px;line-height:1.65}.opportunity-meta{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:20px;color:var(--muted);font-size:12px;font-weight:700}.opportunity-limited{margin-top:22px;padding:14px 16px;border:1px solid var(--caution-line);border-radius:var(--radius-md);background:var(--caution-soft);color:var(--ink-soft);font-size:13px}.opportunity-list{display:grid;gap:12px;margin:34px 0 0;padding:0;list-style:none}.opportunity-card{display:grid;grid-template-columns:42px minmax(160px,.9fr) minmax(180px,1fr) minmax(170px,.9fr) auto;gap:18px;align-items:center;padding:20px;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--surface)}.opportunity-rank{display:grid;width:34px;height:34px;place-items:center;border-radius:50%;background:var(--surface-soft);font-size:12px;font-weight:850}.opportunity-place span,.opportunity-price>span{display:block;color:var(--muted);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.opportunity-place h2{margin:5px 0 0;font-size:20px}.opportunity-price .seo-money{font-size:20px;font-weight:820}.opportunity-price .seo-fx{font-size:10px}.opportunity-facts{display:grid;gap:6px;color:var(--muted);font-size:11px}.opportunity-facts b .seo-money{display:inline}.opportunity-actions{display:grid;gap:8px;justify-items:end}.opportunity-actions a{color:var(--ink-soft);font-size:11px;font-weight:800;text-decoration:none}.opportunity-actions .primary{color:var(--accent)}.opportunity-method{margin-top:48px;padding:26px;border-top:1px solid var(--ink);border-bottom:1px solid var(--line)}.opportunity-method h2{margin:0 0 10px}.opportunity-method p{color:var(--muted);line-height:1.65}.opportunity-cta{display:flex;justify-content:space-between;gap:24px;align-items:center;margin-top:24px;padding:24px;border-radius:var(--radius-lg);background:var(--accent-soft)}.opportunity-cta h2{margin:0 0 6px}.opportunity-cta p{margin:0;color:var(--muted)}.opportunity-cta a{display:inline-flex;min-height:44px;align-items:center;padding:0 16px;border-radius:var(--radius-md);background:var(--accent);color:var(--surface);font-weight:800;text-decoration:none;white-space:nowrap}@media(max-width:840px){.opportunity-card{grid-template-columns:42px 1fr 1fr}.opportunity-facts{grid-column:2}.opportunity-actions{grid-column:3;grid-row:2;align-self:end}}@media(max-width:620px){.opportunity-page{padding:28px 16px 72px}.opportunity-card{grid-template-columns:34px minmax(0,1fr);gap:12px}.opportunity-price,.opportunity-facts,.opportunity-actions{grid-column:2}.opportunity-actions{grid-row:auto;justify-items:start}.opportunity-cta{align-items:flex-start;flex-direction:column}}</style>
<script type="application/ld+json">${jsonForHtml(dataset)}</script>
</head>
<body>
<header class="site-header">
<a class="brand" href="${zh ? '/zh/' : '/'}">KoreaHomeGuide</a>
<nav>
<a href="${zh ? '/zh/explore/' : '/explore/'}">${zh ? '租金探索' : 'Explore'}</a>
<a href="${zh ? '/zh/tools/seoul-rent-check/' : '/tools/seoul-rent-check/'}">Rent Check</a>
<a href="${zh ? '/zh/guides/' : '/guides/'}">${zh ? '指南' : 'Guides'}</a>
</nav>
<a class="language-link" href="${zh ? alternateEn : alternateZh}">${zh ? 'EN' : '中文'}</a>
</header>
<main class="opportunity-page">
<div class="opportunity-breadcrumbs">
<a href="${zh ? '/zh/' : '/'}">Seoul</a> → ${escapeHtml(copy.constraint)}</div>
<section class="opportunity-hero">
<span class="eyebrow">${copy.eyebrow}</span>
<h1>${escapeHtml(copy.title)}</h1>
<p>${escapeHtml(copy.summary)}</p>
<div class="opportunity-meta">
<span>${zh ? `近3个完整月份 · 数据截至 ${dataThroughMonth || '—'}` : `3 completed months · data through ${dataThroughMonth || '—'}`}</span>
<span>${zh ? '韩国国土交通部已申报成交' : 'Official MOLIT reported contracts'}</span>
<span>${zh ? `${numberText(model.qualifyingContracts, lang)}笔成交 · ${numberText(model.neighborhoods.length, lang)}个地区` : `${numberText(model.qualifyingContracts, lang)} reported contracts across ${numberText(model.neighborhoods.length, lang)} neighborhoods`}</span>
</div>${limited}</section>
<ol class="opportunity-list">${cards}</ol>
<section class="opportunity-method">
<h2>${zh ? '排名方法' : 'How this ranking works'}</h2>
<p>${escapeHtml(methodCopy)}</p>
</section>
<section class="opportunity-cta">
<div>
<h2>${zh ? '有具体报价了吗？' : 'Already have a specific quote?'}</h2>
<p>${zh ? '输入押金、月租和面积，用同类已签合同检查报价。' : 'Enter deposit, rent and floor area to compare it with similar signed contracts.'}</p>
</div>
<a href="${escapeHtml(rentCheckPath)}">${zh ? '检查租金报价' : 'Check the quote'} →</a>
</section>
</main>
<footer class="page-footer">
<span>© KoreaHomeGuide</span>
<small>${zh ? '市场参考，不是房源或法律意见。' : 'Market reference, not listings or legal advice.'} <a href="${zh ? '/zh/about/' : '/about/'}">${zh ? '关于与方法' : 'About &amp; Method'}</a> · <a href="${zh ? '/zh/privacy/' : '/privacy/'}">${zh ? '隐私说明' : 'Privacy'}</a>
</small>
</footer>
</body>
</html>`;
}

module.exports = { renderOpportunityPage, constraintCopy, explorerPath, datasetJsonLd };
