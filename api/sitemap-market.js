const { normalizeServiceKey } = require('../lib/real-price-core.cjs');
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

// Buildings cost no extra upstream request here. The provider caches the
// district's six months of contracts under one key and every method reads it,
// so getDongs has already paid for the fetch and getBuildings({ dong:'' }) is a
// second aggregation over the same rows — one pass for the whole district.
//
// It is still allowed to fail on its own: the Dong URLs are the established
// surface and must not be lost along with the new building ones.
async function publishableBuildings(provider, { areaCode, propertyType, publishedDongs }) {
  try {
    const buildings = await provider.getBuildings({ areaCode, propertyType, dong:'', months:6 });
    return (Array.isArray(buildings) ? buildings : []).filter(item =>
      item && publishedDongs.has(item.dong) && isBuildingIndexable(item));
  } catch (error) {
    logApiError('sitemap-market:buildings', error, { lawdCd:areaCode, type:propertyType });
    return [];
  }
}

function createHandler({
  providerFactory = options => createKoreaHousingProvider(options),
  referenceDate = null
} = {}) {
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
      const dongs = await provider.getDongs({ areaCode, propertyType, months:6 });

      const eligibleDongs = (Array.isArray(dongs) ? dongs : [])
        .filter(item => item && item.dong && isDongIndexable(item));
      const publishedDongs = new Set(eligibleDongs.map(item => item.dong));
      const zh = supportsZhIndexing(areaCode);
      const urls = [];

      for (const item of eligibleDongs) {
        urls.push(absoluteUrl(buildDongSeoUrl({ areaCode, dong:item.dong, propertyType, lang:'en' })));
        if (zh) {
          urls.push(absoluteUrl(buildDongSeoUrl({ areaCode, dong:item.dong, propertyType, lang:'zh' })));
        }
      }

      // A building is only offered when its Dong page is offered too: the Dong
      // page is its parent and its breadcrumb, and a building hanging under a
      // 404 has nowhere to send a crawler next.
      const buildings = await publishableBuildings(provider, { areaCode, propertyType, publishedDongs });
      for (const building of buildings) {
        urls.push(absoluteUrl(buildBuildingSeoUrl({ areaCode, dong:building.dong, propertyType, building, lang:'en' })));
        if (zh) {
          urls.push(absoluteUrl(buildBuildingSeoUrl({ areaCode, dong:building.dong, propertyType, building, lang:'zh' })));
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
