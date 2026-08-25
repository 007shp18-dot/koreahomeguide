const { normalizeServiceKey } = require('../lib/real-price-core.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const { districtCodeFromSlug, isSupportedPropertyType } = require('../providers/seoul-config.cjs');
const { buildDongSeoUrl, buildBuildingSeoUrl } = require('../seo/seo-route-utils.cjs');
const { isBuildingIndexable, ORIGIN } = require('../seo/seo-page-renderer.cjs');
const { isDongIndexable, MIN_DONG_CONTRACTS } = require('../seo/dong-seo-v10-8.cjs');
const { logApiError } = require('../lib/api-guard.cjs');

const ZH_INDEXABLE_DISTRICT_CODES = new Set(['11680','11440','11170','11200','11560']);
function supportsZhIndexing(areaCode) { return ZH_INDEXABLE_DISTRICT_CODES.has(String(areaCode || '')); }

function xmlEscape(value) { return String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
function absoluteUrl(path) { return `${ORIGIN}${path}`; }
function urlset(urls) {
  const unique = [...new Set((Array.isArray(urls) ? urls : []).filter(Boolean))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n')}\n</urlset>`;
}
function sendXml(res, status, body, cache = false) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', cache ? 's-maxage=21600, stale-while-revalidate=86400' : 'no-store');
  return res.status(status).send(body);
}
function createHandler({ providerFactory = options => createKoreaHousingProvider(options), referenceDate = null } = {}) {
  return async function handler(req, res) {
    if (!req || req.method !== 'GET') return sendXml(res, 405, urlset([]));
    const query = req.query || {};
    const areaCode = districtCodeFromSlug(query.district);
    const propertyType = String(query.type || '');
    if (!areaCode || !isSupportedPropertyType(propertyType)) return sendXml(res, 404, urlset([]));
    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return sendXml(res, 503, urlset([]));
    try {
      const provider = providerFactory({ serviceKey, referenceDate:referenceDate || new Date() });
      const [dongs, buildings] = await Promise.all([
        provider.getDongs({ areaCode, propertyType, months:6 }),
        provider.getBuildings({ areaCode, propertyType, months:6 })
      ]);
      const eligibleDongs = (Array.isArray(dongs) ? dongs : []).filter(item => item && item.dong && isDongIndexable(item));
      const eligibleDongNames = new Set(eligibleDongs.map(item => item.dong));
      const urls = [];
      for (const item of eligibleDongs) {
        urls.push(absoluteUrl(buildDongSeoUrl({ areaCode, dong:item.dong, propertyType, lang:'en' })));
        if (supportsZhIndexing(areaCode)) urls.push(absoluteUrl(buildDongSeoUrl({ areaCode, dong:item.dong, propertyType, lang:'zh' })));
      }
      for (const item of (Array.isArray(buildings) ? buildings : [])) {
        if (!item || !eligibleDongNames.has(item.dong) || !isBuildingIndexable(item)) continue;
        urls.push(absoluteUrl(buildBuildingSeoUrl({ areaCode, dong:item.dong, propertyType, building:item, lang:'en' })));
        if (supportsZhIndexing(areaCode)) urls.push(absoluteUrl(buildBuildingSeoUrl({ areaCode, dong:item.dong, propertyType, building:item, lang:'zh' })));
      }
      return sendXml(res, 200, urlset(urls), true);
    } catch (err) {
      logApiError('sitemap-market', err, { lawdCd:areaCode, type:propertyType });
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
