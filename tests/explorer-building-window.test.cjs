const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderContent, copyForLocale, buildDetailUrl, buildRentCheckUrl, buildDetailApiUrl, selectionFromBuilding } = require('../explore/building-window.js');

const selection = { districtCode:'11680', propertyType:'officetel', dong:'역삼동', buildingKey:'역삼동::테스트', label:'Test Tower', secondaryLabel:'테스트' };
const detail = {
  buildingName:'테스트', displayBuildingNameEn:'Test Tower', officialBuildingNameKo:'테스트', dong:'역삼동', propertyType:'officetel', contractCount:9,
  mapLocation:{ roadAddress:'테헤란로 1', jibun:'1-2' },
  profile:{ status:'matched', useApprovalYear:2019, householdCount:84, householdLabel:'households', groundFloors:12, source:'MOLIT Building HUB' },
  marketPosition:{
    buildingRepresentative:{ depositWon:10_000_000, monthlyRentWon:1_150_000, areaSqm:33.6, adjustedPerSqmWon:35_466, contractCount:9 },
    dong:{ status:'sufficient', percentile:0.62, comparableCount:42, buildingCount:11, medianAdjustedPerSqmWon:32_000 },
    district:{ status:'insufficient', percentile:null, comparableCount:12, buildingCount:4, medianAdjustedPerSqmWon:null, reason:'minimum-evidence' }
  },
  recentTransactions:[{ contractDate:'2026-07-10', floor:8, areaSqm:33.6, depositWon:10_000_000, monthlyRentWon:1_150_000, adjustedPerSqmWon:35_466 }]
};

test('building status window renders three decision panels and escapes external text', () => {
  const html = renderContent({ ...detail, buildingName:'<img src=x onerror=alert(1)>' }, selection, 'en');
  assert.match(html, /What people signed/);
  assert.match(html, /Against the market/);
  assert.match(html, /Recent contracts/);
  assert.match(html, /Higher than 62% of comparable recent contracts/);
  assert.match(html, /Deposit-adjusted ₩\/㎡/);
  assert.match(html, /₩35,466\/㎡/);
  assert.match(html, /₩35,466\/㎡ \/ ₩32,000\/㎡/);
  assert.match(html, /Limited evidence/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /2019/);
  assert.match(html, /84<\/b> households/);
});

test('Chinese building status window uses native labels and no fake profile values', () => {
  const html = renderContent({ ...detail, profile:{ status:'unavailable' } }, selection, 'zh-CN');
  assert.match(html, /近期签约/);
  assert.match(html, /市场位置/);
  assert.match(html, /最近合同/);
  assert.match(html, /建筑登记信息暂不可用/);
  assert.doesNotMatch(html, />0 户</);
});

test('missing money and adjusted square-metre values never render as zero', () => {
  const missing = {
    ...detail,
    marketPosition:{
      buildingRepresentative:{ areaSqm:33.6, contractCount:2, depositWon:null, monthlyRentWon:null, adjustedPerSqmWon:null },
      dong:{ status:'insufficient', comparableCount:2, buildingCount:1 },
      district:{ status:'insufficient', comparableCount:2, buildingCount:1 }
    },
    recentTransactions:[{ contractDate:'2026-07-10', floor:null, areaSqm:33.6, depositWon:null, monthlyRentWon:null, adjustedPerSqmWon:null }]
  };
  const html = renderContent(missing, selection, 'en');
  assert.doesNotMatch(html, /₩0(?:\/㎡)?/);
  assert.match(html, /<dd>—<\/dd>/);
  assert.doesNotMatch(html, /—\/㎡/);
});

test('building actions preserve identity without inventing quote prices', () => {
  assert.equal(buildDetailUrl(selection, 'en'), '/explore/building/?lawdCd=11680&type=officetel&dong=%EC%97%AD%EC%82%BC%EB%8F%99&buildingKey=%EC%97%AD%EC%82%BC%EB%8F%99%3A%3A%ED%85%8C%EC%8A%A4%ED%8A%B8');
  const rentCheck = new URL(buildRentCheckUrl(selection, detail, 'en'), 'https://example.com');
  assert.equal(rentCheck.pathname, '/tools/seoul-rent-check/');
  assert.equal(rentCheck.searchParams.get('lawdCd'), '11680');
  assert.equal(rentCheck.searchParams.get('type'), 'officetel');
  assert.equal(rentCheck.searchParams.get('area'), '33.6');
  assert.equal(rentCheck.searchParams.has('rent'), false);
  assert.equal(rentCheck.searchParams.has('deposit'), false);
});

test('building detail enrichment carries only the verified legal code', () => {
  const url = new URL(buildDetailApiUrl(selection, '1168010100'), 'https://example.com');
  assert.equal(url.pathname, '/api/explore-building');
  assert.equal(url.searchParams.get('legalCode'), '1168010100');
  assert.equal(url.searchParams.get('buildingKey'), '역삼동::테스트');
});

test('localized copy defines accessible mobile tab names', () => {
  assert.deepEqual(copyForLocale('en').tabs, ['Overview','Market','Contracts']);
  assert.deepEqual(copyForLocale('zh-CN').tabs, ['概览','市场','合同']);
});

test('building row selection carries stable identity and official address only', () => {
  assert.deepEqual(selectionFromBuilding({
    buildingKey:'역삼동::테스트', buildingName:'테스트', displayBuildingNameEn:'Test Tower', officialBuildingNameKo:'테스트',
    dong:'역삼동', propertyType:'officetel', mapLocation:{ roadAddress:'테헤란로 1', jibun:'1-2', basis:'official-address' }, rentWon:999
  }, { districtCode:'11680', districtName:'Gangnam-gu', locale:'en' }), {
    kind:'building', buildingKey:'역삼동::테스트', buildingName:'테스트', label:'Test Tower', secondaryLabel:'테스트',
    dong:'역삼동', propertyType:'officetel', districtCode:'11680', districtName:'Gangnam-gu', roadAddress:'테헤란로 1', jibun:'1-2',
    mapLocation:{ roadAddress:'테헤란로 1', jibun:'1-2', basis:'official-address' }
  });
});

test('mobile building status keeps verified NAVER street view visible', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const mobileRules = css.slice(css.indexOf('@media(max-width:860px)'));
  assert.ok(
    mobileRules.lastIndexOf('.building-status-window .building-window-street-view{display:block}') >
      mobileRules.indexOf('.building-status-window .building-window-street-view{display:none}'),
    'mobile visible rule must override the earlier compact-layout rule'
  );
  assert.match(mobileRules, /\.building-status-window \.explorer-street-view-canvas\{height:120px\}/);
});

test('building drawer keeps Street View before every evidence section', () => {
  const source = fs.readFileSync('explore/building-window.js', 'utf8');
  const shell = source.match(/overlay\.innerHTML = `([\s\S]*?)`;/)?.[1] || '';
  assert.ok(shell.indexOf('id="explorerStreetView"') > shell.indexOf('building-status-head'));
  assert.ok(shell.indexOf('id="explorerStreetView"') < shell.indexOf('id="buildingStatusBody"'));
  assert.doesNotMatch(source, /appendChild\(streetView\)/);
  const html = renderContent(detail, selection, 'en');
  assert.ok(html.indexOf('building-snapshot') < html.indexOf('building-market-stack'));
  assert.ok(html.indexOf('building-window-profile') < html.indexOf('building-contract-list'));
  assert.doesNotMatch(html, /building-window-tabs/);
  assert.match(source, /khg:building-window-state/);
});
