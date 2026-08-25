'use strict';

const KHGDate = require('../date-utils.js');
const { SEOUL_DONGS_BY_DISTRICT } = require('../providers/seoul-config.cjs');
const { buildDongSeoUrl, dongSlugFromName } = require('./seo-route-utils.cjs');

const MIN_DONG_CONTRACTS = 3;

const ZH_DONG_LABELS = Object.freeze({
  '역삼동':'驿三洞 (역삼동)', '논현동':'论岘洞 (논현동)', '대치동':'大峙洞 (대치동)',
  '삼성동':'三成洞 (삼성동)', '청담동':'清潭洞 (청담동)', '연남동':'延南洞 (연남동)',
  '서교동':'西桥洞 (서교동)', '망원동':'望远洞 (망원동)', '합정동':'合井洞 (합정동)',
  '공덕동':'孔德洞 (공덕동)', '아현동':'阿岘洞 (아현동)', '이태원동':'梨泰院洞 (이태원동)',
  '한남동':'汉南洞 (한남동)', '후암동':'厚岩洞 (후암동)', '보광동':'普光洞 (보광동)',
  '성수동1가':'圣水洞1街 (성수동1가)', '성수동2가':'圣水洞2街 (성수동2가)', '옥수동':'玉水洞 (옥수동)',
  '금호동1가':'金湖洞1街 (금호동1가)', '금호동2가':'金湖洞2街 (금호동2가)',
  '금호동3가':'金湖洞3街 (금호동3가)', '금호동4가':'金湖洞4街 (금호동4가)',
  '여의도동':'汝矣岛洞 (여의도동)', '당산동':'堂山洞 (당산동)', '문래동':'文来洞 (문래동)',
  '영등포동':'永登浦洞 (영등포동)'
});

const ZH_PROPERTY_LABELS = Object.freeze({
  apartment:'公寓', officetel:'Officetel（办公住宅）', villa:'低层住宅（联排/多户住宅）', detached:'独栋 / 多户住宅'
});

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
  const raw = String(dong || '');
  const slug = dongSlugFromName(raw);
  if (isZh(lang)) return ZH_DONG_LABELS[raw] || raw || slug || '';
  if (!slug) return raw;
  return slug.split('-').map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : part).join('-');
}

function propertyLabel(propertyType, lang) {
  const raw = String(propertyType || '');
  if (isZh(lang)) return ZH_PROPERTY_LABELS[raw] || raw || '住宅';
  return raw || 'rental';
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
    ? `截至${escapeHtml(dataMonth)}，${escapeHtml(dongLabel(dong, 'zh'))}${escapeHtml(propertyLabel(propertyType, 'zh'))}页面基于${count}笔已申报成交。当前样本的月租中位数为${escapeHtml(rent)}，押金中位数为${escapeHtml(deposit)}，典型面积约${escapeHtml(size)}。这些数字用于理解市场区间，不代表当前挂牌价。`
    : `Based on ${count} reported ${escapeHtml(propertyLabel(propertyType, 'en'))} contracts through ${escapeHtml(dataMonth)}, the median monthly rent in ${escapeHtml(dongLabel(dong, 'en'))}, ${escapeHtml(String(districtName || 'Seoul'))}, is ${escapeHtml(rent)} with a median deposit of ${escapeHtml(deposit)} and a typical observed size of ${escapeHtml(size)}. These are signed-market reference points, not live asking prices.`;
  return `<section class="seo-section seo-market-snapshot"><h2>${zh ? '市场概览' : 'Market snapshot'}</h2><p>${body}</p></section>`;
}

function relatedNeighborhoodsHtml({ areaCode, dong, propertyType, lang = 'en' }) {
  const zh = isZh(lang);
  const links = buildRelatedDongLinks({ areaCode, dong, propertyType, lang });
  if (!links) return '';
  return `<section class="seo-section seo-nearby-neighborhoods"><h2>${zh ? '附近街区' : 'Nearby neighborhoods'}</h2><p>${zh ? '继续比较同一区内的近期官方成交。' : 'Compare other curated neighborhoods in the same district using the same official transaction methodology.'}</p><div class="seo-actions">${links}</div></section>`;
}


function transactionTransparencyNoteHtml(lang = 'en') {
  return isZh(lang)
    ? '<p class="seo-market-note">外观相同的记录可能来自不同的已申报合同。只有在稳定的来源标识能够确认重复时，KoreaHomeGuide 才会合并记录；不会仅凭日期、面积、押金和月租相同而删除。</p>'
    : '<p class="seo-market-note">Identical-looking rows can represent separate reported contracts. KoreaHomeGuide only collapses records when a stable source identifier proves they are duplicates; matching date, size, deposit and rent alone are not enough.</p>';
}

function addRecentContractContext(html, { lang = 'en', summary } = {}) {
  const source = String(html || '');
  const zh = isZh(lang);
  const heading = zh ? '近期签约成交' : 'Recently signed contracts';
  const sectionPattern = new RegExp(`<section class="seo-section"><h2>${heading}</h2>[\\s\\S]*?</section>`);
  const match = source.match(sectionPattern);
  if (!match) return source;

  let section = match[0];
  const recent = Array.isArray(summary && summary.recentTransactions) ? summary.recentTransactions.slice(0, 10) : [];
  const hasFloor = recent.some(item => Number.isFinite(Number(item && item.floor)));

  if (hasFloor) {
    const dateHeader = zh ? '<th>签约日期</th>' : '<th>Contract date</th>';
    const floorHeader = zh ? '<th>楼层</th>' : '<th>Floor</th>';
    if (!section.includes(floorHeader) && section.includes(dateHeader)) {
      section = section.replace(dateHeader, `${floorHeader}${dateHeader}`);
      section = section.replace(/<tbody>([\s\S]*?)<\/tbody>/, (_, body) => {
        let index = 0;
        const rows = body.replace(/<tr>[\s\S]*?<\/tr>/g, row => {
          const item = recent[index++] || {};
          const floor = Number(item.floor);
          const floorText = Number.isFinite(floor) ? `${escapeHtml(String(floor))}F` : '—';
          const lastCell = row.lastIndexOf('<td>');
          if (lastCell < 0) return row;
          return `${row.slice(0, lastCell)}<td>${floorText}</td>${row.slice(lastCell)}`;
        });
        return `<tbody>${rows}</tbody>`;
      });
    }
  }

  if (!section.includes('seo-market-note')) {
    section = section.replace('</section>', `${transactionTransparencyNoteHtml(lang)}</section>`);
  }
  return source.replace(match[0], section);
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
  out = addRecentContractContext(out, options);
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
  transactionTransparencyNoteHtml,
  addRecentContractContext,
  enhanceDongHtml
};
