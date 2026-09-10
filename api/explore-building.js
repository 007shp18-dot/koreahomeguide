const { normalizeServiceKey } = require('../lib/real-price-core.cjs');
const { trustedRequestSource, logApiError } = require('../lib/api-guard.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const { SEOUL_DISTRICTS, isSupportedAreaCode, isSupportedPropertyType } = require('../providers/seoul-config.cjs');

function createHandler(providerFactory = options => createKoreaHousingProvider(options)) {
  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
    if (!trustedRequestSource(req)) return res.status(403).json({ error:'Request origin is not allowed.' });

    const areaCode = String(req.query.lawdCd || '');
    const propertyType = String(req.query.type || 'officetel');
    const buildingKey = String(req.query.buildingKey || '').trim();
    const legalCode = String(req.query.legalCode || '').trim();
    if (!isSupportedAreaCode(areaCode)) return res.status(400).json({ error:'Unsupported Seoul district.' });
    if (!isSupportedPropertyType(propertyType)) return res.status(400).json({ error:'Unsupported property type.' });
    if (!buildingKey) return res.status(400).json({ error:'Building key is required.' });
    if (legalCode && !new RegExp(`^${areaCode}\\d{5}$`).test(legalCode)) return res.status(400).json({ error:'Legal-dong code does not match the selected district.' });

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return res.status(500).json({ error:'Official transaction data is not configured.' });

    try {
      const provider = providerFactory({ serviceKey, referenceDate:new Date() });
      const detail = await provider.getBuildingDetail({ areaCode, propertyType, buildingKey, legalCode, months:6 });
      if (!detail) return res.status(404).json({ error:'Building not found in the selected recent transaction period.' });
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({
        city:'seoul',
        districtCode:areaCode,
        districtName:SEOUL_DISTRICTS[areaCode],
        propertyType,
        ...detail
      });
    } catch (error) {
      logApiError('explore-building', error, { lawdCd:areaCode, type:propertyType });
      return res.status(500).json({ error:'Official transaction data is temporarily unavailable.' });
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
