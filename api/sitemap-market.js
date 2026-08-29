const { normalizeServiceKey, fetchRentalMonth } = require('../lib/real-price-core.cjs');
const { logApiError } = require('../lib/api-guard.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const {
  districtCodeFromSlug,
  isSupportedPropertyType,
  ZH_INDEXABLE_DISTRICT_CODES,
  supportsZhIndexing
} = require('../providers/seoul-config.cjs');
const { buildDongSeoUrl, buildBuildingSeoUrl } = require('../seo/seo-route-utils.cjs');
const { ORIGIN, isBuildingIndexable } = require('../seo/seo-page-renderer.cjs');
const { MIN_DONG_CONTRACTS, isDongIndexable } = require('../seo/dong-seo-v10-8.cjs');
const { aggregateDongs, buildAreaSummary } = require('../providers/provider-utils.cjs');
const { loadAllSeoul, DEFAULT_BATCH_SIZE } = require('./explore-area.js');
const { approvedOpportunityQueries, buildOpportunityModel, opportunityPath } = require('../seo/opportunity-market.cjs');

function defaultOpportunityLoader({ serviceKey, propertyType, referenceDate }) {
  return loadAllSeoul({
    serviceKey,
    propertyType,
    referenceDate,
    fetchMonth:options => fetchRentalMonth({ ...options, serviceKey }),
    aggregate:aggregateDongs,
    buildSummary:buildAreaSummary,
    batchSize:DEFAULT_BATCH_SIZE
  });
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(path) {
  return `${ORIGIN}${path}`;
}

function urlset(urls) {
  const unique = [...new Set((Array.isArray(urls) ? urls : []).filter(Boolean))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n')}\n</urlset>`;
}

function sendXml(res, status, body, cache = false) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', cache ? 's-maxage=21600, stale-while-revalidate=86400' : 'no-store');
  return res.status(status).send(body);
}

function createHandler({
  providerFactory = options => createKoreaHousingProvider(options),
  opportunityLoader = defaultOpportunityLoader,
  referenceDate = null
} = {}) {
  return async function handler(req, res) {
    if (!req || req.method !== 'GET') return sendXml(res, 405, urlset([]));
    const query = req.query || {};
    if (query.mode === 'opportunities') {
      const opportunityType = String(query.type || '');
      if (!['apartment','officetel','villa'].includes(opportunityType)) return sendXml(res, 404, urlset([]));
      const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
      if (!serviceKey) return sendXml(res, 503, urlset([]));
      const effectiveDate = referenceDate || new Date();
      try {
        const queries = approvedOpportunityQueries().filter(item => item.propertyType === opportunityType);
        const payload = await opportunityLoader({ serviceKey, propertyType:opportunityType, referenceDate:effectiveDate });
        const urls = [];
        for (const opportunity of queries) {
          const model = buildOpportunityModel(payload && payload.dongs, opportunity);
          if (!model || !model.indexable) continue;
          urls.push(absoluteUrl(opportunityPath(opportunity, 'en')));
          urls.push(absoluteUrl(opportunityPath(opportunity, 'zh')));
        }
        return sendXml(res, 200, urlset(urls), true);
      } catch (error) {
        logApiError('sitemap-opportunities', error);
        return sendXml(res, 503, urlset([]));
      }
    }
    const areaCode = districtCodeFromSlug(query.district);
    const propertyType = String(query.type || '');
    if (!areaCode || !isSupportedPropertyType(propertyType)) return sendXml(res, 404, urlset([]));

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return sendXml(res, 503, urlset([]));

    try {
      const provider = providerFactory({ serviceKey, referenceDate:referenceDate || new Date() });
      if (query.mode === 'buildings') {
        const buildings = await provider.getBuildings({ areaCode, propertyType, months:6 });
        const urls = [];
        for (const building of (Array.isArray(buildings) ? buildings : []).filter(isBuildingIndexable)) {
          urls.push(absoluteUrl(buildBuildingSeoUrl({ areaCode, dong:building.dong, propertyType, building, lang:'en' })));
          if (supportsZhIndexing(areaCode)) urls.push(absoluteUrl(buildBuildingSeoUrl({ areaCode, dong:building.dong, propertyType, building, lang:'zh' })));
        }
        return sendXml(res, 200, urlset(urls), true);
      }
      const dongs = await provider.getDongs({ areaCode, propertyType, months:6 });

      const eligibleDongs = (Array.isArray(dongs) ? dongs : [])
        .filter(item => item && item.dong && isDongIndexable(item));
      const urls = [];

      for (const item of eligibleDongs) {
        urls.push(absoluteUrl(buildDongSeoUrl({ areaCode, dong:item.dong, propertyType, lang:'en' })));
        if (supportsZhIndexing(areaCode)) {
          urls.push(absoluteUrl(buildDongSeoUrl({ areaCode, dong:item.dong, propertyType, lang:'zh' })));
        }
      }

      return sendXml(res, 200, urlset(urls), true);
    } catch (error) {
      logApiError('sitemap-market', error, { lawdCd:areaCode, type:propertyType });
      return sendXml(res, 503, urlset([]));
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
module.exports.MIN_DONG_CONTRACTS = MIN_DONG_CONTRACTS;
module.exports.ZH_INDEXABLE_DISTRICT_CODES = ZH_INDEXABLE_DISTRICT_CODES;
module.exports.supportsZhIndexing = supportsZhIndexing;
