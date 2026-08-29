const { normalizeServiceKey } = require('../lib/real-price-core.cjs');
const { logApiError } = require('../lib/api-guard.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const {
  SEOUL_DISTRICTS,
  districtCodeFromSlug,
  isSupportedPropertyType,
  supportsZhIndexing
} = require('../providers/seoul-config.cjs');
const {
  dongNameFromSlug,
  resolveBuildingSlug,
  buildingSlug,
  normalizeBuildingSlug,
  buildBuildingSeoUrl
} = require('../seo/seo-route-utils.cjs');
const {
  renderBuildingPage,
  renderErrorPage,
  fetchFxRates,
  isBuildingIndexable
} = require('../seo/seo-page-renderer.cjs');
const { normalizeGuideHubLinks } = require('../seo/seo-html-postprocess.cjs');

function normalizedLang(value) {
  return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function sendHtml(res, status, html, { cache = false, robots = 'noindex,follow' } = {}) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', robots);
  res.setHeader('Cache-Control', cache ? 's-maxage=86400, stale-while-revalidate=86400' : (status === 503 ? 'no-store' : 's-maxage=300'));
  return res.status(status).send(html);
}

// The slug is `{readable}-{hash7}` and only the hash identifies the building.
// A request that matched on the hash but carries a stale readable half is the
// same page under a second URL, so send it to the one canonical address instead
// of serving duplicate HTML.
function sendPermanentRedirect(res, location) {
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  return res.status(301).end();
}

function createHandler({
  providerFactory = options => createKoreaHousingProvider(options),
  fetchImpl = fetch,
  referenceDate = null
} = {}) {
  return async function handler(req, res) {
    const lang = normalizedLang(req && req.query && req.query.lang);
    if (!req || req.method !== 'GET') {
      return sendHtml(res, 405, renderErrorPage({
        lang,
        status:405,
        title:lang === 'zh' ? '请求方式不支持' : 'Method not allowed'
      }));
    }

    const query = req.query || {};
    const areaCode = districtCodeFromSlug(query.district);
    const dong = dongNameFromSlug(query.dong);
    const propertyType = String(query.type || '');
    const requestedBuildingSlug = String(query.building || '').trim();
    if (!areaCode || !dong || !isSupportedPropertyType(propertyType) || !requestedBuildingSlug || (lang === 'zh' && !supportsZhIndexing(areaCode))) {
      return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
    }

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));

    try {
      const provider = providerFactory({ serviceKey, referenceDate:referenceDate || new Date() });
      const [summary, buildings] = await Promise.all([
        provider.getDongSummary({ areaCode, propertyType, dong, months:6 }),
        provider.getBuildings({ areaCode, propertyType, dong, months:6 })
      ]);

      const match = resolveBuildingSlug(buildings, requestedBuildingSlug);
      // Below the publishing floor this URL was never offered to search: 404, not 410.
      if (!match || !isBuildingIndexable(match)) {
        return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
      }

      const canonicalSlug = buildingSlug(match);
      if (canonicalSlug && canonicalSlug !== normalizeBuildingSlug(requestedBuildingSlug)) {
        const canonicalUrl = buildBuildingSeoUrl({ areaCode, dong, propertyType, building:match, lang });
        if (canonicalUrl) return sendPermanentRedirect(res, canonicalUrl);
      }

      const [detail, fxRates] = await Promise.all([
        provider.getBuildingDetail({
          areaCode,
          propertyType,
          buildingKey:match.buildingKey,
          months:6
        }),
        fetchFxRates(fetchImpl)
      ]);
      if (!detail || !isBuildingIndexable(detail)) {
        return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
      }

      const html = normalizeGuideHubLinks(renderBuildingPage({
        lang,
        areaCode,
        districtName:SEOUL_DISTRICTS[areaCode],
        dong,
        propertyType,
        summary,
        detail,
        fxRates
      }), lang);
      return sendHtml(res, 200, html, { cache:true, robots:'index,follow' });
    } catch (error) {
      logApiError('seo-building-page', error, { lawdCd:areaCode, type:propertyType });
      return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
