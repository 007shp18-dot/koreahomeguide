const { normalizeServiceKey } = require('../lib/real-price-core.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const { SEOUL_DISTRICTS, isSupportedAreaCode, isSupportedPropertyType } = require('../providers/seoul-config.cjs');
const { trustedRequestSource, logApiError } = require('../lib/api-guard.cjs');

function createHandler(providerFactory = options => createKoreaHousingProvider(options)) {
  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
    if (!trustedRequestSource(req)) return res.status(403).json({ error:'Request origin is not allowed.' });

    const areaCode = String(req.query.lawdCd || '');
    const propertyType = String(req.query.type || 'officetel');
    if (!isSupportedAreaCode(areaCode)) return res.status(400).json({ error:'Unsupported Seoul district.' });
    if (!isSupportedPropertyType(propertyType)) return res.status(400).json({ error:'Unsupported property type.' });

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return res.status(500).json({ error:'Official transaction data is not configured.' });

    try {
      const provider = providerFactory({ serviceKey, referenceDate:new Date() });
      const [summary, dongs, buildings] = await Promise.all([
        provider.getAreaSummary({ areaCode, propertyType, months:6 }),
        provider.getDongs({ areaCode, propertyType, months:6 }),
        provider.getBuildings({ areaCode, propertyType, months:6 })
      ]);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ city:'seoul', districtCode:areaCode, districtName:SEOUL_DISTRICTS[areaCode], propertyType, summary, dongs, buildings });
    } catch (err) {
      logApiError('explore-area', err, { lawdCd:areaCode, type:propertyType });
      return res.status(502).json({ error:'Official transaction data is temporarily unavailable.' });
    }
  };
}
const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
