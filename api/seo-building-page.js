const { normalizeServiceKey } = require('../lib/real-price-core.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const { SEOUL_DISTRICTS, districtCodeFromSlug, isSupportedPropertyType } = require('../providers/seoul-config.cjs');
const { dongNameFromSlug, resolveBuildingSlug } = require('../seo/seo-route-utils.cjs');
const { renderBuildingPage, renderErrorPage, fetchFxRates } = require('../seo/seo-page-renderer.cjs');
const { logApiError } = require('../lib/api-guard.cjs');
const { normalizeGuideHubLinks } = require('../seo/seo-html-postprocess.cjs');

function normalizedLang(value) { return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'; }
function sendHtml(res, status, html, { cache = false } = {}) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cache ? 's-maxage=86400, stale-while-revalidate=86400' : (status === 503 ? 'no-store' : 's-maxage=300'));
  return res.status(status).send(html);
}

function createHandler({ providerFactory = options => createKoreaHousingProvider(options), fetchImpl = fetch, referenceDate = null } = {}) {
  return async function handler(req, res) {
    const lang = normalizedLang(req && req.query && req.query.lang);
    if (!req || req.method !== 'GET') return sendHtml(res, 405, renderErrorPage({ lang, status:405, title:lang === 'zh' ? '请求方式不支持' : 'Method not allowed' }));
    const query = req.query || {};
    const areaCode = districtCodeFromSlug(query.district);
    const dong = dongNameFromSlug(query.dong);
    const propertyType = String(query.type || '');
    const requestedBuildingSlug = String(query.building || '').trim();
    if (!areaCode || !dong || !isSupportedPropertyType(propertyType) || !requestedBuildingSlug) return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));
    try {
      const provider = providerFactory({ serviceKey, referenceDate:referenceDate || new Date() });
      const buildings = await provider.getBuildings({ areaCode, propertyType, dong, months:6 });
      const resolved = resolveBuildingSlug(buildings, requestedBuildingSlug);
      if (!resolved) return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
      const [detail, summary, fxRates] = await Promise.all([
        provider.getBuildingDetail({ areaCode, propertyType, buildingKey:resolved.buildingKey, months:6 }),
        provider.getDongSummary({ areaCode, propertyType, dong, months:6 }),
        fetchFxRates(fetchImpl)
      ]);
      if (!detail || !summary) return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
      const html = renderBuildingPage({ lang, areaCode, districtName:SEOUL_DISTRICTS[areaCode], dong, propertyType, summary, detail, fxRates });
      return sendHtml(res, 200, normalizeGuideHubLinks(html, lang), { cache:true });
    } catch (err) {
      logApiError('seo-building-page', err, { lawdCd:areaCode, type:propertyType, dong, buildingKey:requestedBuildingSlug });
      return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));
    }
  };
}
const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
