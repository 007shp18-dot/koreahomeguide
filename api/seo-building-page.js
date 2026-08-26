const {
  districtCodeFromSlug,
  isSupportedPropertyType,
  supportsZhIndexing
} = require('../providers/seoul-config.cjs');
const { dongNameFromSlug } = require('../seo/seo-route-utils.cjs');
const { renderErrorPage } = require('../seo/seo-page-renderer.cjs');

function normalizedLang(value) {
  return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function sendHtml(res, status, html, { cache = false, robots = 'noindex,follow' } = {}) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', robots);
  res.setHeader('Cache-Control', cache ? 's-maxage=86400, stale-while-revalidate=86400' : 's-maxage=300');
  return res.status(status).send(html);
}

function createHandler() {
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

    const exploreParams = new URLSearchParams({
      lawdCd:areaCode,
      type:propertyType,
      dong
    });
    const actionHref = `${lang === 'zh' ? '/zh' : ''}/explore/?${exploreParams.toString()}`;
    return sendHtml(res, 410, renderErrorPage({
      lang,
      status:410,
      title:lang === 'zh' ? '建筑市场页面已迁移' : 'Building market page moved',
      message:lang === 'zh'
        ? '请在租金探索中查看近期建筑成交。'
        : 'Use Rent Explorer to view recent building transactions.',
      actionHref,
      robots:'noindex,nofollow'
    }), { cache:true, robots:'noindex,nofollow' });
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
