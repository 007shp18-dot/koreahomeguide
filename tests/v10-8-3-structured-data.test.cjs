const test = require('node:test');
const assert = require('node:assert/strict');
const { enhanceDongHtml } = require('../seo/dong-seo-v10-8.cjs');

const summary = {
  totalContracts: 371,
  medianMonthlyRentWon: 600000,
  medianDepositWon: 20000000,
  typicalAreaSqm: 29.9,
  dataThroughMonth: '2026-07',
  recentTransactions: []
};

test('Chinese Dong JSON-LD localizes dataset fields and uses machine-readable six-month coverage', () => {
  const jsonLd = {
    '@context':'https://schema.org',
    '@graph':[
      { '@type':'WebPage', name:'延南洞租金行情', inLanguage:'zh-CN' },
      {
        '@type':'Dataset',
        name:'연남동租赁成交统计',
        description:'基于韩国国土交通部申报租赁成交数据整理的近期市场统计。',
        spatialCoverage:'연남동, Mapo-gu, Seoul',
        temporalCoverage:'latest six completed months',
        variableMeasured:'villa',
        isBasedOn:{
          '@type':'Dataset',
          name:'韩国国土交通部租赁成交数据',
          creator:{ '@type':'GovernmentOrganization', name:'Ministry of Land, Infrastructure and Transport, Republic of Korea' }
        }
      }
    ]
  };
  const html = `<html><head><script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body><section class="seo-grid"><div>old metrics</div></section><section class="seo-section"><h2>继续比较</h2><div></div></section></body></html>`;
  const out = enhanceDongHtml(html, {
    lang:'zh', areaCode:'11440', districtName:'Mapo-gu', dong:'연남동', propertyType:'villa', summary
  });

  assert.match(out, /"name":"延南洞 \(연남동\) 租赁成交统计"/);
  assert.match(out, /"spatialCoverage":"延南洞 \(연남동\), 麻浦区 \(Mapo-gu\), 首尔"/);
  assert.match(out, /"temporalCoverage":"2026-02\/2026-07"/);
  assert.match(out, /"variableMeasured":"低层住宅（联排\/多户住宅）租金"/);
  assert.match(out, /"name":"韩国国土交通部（Ministry of Land, Infrastructure and Transport）"/);
  assert.doesNotMatch(out, /"temporalCoverage":"latest six completed months"/);
});
