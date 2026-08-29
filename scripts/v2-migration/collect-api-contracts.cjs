'use strict';

const fs = require('node:fs');
const path = require('node:path');

const JSON_ERROR = Object.freeze({ kind:'json', keys:['error'] });
const HTML_SHAPE = Object.freeze({ kind:'html', keys:[] });
const XML_SHAPE = Object.freeze({ kind:'xml', keys:[] });
const NO_HEADERS = Object.freeze({});

function inputs(required = [], optional = [], conditional = []) {
  return {
    required:[...required],
    optional:[...optional],
    conditional:conditional.map(item => ({
      when:item.when,
      required:[...(item.required || [])],
      optional:[...(item.optional || [])]
    }))
  };
}

function branch(status, name, shape, headers = NO_HEADERS) {
  return { status, variants:[{ name, shape, headers:{...headers} }] };
}

function branched(status, variants) {
  return {
    status,
    variants:variants.map(item => ({
      name:item.name,
      shape:item.shape,
      headers:{...(item.headers || NO_HEADERS)}
    }))
  };
}

function responseKeys(successes) {
  const keys = new Set();
  for (const response of successes) {
    for (const variant of response.variants) {
      if (variant.shape.kind === 'html') keys.add('html');
      else if (variant.shape.kind === 'xml') keys.add('xml');
      else for (const key of variant.shape.keys) keys.add(key);
    }
  }
  return [...keys];
}

const CONTRACT_FIELDS = Object.freeze({
  'explore-area': {
    requiredInputs:inputs([], ['scope', 'type'], [{ when:'scope !== all', required:['lawdCd'] }]),
    successes:[branched(200, [
      { name:'all-Seoul', shape:{ kind:'json', keys:['city', 'districtCode', 'districtName', 'propertyType', 'summary', 'districts', 'dongs', 'buildings'] }, headers:{ 'Cache-Control':'s-maxage=21600, stale-while-revalidate=86400' } },
      { name:'district', shape:{ kind:'json', keys:['city', 'districtCode', 'districtName', 'propertyType', 'summary', 'dongs', 'buildings'] }, headers:{ 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' } }
    ])],
    errors:[400,403,405,500,502].map(status => branch(status, 'error', JSON_ERROR))
  },
  'explore-building': {
    requiredInputs:inputs(['lawdCd', 'buildingKey'], ['type', 'legalCode']),
    successes:[branch(200, 'detail', { kind:'json', keys:['city', 'districtCode', 'districtName', 'propertyType', 'buildingKey', 'buildingName', 'officialBuildingNameKo', 'displayBuildingNameEn', 'displayBuildingNameZh', 'dong', 'mapLocation', 'contractCount', 'latestContractDate', 'monthlyRentCount', 'medianMonthlyRentWon', 'medianDepositWon', 'medianJeonseDepositWon', 'typicalAreaSqm', 'adjustedPerSqmWon', 'quarterChangePct', 'contractTypeCounts', 'newContractMonthlyRentCount', 'renewalMonthlyRentCount', 'unknownMonthlyRentCount', 'contextualBasis', 'contextualMonthlyRentCount', 'contextualMedianMonthlyRentWon', 'contextualMedianDepositWon', 'medianMonthlyRentWonNew', 'medianDepositWonNew', 'depositBands', 'areaGroups', 'buildYearMin', 'buildYearMax', 'buildYearMedian', 'floorMin', 'floorMax', 'leaseEndHistogram', 'renewalDeltas', 'marketPosition', 'profile', 'monthlyTrend', 'recentTransactions', 'saleSummary', 'recentSales'] }, { 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })],
    errors:[400,403,404,405,500].map(status => branch(status, 'error', JSON_ERROR))
  },
  'explore-dong': {
    requiredInputs:inputs(['lawdCd', 'dong'], ['type']),
    successes:[branch(200, 'detail', { kind:'json', keys:['city', 'districtCode', 'districtName', 'propertyType', 'dong', 'summary', 'buildings'] }, { 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })],
    errors:[400,403,404,405,500].map(status => branch(status, 'error', JSON_ERROR))
  },
  'fx': {
    requiredInputs:inputs([], [], [{ when:'resource=maps-config', optional:['resource'] }]),
    successes:[branched(200, [
      { name:'maps-config', shape:{ kind:'json', keys:['enabled', 'apiKey', 'mapId', 'naverKeyId'] }, headers:{ 'Cache-Control':'private, max-age=300' } },
      { name:'exchange-rates', shape:{ kind:'json', keys:['base', 'date', 'rates', 'source'] }, headers:{ 'Cache-Control':'public, s-maxage=3600, stale-while-revalidate=86400' } }
    ])],
    errors:[branch(405, 'maps-config method', JSON_ERROR), branch(502, 'exchange-rates upstream', JSON_ERROR, { 'Cache-Control':'no-store' })]
  },
  'lead': {
    requiredInputs:inputs(['kind', 'language', 'privacyConsent', 'privacyNoticeVersion', 'districtCode', 'propertyType', 'areaSqm'], ['sourcePage', 'utmSource', 'utmMedium', 'utmCampaign', 'referrerHost', 'rating', 'confidence', 'askingValueWon', 'medianValueWon', 'differencePct', 'comparableCount', 'monthsUsed', 'dataThroughMonth', 'depositWon', 'monthlyRentWon'], [
      { when:'kind=lead_capture|help_request', required:['email'] },
      { when:'kind=help_request', required:['helpMessage'] },
      { when:'kind=experience_report', required:['reportId', 'depositWon', 'monthlyRentWon', 'depositOutcome'], optional:['agentFeePaidWon'] }
    ]),
    successes:[branch(201, 'stored', { kind:'json', keys:['ok'] }, { 'Cache-Control':'no-store' })],
    errors:[branch(400, 'validation', JSON_ERROR), branch(403, 'request source', JSON_ERROR), branch(405, 'method', JSON_ERROR), branch(503, 'storage', JSON_ERROR)]
  },
  'real-prices': {
    requiredInputs:inputs(['lawdCd', 'dealYmd'], ['type']),
    successes:[branch(200, 'items', { kind:'json', keys:['items'] }, { 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })],
    errors:[400,403,405,500,502].map(status => branch(status, 'error', JSON_ERROR))
  },
  'rent-check': {
    requiredInputs:inputs(['lawdCd', 'type', 'deposit', 'rent', 'area']),
    successes:[branch(200, 'comparison', { kind:'json', keys:['rating', 'comparisonMode', 'comparisonBasis', 'conversionAnnualRate', 'differencePct', 'askingValueWon', 'medianValueWon', 'minValueWon', 'p25ValueWon', 'p75ValueWon', 'maxValueWon', 'percentileRank', 'verdictBasis', 'confidence', 'comparableCount', 'monthsUsed', 'tier', 'comparables'] }, { 'Cache-Control':'s-maxage=900, stale-while-revalidate=3600' })],
    errors:[400,403,405,500,502].map(status => branch(status, 'error', JSON_ERROR))
  },
  'rent-market': {
    requiredInputs:inputs(['lawdCd'], ['type']),
    successes:[branch(200, 'statistics', { kind:'json', keys:['districtCode', 'propertyType', 'monthsUsed', 'totalContracts', 'monthlyRentCount', 'medianDepositWon', 'medianMonthlyRentWon', 'jeonseCount', 'medianJeonseDepositWon', 'sizeBands', 'contractTypeCounts', 'newContractMonthlyRentCount', 'renewalMonthlyRentCount', 'unknownMonthlyRentCount', 'contextualBasis', 'contextualMonthlyRentCount', 'contextualMedianMonthlyRentWon', 'contextualMedianDepositWon', 'medianMonthlyRentWonNew', 'medianDepositWonNew', 'depositBands', 'areaGroups', 'buildYearMin', 'buildYearMax', 'buildYearMedian', 'floorMin', 'floorMax', 'leaseEndHistogram', 'renewalDeltas', 'quarterChangePct', 'recentContracts', 'dataThroughMonth', 'dongs'] }, { 'Cache-Control':'s-maxage=3600, stale-while-revalidate=86400' })],
    errors:[400,403,405,500].map(status => branch(status, 'error', JSON_ERROR))
  },
  'seo-building-page': {
    requiredInputs:inputs(['district', 'dong', 'type', 'building'], ['lang']),
    successes:[branch(200, 'indexable HTML', HTML_SHAPE, { 'Content-Type':'text/html; charset=utf-8', 'X-Robots-Tag':'index,follow', 'Cache-Control':'s-maxage=86400, stale-while-revalidate=86400' })],
    errors:[
      branched(404, [
        { name:'invalid route HTML', shape:HTML_SHAPE, headers:{ 'Content-Type':'text/html; charset=utf-8', 'X-Robots-Tag':'noindex,follow', 'Cache-Control':'s-maxage=300' } },
        { name:'unpublished building HTML', shape:HTML_SHAPE, headers:{ 'Content-Type':'text/html; charset=utf-8', 'X-Robots-Tag':'noindex,nofollow', 'Cache-Control':'s-maxage=86400, stale-while-revalidate=86400' } }
      ]),
      branch(405, 'method HTML', HTML_SHAPE, { 'Content-Type':'text/html; charset=utf-8', 'X-Robots-Tag':'noindex,follow', 'Cache-Control':'s-maxage=300' }),
      branch(503, 'unavailable HTML', HTML_SHAPE, { 'Content-Type':'text/html; charset=utf-8', 'X-Robots-Tag':'noindex,nofollow', 'Cache-Control':'s-maxage=300' })
    ]
  },
  'seo-dong-page': {
    requiredInputs:inputs([], ['lang', 'mode'], [
      { when:'mode=budget', required:['slug', 'type'] },
      { when:'mode=deposit', required:['slug'] },
      { when:'mode is not budget|deposit', required:['district', 'dong', 'type'] }
    ]),
    successes:[branched(200, [
      { name:'market HTML', shape:HTML_SHAPE, headers:{ 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'s-maxage=86400, stale-while-revalidate=86400' } },
      { name:'opportunity HTML', shape:HTML_SHAPE, headers:{ 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'s-maxage=86400, stale-while-revalidate=86400' } }
    ])],
    errors:[
      branch(404, 'not found HTML', HTML_SHAPE, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'s-maxage=300' }),
      branch(405, 'method HTML', HTML_SHAPE, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'s-maxage=300' }),
      branch(503, 'unavailable HTML', HTML_SHAPE, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store' })
    ]
  },
  'sitemap-market': {
    requiredInputs:inputs([], ['mode'], [
      { when:'mode=opportunities', required:['type'] },
      { when:'mode is not opportunities', required:['district', 'type'] }
    ]),
    successes:[branch(200, 'sitemap XML', XML_SHAPE, { 'Content-Type':'application/xml; charset=utf-8', 'Cache-Control':'s-maxage=21600, stale-while-revalidate=86400' })],
    errors:[405,404,503].map(status => branch(status, 'empty sitemap XML', XML_SHAPE, { 'Content-Type':'application/xml; charset=utf-8', 'Cache-Control':'no-store' }))
  }
});

function sourceMethods(source) {
  const methods = new Set();
  for (const match of String(source).matchAll(/req\.method\s*!==\s*['"]([A-Z]+)['"]/g)) methods.add(match[1]);
  return [...methods].sort();
}

function collectApiContracts(rootDir) {
  if (typeof rootDir !== 'string' || !rootDir) throw new TypeError('rootDir must be a non-empty string');
  const apiDir = path.resolve(rootDir, 'api');
  const files = fs.readdirSync(apiDir, { withFileTypes:true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));
  return files.map(file => {
    const routeName = file.slice(0, -'.js'.length);
    const fields = CONTRACT_FIELDS[routeName];
    if (!fields) throw new TypeError(`No API contract definition for ${file}`);
    const source = fs.readFileSync(path.join(apiDir, file), 'utf8');
    return {
      route:`/api/${routeName}`,
      methods:sourceMethods(source),
      requiredInputs:fields.requiredInputs,
      responseKeys:responseKeys(fields.successes),
      errorCodes:fields.errors.map(item => item.status).sort((a, b) => a - b),
      successes:fields.successes,
      errors:fields.errors
    };
  }).sort((a, b) => a.route.localeCompare(b.route));
}

function calculateFixture(input) {
  const adjusted = Number(input.monthlyRentKrw) + (Number(input.depositKrw) * Number(input.annualRate)) / 12;
  return {
    ...input,
    assumption:'signedprice comparison assumption',
    legalRate:false,
    statutoryRate:false,
    adjustedMonthlyKrw:Math.round(adjusted),
    adjustedPerSqmKrw:Math.round(adjusted / Number(input.areaSqm))
  };
}

const CALCULATION_FIXTURES = Object.freeze([
  calculateFixture({ depositKrw:100_000_000, monthlyRentKrw:1_000_000, areaSqm:50, annualRate:0.05 })
]);

function writeJson(outputFile, value) {
  const outputPath = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive:true });
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

if (require.main === module) {
  const writeIndex = process.argv.indexOf('--write');
  const fixturesIndex = process.argv.indexOf('--fixtures');
  if (writeIndex === -1 || !process.argv[writeIndex + 1] || fixturesIndex === -1 || !process.argv[fixturesIndex + 1]) {
    console.error('Usage: node scripts/v2-migration/collect-api-contracts.cjs --write <contracts.json> --fixtures <fixtures.json>');
    process.exitCode = 1;
  } else {
    writeJson(process.argv[writeIndex + 1], collectApiContracts(process.cwd()));
    writeJson(process.argv[fixturesIndex + 1], CALCULATION_FIXTURES);
  }
}

module.exports = { CALCULATION_FIXTURES, calculateFixture, collectApiContracts, writeJson };
