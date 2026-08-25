const { normalizeServiceKey } = require('../lib/real-price-core.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const {
  SEOUL_DISTRICTS,
  districtCodeFromSlug,
  isSupportedPropertyType
} = require('../providers/seoul-config.cjs');
const { dongNameFromSlug } = require('../seo/seo-route-utils.cjs');
const { renderDongPage, renderErrorPage, fetchFxRates } = require('../seo/seo-page-renderer.cjs');

function normalizedLang(value) {
  return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function sendHtml(res, status, html, { cache = false } = {}) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cache ? 's-maxage=3600, stale-while-revalidate=86400' : (status === 503 ? 'no-store' : 's-maxage=300'));
  return res.status(status).send(html);
}

function createHandler({
  providerFactory = options => createKoreaHousingProvider(options),
  fetchImpl = fetch,
  referenceDate = null
} = {}) {
  return async function handler(req, res) {
    const lang = normalizedLang(req && req.query && req.query.lang);
    if (!req || req.method !== 'GET') return sendHtml(res, 405, renderErrorPage({ lang, status:405, title:lang === 'zh' ? '请求方式不支持' : 'Method not allowed' }));

    const query = req.query || {};
    const areaCode = districtCodeFromSlug(query.district);
    const dong = dongNameFromSlug(query.dong);
    const propertyType = String(query.type || '');
    if (!areaCode || !dong || !isSupportedPropertyType(propertyType)) {
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
      if (!summary || Number(summary.totalContracts || summary.contractCount || 0) < 1) {
        return sendHtml(res, 404, renderErrorPage({ lang, status:404 }));
      }
      return sendHtml(res, 200, renderDongPage({
        lang,
        areaCode,
        districtName:SEOUL_DISTRICTS[areaCode],
        dong,
        propertyType,
        summary,
        buildings,
        fxRates
      }), { cache:true });
    } catch (_) {
      return sendHtml(res, 503, renderErrorPage({ lang, status:503 }));
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
