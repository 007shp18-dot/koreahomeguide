'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  calculateFixture,
  collectApiContracts
} = require('../scripts/v2-migration/collect-api-contracts.cjs');

test('locks the signedprice comparison assumption at five percent', () => {
  const fixture = calculateFixture({
    depositKrw: 100_000_000,
    monthlyRentKrw: 1_000_000,
    areaSqm: 50,
    annualRate: 0.05
  });
  assert.equal(fixture.assumption, 'signedprice comparison assumption');
  assert.equal(fixture.legalRate, false);
  assert.equal(fixture.statutoryRate, false);
  assert.equal(fixture.adjustedMonthlyKrw, 1_416_667);
  assert.equal(fixture.adjustedPerSqmKrw, 28_333);
});

test('captures all eleven Vercel API functions', () => {
  const contracts = collectApiContracts(process.cwd());
  assert.equal(contracts.length, 11);
  assert.deepEqual(contracts.map(item => item.route), [
    '/api/explore-area',
    '/api/explore-building',
    '/api/explore-dong',
    '/api/fx',
    '/api/lead',
    '/api/real-prices',
    '/api/rent-check',
    '/api/rent-market',
    '/api/seo-building-page',
    '/api/seo-dong-page',
    '/api/sitemap-market'
  ]);
  for (const contract of contracts) {
    assert.deepEqual(Object.keys(contract), [
      'route', 'methods', 'requiredInputs', 'responseKeys', 'errorCodes', 'successes', 'errors'
    ]);
    assert.ok(contract.methods.length > 0);
    assert.ok(contract.successes.length > 0);
    assert.ok(contract.errors.length > 0);
    assert.ok(contract.responseKeys.length > 0);
    assert.ok(contract.errorCodes.length > 0);
  }
});

const AREA_KEYS = ['city','districtCode','districtName','propertyType','summary','districts','dongs','buildings'];
const AREA_DISTRICT_KEYS = ['city','districtCode','districtName','propertyType','summary','dongs','buildings'];
const BUILDING_KEYS = ['city','districtCode','districtName','propertyType','buildingKey','buildingName','officialBuildingNameKo','displayBuildingNameEn','displayBuildingNameZh','dong','mapLocation','contractCount','latestContractDate','monthlyRentCount','medianMonthlyRentWon','medianDepositWon','medianJeonseDepositWon','typicalAreaSqm','adjustedPerSqmWon','quarterChangePct','contractTypeCounts','newContractMonthlyRentCount','renewalMonthlyRentCount','unknownMonthlyRentCount','contextualBasis','contextualMonthlyRentCount','contextualMedianMonthlyRentWon','contextualMedianDepositWon','medianMonthlyRentWonNew','medianDepositWonNew','depositBands','areaGroups','buildYearMin','buildYearMax','buildYearMedian','floorMin','floorMax','leaseEndHistogram','renewalDeltas','marketPosition','profile','monthlyTrend','recentTransactions','saleSummary','recentSales'];
const DONG_KEYS = ['city','districtCode','districtName','propertyType','dong','summary','buildings'];
const RENT_CHECK_KEYS = ['rating','comparisonMode','comparisonBasis','conversionAnnualRate','differencePct','askingValueWon','medianValueWon','minValueWon','p25ValueWon','p75ValueWon','maxValueWon','percentileRank','verdictBasis','confidence','comparableCount','monthsUsed','tier','comparables'];
const RENT_MARKET_KEYS = ['districtCode','propertyType','monthsUsed','totalContracts','monthlyRentCount','medianDepositWon','medianMonthlyRentWon','jeonseCount','medianJeonseDepositWon','sizeBands','contractTypeCounts','newContractMonthlyRentCount','renewalMonthlyRentCount','unknownMonthlyRentCount','contextualBasis','contextualMonthlyRentCount','contextualMedianMonthlyRentWon','contextualMedianDepositWon','medianMonthlyRentWonNew','medianDepositWonNew','depositBands','areaGroups','buildYearMin','buildYearMax','buildYearMedian','floorMin','floorMax','leaseEndHistogram','renewalDeltas','quarterChangePct','recentContracts','dataThroughMonth','dongs'];

function expectedShape(kind, keys = []) { return { kind, keys:[...keys].sort() }; }
function expectedVariant(name, kind, keys, headers = {}) { return { name, shape:expectedShape(kind, keys), headers:{...headers} }; }
function expectedBranch(status, variants) { return { status, variants }; }
function expectedJsonError(status) { return expectedBranch(status, [expectedVariant('error', 'json', ['error'])]); }
function expectedHtmlError(status, name, headers) { return expectedBranch(status, [expectedVariant(name, 'html', [], headers)]); }
function expectedXmlError(status) { return expectedBranch(status, [expectedVariant('empty sitemap XML', 'xml', [], { 'Content-Type':'application/xml; charset=utf-8', 'Cache-Control':'no-store' })]); }
function normalizeResponses(responses) {
  return [...responses].sort((a,b) => a.status - b.status).map(response => ({
    status:response.status,
    variants:response.variants.map(variant => ({
      name:variant.name,
      shape:{ kind:variant.shape.kind, keys:[...variant.shape.keys].sort() },
      headers:{...variant.headers}
    }))
  }));
}
function normalizeContract(contract) {
  return {
    route:contract.route,
    methods:contract.methods,
    requiredInputs:contract.requiredInputs,
    responseKeys:[...contract.responseKeys].sort(),
    errorCodes:[...contract.errorCodes].sort((a,b) => a-b),
    successes:normalizeResponses(contract.successes),
    errors:normalizeResponses(contract.errors)
  };
}

const EXPECTED_CONTRACTS = {
  '/api/explore-area': {
    route:'/api/explore-area', methods:['GET'],
    requiredInputs:{ required:[], optional:['scope','type'], conditional:[{ when:'scope !== all', required:['lawdCd'], optional:[] }] },
    responseKeys:[...AREA_KEYS], errorCodes:[400,403,405,500,502],
    successes:[expectedBranch(200, [
      expectedVariant('all-Seoul','json',AREA_KEYS,{ 'Cache-Control':'s-maxage=21600, stale-while-revalidate=86400' }),
      expectedVariant('district','json',AREA_DISTRICT_KEYS,{ 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })
    ])], errors:[400,403,405,500,502].map(expectedJsonError)
  },
  '/api/explore-building': {
    route:'/api/explore-building', methods:['GET'],
    requiredInputs:{ required:['lawdCd','buildingKey'], optional:['type','legalCode'], conditional:[] },
    responseKeys:[...BUILDING_KEYS], errorCodes:[400,403,404,405,500],
    successes:[expectedBranch(200,[expectedVariant('detail','json',BUILDING_KEYS,{ 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })])],
    errors:[400,403,404,405,500].map(expectedJsonError)
  },
  '/api/explore-dong': {
    route:'/api/explore-dong', methods:['GET'],
    requiredInputs:{ required:['lawdCd','dong'], optional:['type'], conditional:[] },
    responseKeys:[...DONG_KEYS], errorCodes:[400,403,404,405,500],
    successes:[expectedBranch(200,[expectedVariant('detail','json',DONG_KEYS,{ 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })])],
    errors:[400,403,404,405,500].map(expectedJsonError)
  },
  '/api/fx': {
    route:'/api/fx', methods:['GET'],
    requiredInputs:{ required:[], optional:[], conditional:[{ when:'resource=maps-config', required:[], optional:['resource'] }] },
    responseKeys:['enabled','apiKey','mapId','naverKeyId','base','date','rates','source'], errorCodes:[405,502],
    successes:[expectedBranch(200,[
      expectedVariant('maps-config','json',['enabled','apiKey','mapId','naverKeyId'],{ 'Cache-Control':'private, max-age=300' }),
      expectedVariant('exchange-rates','json',['base','date','rates','source'],{ 'Cache-Control':'public, s-maxage=3600, stale-while-revalidate=86400' })
    ])], errors:[expectedBranch(405,[expectedVariant('maps-config method','json',['error'])]),expectedBranch(502,[expectedVariant('exchange-rates upstream','json',['error'],{ 'Cache-Control':'no-store' })])]
  },
  '/api/lead': {
    route:'/api/lead', methods:['POST'],
    requiredInputs:{ required:['kind','language','privacyConsent','privacyNoticeVersion','districtCode','propertyType','areaSqm'], optional:['sourcePage','utmSource','utmMedium','utmCampaign','referrerHost','rating','confidence','askingValueWon','medianValueWon','differencePct','comparableCount','monthsUsed','dataThroughMonth','depositWon','monthlyRentWon'], conditional:[
      { when:'kind=lead_capture|help_request', required:['email'], optional:[] }, { when:'kind=help_request', required:['helpMessage'], optional:[] }, { when:'kind=experience_report', required:['reportId','depositWon','monthlyRentWon','depositOutcome'], optional:['agentFeePaidWon'] }
    ] },
    responseKeys:['ok'], errorCodes:[400,403,405,503],
    successes:[expectedBranch(201,[expectedVariant('stored','json',['ok'],{ 'Cache-Control':'no-store' })])], errors:[expectedBranch(400,[expectedVariant('validation','json',['error'])]),expectedBranch(403,[expectedVariant('request source','json',['error'])]),expectedBranch(405,[expectedVariant('method','json',['error'])]),expectedBranch(503,[expectedVariant('storage','json',['error'])])]
  },
  '/api/real-prices': {
    route:'/api/real-prices', methods:['GET'], requiredInputs:{ required:['lawdCd','dealYmd'], optional:['type'], conditional:[] }, responseKeys:['items'], errorCodes:[400,403,405,500,502],
    successes:[expectedBranch(200,[expectedVariant('items','json',['items'],{ 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })])], errors:[400,403,405,500,502].map(expectedJsonError)
  },
  '/api/rent-check': {
    route:'/api/rent-check', methods:['GET'], requiredInputs:{ required:['lawdCd','type','deposit','rent','area'], optional:[], conditional:[] }, responseKeys:[...RENT_CHECK_KEYS], errorCodes:[400,403,405,500,502],
    successes:[expectedBranch(200,[expectedVariant('comparison','json',RENT_CHECK_KEYS,{ 'Cache-Control':'s-maxage=900, stale-while-revalidate=3600' })])], errors:[400,403,405,500,502].map(expectedJsonError)
  },
  '/api/rent-market': {
    route:'/api/rent-market', methods:['GET'], requiredInputs:{ required:['lawdCd'], optional:['type'], conditional:[] }, responseKeys:[...RENT_MARKET_KEYS], errorCodes:[400,403,405,500],
    successes:[expectedBranch(200,[expectedVariant('statistics','json',RENT_MARKET_KEYS,{ 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })])], errors:[400,403,405,500].map(expectedJsonError)
  },
  '/api/seo-building-page': {
    route:'/api/seo-building-page', methods:['GET'], requiredInputs:{ required:['district','dong','type','building'], optional:['lang'], conditional:[] }, responseKeys:['html'], errorCodes:[404,405,503],
    successes:[expectedBranch(200,[expectedVariant('indexable HTML','html',[],{ 'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'index,follow','Cache-Control':'s-maxage=86400, stale-while-revalidate=86400' })])],
    errors:[expectedBranch(404,[expectedVariant('invalid route HTML','html',[],{ 'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex,follow','Cache-Control':'s-maxage=300' }),expectedVariant('unpublished building HTML','html',[],{ 'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex,nofollow','Cache-Control':'s-maxage=86400, stale-while-revalidate=86400' })]),expectedHtmlError(405,'method HTML',{ 'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex,follow','Cache-Control':'s-maxage=300' }),expectedHtmlError(503,'unavailable HTML',{ 'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex,nofollow','Cache-Control':'s-maxage=300' })]
  },
  '/api/seo-dong-page': {
    route:'/api/seo-dong-page', methods:['GET'], requiredInputs:{ required:[], optional:['lang','mode'], conditional:[{ when:'mode=budget', required:['slug','type'], optional:[] },{ when:'mode=deposit', required:['slug'], optional:[] },{ when:'mode is not budget|deposit', required:['district','dong','type'], optional:[] }] }, responseKeys:['html'], errorCodes:[404,405,503],
    successes:[expectedBranch(200,[expectedVariant('market HTML','html',[],{ 'Content-Type':'text/html; charset=utf-8','Cache-Control':'s-maxage=86400, stale-while-revalidate=86400' }),expectedVariant('opportunity HTML','html',[],{ 'Content-Type':'text/html; charset=utf-8','Cache-Control':'s-maxage=86400, stale-while-revalidate=86400' })])],
    errors:[expectedHtmlError(404,'not found HTML',{ 'Content-Type':'text/html; charset=utf-8','Cache-Control':'s-maxage=300' }),expectedHtmlError(405,'method HTML',{ 'Content-Type':'text/html; charset=utf-8','Cache-Control':'s-maxage=300' }),expectedHtmlError(503,'unavailable HTML',{ 'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store' })]
  },
  '/api/sitemap-market': {
    route:'/api/sitemap-market', methods:['GET'], requiredInputs:{ required:[], optional:['mode'], conditional:[{ when:'mode=opportunities', required:['type'], optional:[] },{ when:'mode is not opportunities', required:['district','type'], optional:[] }] }, responseKeys:['xml'], errorCodes:[404,405,503],
    successes:[expectedBranch(200,[expectedVariant('sitemap XML','xml',[],{ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'s-maxage=21600, stale-while-revalidate=86400' })])], errors:[expectedXmlError(404),expectedXmlError(405),expectedXmlError(503)]
  }
};

for (const expected of Object.values(EXPECTED_CONTRACTS)) expected.responseKeys.sort();

test('captures every route input, response, error, and header contract exhaustively', () => {
  const contracts = collectApiContracts(process.cwd());
  assert.deepEqual(new Set(contracts.map(item => item.route)), new Set(Object.keys(EXPECTED_CONTRACTS)));
  for (const contract of contracts) {
    assert.deepEqual(normalizeContract(contract), EXPECTED_CONTRACTS[contract.route]);
  }
  const serialized = JSON.stringify(contracts);
  assert.doesNotMatch(serialized, /DATA_GO_KR_SERVICE_KEY|GOOGLE_MAPS_BROWSER_KEY|test-key|secret-value/i);
});

test('generated artifacts are deterministic and match the exported contracts', () => {
  const rootDir = process.cwd();
  const contracts = collectApiContracts(rootDir);
  const artifact = JSON.parse(fs.readFileSync(
    path.join(rootDir, 'artifacts/v2-migration/legacy-api-contracts.json'), 'utf8'
  ));
  const fixtures = JSON.parse(fs.readFileSync(
    path.join(rootDir, 'artifacts/v2-migration/korea-calculation-fixtures.json'), 'utf8'
  ));
  assert.deepEqual(artifact, contracts);
  assert.ok(Array.isArray(fixtures));
  assert.deepEqual(fixtures[0], calculateFixture({
    depositKrw:100_000_000,
    monthlyRentKrw:1_000_000,
    areaSqm:50,
    annualRate:0.05
  }));
  assert.equal(fixtures[0].assumption, 'signedprice comparison assumption');
  assert.equal(fixtures[0].legalRate, false);
  assert.equal(fixtures[0].statutoryRate, false);
});
