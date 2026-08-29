const { normalizeServiceKey, fetchRentalMonth } = require('../lib/real-price-core.cjs');
const { logApiError } = require('../lib/api-guard.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const {
  SEOUL_DISTRICTS,
  districtCodeFromSlug,
  isSupportedPropertyType,
  supportsZhIndexing
} = require('../providers/seoul-config.cjs');
const { dongNameFromSlug } = require('../seo/seo-route-utils.cjs');
const { renderDongPage, renderErrorPage, fetchFxRates } = require('../seo/seo-page-renderer.cjs');
const { normalizeGuideHubLinks } = require('../seo/seo-html-postprocess.cjs');
const { isDongIndexable, enhanceDongHtml } = require('../seo/dong-seo-v10-8.cjs');
const { aggregateDongs, buildAreaSummary } = require('../providers/provider-utils.cjs');
const { loadAllSeoul, DEFAULT_BATCH_SIZE } = require('./explore-area.js');
const { parseOpportunity, buildOpportunityModel } = require('../seo/opportunity-market.cjs');
const { renderOpportunityPage } = require('../seo/opportunity-page.cjs');

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

function normalizedLang(value) {
  return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function sendHtml(res, status, html, { cache = false } = {}) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cache ? 's-maxage=86400, stale-while-revalidate=86400' : (status === 503 ? 'no-store' : 's-maxage=300'));
  return res.status(status).send(html);
}

function nofollowBuildingLinks(html) {
  return String(html || '').replace(
    /(<a class="seo-building-link" href="[^"]+")(?![^>]*\brel=)/g,
    '$1 rel="nofollow"'
  );
}

function createHandler({
  providerFactory = options => createKoreaHousingProvider(options),
  opportunityLoader = defaultOpportunityLoader,
  fetchImpl = fetch,
  referenceDate = null
} = {}) {
  return async function handler(req, res) {
    const lang = normalizedLang(req && req.query && req.query.lang);
    if (!req || req.method !== 'GET') return sendHtml(res, 405, renderErrorPage({ lang, status:405, title:lang === 'zh' ? '请求方式不支持' : 'Method not allowed' }));

    const query = req.query || {};
    if (query.mode === 'budget' || query.mode === 'deposit') {
      const opportunity = parseOpportunity({ mode:query.mode, slug:query.slug, propertyType:query.type });
      if (!opportunity) return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
      const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
      if (!serviceKey) return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));
      try {
        const [payload, fxRates] = await Promise.all([
          opportunityLoader({ serviceKey, propertyType:opportunity.propertyType, referenceDate:referenceDate || new Date() }),
          fetchFxRates(fetchImpl)
        ]);
        const model = buildOpportunityModel(payload && payload.dongs, opportunity);
        const html = renderOpportunityPage({
          lang,
          model,
          dataThroughMonth:payload && payload.summary && payload.summary.dataThroughMonth,
          fxRates
        });
        return sendHtml(res, 200, html, { cache:true });
      } catch (error) {
        logApiError('seo-opportunity-page', error, { type:opportunity.propertyType, mode:opportunity.mode });
        return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));
      }
    }
    const areaCode = districtCodeFromSlug(query.district);
    const dong = dongNameFromSlug(query.dong);
    const propertyType = String(query.type || '');
    if (!areaCode || !dong || !isSupportedPropertyType(propertyType) || (lang === 'zh' && !supportsZhIndexing(areaCode))) {
      return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
    }

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));

    try {
      const provider = providerFactory({ serviceKey, referenceDate:referenceDate || new Date() });
      const [summary, buildings, fxRates] = await Promise.all([
        provider.getDongSummary({ areaCode, propertyType, dong, months:6 }),
        provider.getBuildings({ areaCode, propertyType, dong, months:6 }),
        fetchFxRates(fetchImpl)
      ]);
      if (!isDongIndexable(summary)) {
        return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
      }
      const rendered = renderDongPage({
        lang,
        areaCode,
        districtName:SEOUL_DISTRICTS[areaCode],
        dong,
        propertyType,
        summary,
        buildings,
        fxRates
      });
      const enhanced = enhanceDongHtml(rendered, {
        lang,
        areaCode,
        districtName:SEOUL_DISTRICTS[areaCode],
        dong,
        propertyType,
        summary
      });
      const html = normalizeGuideHubLinks(nofollowBuildingLinks(enhanced), lang);
      return sendHtml(res, 200, html, { cache:true });
    } catch (error) {
      logApiError('seo-dong-page', error, { lawdCd:areaCode, type:propertyType });
      return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
