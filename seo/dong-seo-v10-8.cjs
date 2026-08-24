'use strict';

const KHGDate = require('../date-utils.js');
const { SEOUL_DONGS_BY_DISTRICT } = require('../providers/seoul-config.cjs');
const { buildDongSeoUrl, dongSlugFromName } = require('./seo-route-utils.cjs');

const MIN_DONG_CONTRACTS = 3;

function isZh(lang) {
  return String(lang || '').toLowerCase().startsWith('zh');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[ch]);
}

function isDongIndexable(summary) {
  return Boolean(summary && Number(summary.totalContracts || summary.contractCount || 0) >= MIN_DONG_CONTRACTS);
}

function wonText(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `₩${Math.round(n).toLocaleString('en-US')}` : '—';
}

function areaText(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `${n.toFixed(1)}㎡` : '—';
}

function dongLabel(dong, lang) {
  const slug = dongSlugFromName(dong);
  if (isZh(lang)) return String(dong || slug || '');
  if (!slug) return String(dong || '');
  return slug.split('-').map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : part).join('-');
}

function buildRelatedDongLinks({ areaCode, dong, propertyType, lang = 'en' }) {
  const rows = SEOUL_DONGS_BY_DISTRICT[String(areaCode)] || [];
  return rows
    .filter(item => item !== dong)
    .slice(0, 6)
    .map(item => {
      const href = buildDongSeoUrl({ areaCode, dong:item, propertyType, lang });
      if (!href) return '';
      return `<a class="seo-action" href="${escapeHtml(href)}">${escapeHtml(dongLabel(item, lang))}</a>`;
    })
    .filter(Boolean)
    .join('');
}

function coreMetricsHtml({ summary, lang = 'en' }) {
  const zh = isZh(lang);
  const contracts = Number(summary && (summary.totalContracts || summary.contractCount) || 0).toLocaleString(zh ? 'zh-CN' : 'en-US');
  return `<section class="seo-grid seo-dong-core-metrics"><div class="seo-card"><span>${zh ? '近期成交' : 'Recent contracts'}</span><strong>${contracts}</strong><small>${zh ? '近6个完整月份' : 'Last 6 completed months'}</small></div><div class="seo-card seo-card-primary"><span>${zh ? '月租中位数' : 'Median monthly rent'}</span><strong>${escapeHtml(wonText(summary && summary.medianMonthlyRentWon))}</strong></div><div class="seo-card"><span>${zh ? '押金中位数' : 'Median deposit'}</span><strong>${escapeHtml(wonText(summary && summary.medianDepositWon))}</strong></div><div class="seo-card"><span>${zh ? '面积中位数' : 'Median size'}</span><strong>${escapeHtml(areaText(summary && summary.typicalAreaSqm))}</strong></div></section>`;
}

function marketSnapshotHtml({ summary, lang = 'en', dong, districtName, propertyType }) {
  const zh = isZh(lang);
  const count = Number(summary && (summary.totalContracts || summary.contractCount) || 0).toLocaleString(zh ? 'zh-CN' : 'en-US');
  const dataMonth = summary && summary.dataThroughMonth ? KHGDate.formatMonth(summary.dataThroughMonth, zh ? 'zh-CN' : 'en-US') : (zh ? '最近完整月份' : 'the latest completed month');
  const rent = wonText(summary && summary.medianMonthlyRentWon);
  const deposit = wonText(summary && summary.medianDepositWon);
  const size = areaText(summary && summary.typicalAreaSqm);
  const body = zh
    ? `截至${escapeHtml(dataMonth)}，${escapeHtml(String(dong || '该区域'))}的${escapeHtml(String(propertyType || '住宅'))}页面基于${count}笔已申报成交。当前样本的月租中位数为${escapeHtml(rent)}，押金中位数为${escapeHtml(deposit)}，典型面积约${escapeHtml(size)}。这些数字用于理解市场区间，不代表当前挂牌价。`
    : `Based on ${count} reported ${escapeHtml(String(propertyType || 'rental'))} contracts through ${escapeHtml(dataMonth)}, the median monthly rent in ${escapeHtml(dongLabel(dong, 'en'))}, ${escapeHtml(String(districtName || 'Seoul'))}, is ${escapeHtml(rent)} with a median deposit of ${escapeHtml(deposit)} and a typical observed size of ${escapeHtml(size)}. These are signed-market reference points, not live asking prices.`;
  return `<section class="seo-section seo-market-snapshot"><h2>${zh ? '市场概览' : 'Market snapshot'}</h2><p>${body}</p></section>`;
}

function relatedNeighborhoodsHtml({ areaCode, dong, propertyType, lang = 'en' }) {
  const zh = isZh(lang);
  const links = buildRelatedDongLinks({ areaCode, dong, propertyType, lang });
  if (!links) return '';
  return `<section class="seo-section seo-nearby-neighborhoods"><h2>${zh ? '附近街区' : 'Nearby neighborhoods'}</h2><p>${zh ? '继续比较同一区内的近期官方成交。' : 'Compare other curated neighborhoods in the same district using the same official transaction methodology.'}</p><div class="seo-actions">${links}</div></section>`;
}

function enhanceDongHtml(html, options = {}) {
  const source = String(html || '');
  if (!source || !isDongIndexable(options.summary)) return source;
  const zh = isZh(options.lang);
  const metrics = coreMetricsHtml(options);
  const snapshot = marketSnapshotHtml(options);
  const nearby = relatedNeighborhoodsHtml(options);
  let out = source;
  if (!zh) out = out.replace(/ Rent Prices \| Seoul/g, ' Rent Market | Seoul').replace(/ Rent Prices<\/h1>/g, ' Rent Market</h1>');
  out = out.replace(/<section class="seo-grid">[\s\S]*?<\/section><section class="seo-section"><h2>/, `${metrics}<section class="seo-section"><h2>`);
  const marker = zh ? '<section class="seo-section"><h2>继续比较</h2>' : '<section class="seo-section"><h2>Continue comparing</h2>';
  if (out.includes(marker)) out = out.replace(marker, `${snapshot}${nearby}${marker}`);
  return out;
}

module.exports = {
  MIN_DONG_CONTRACTS,
  isDongIndexable,
  buildRelatedDongLinks,
  coreMetricsHtml,
  marketSnapshotHtml,
  relatedNeighborhoodsHtml,
  enhanceDongHtml
};
