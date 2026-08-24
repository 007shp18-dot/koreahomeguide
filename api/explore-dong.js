const { normalizeServiceKey } = require('../lib/real-price-core.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const { normalizeDongName } = require('../providers/provider-utils.cjs');
const { SEOUL_DISTRICTS, isSupportedAreaCode, isSupportedPropertyType } = require('../providers/seoul-config.cjs');

function createHandler(providerFactory = options => createKoreaHousingProvider(options)) {
  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });

    const areaCode = String(req.query.lawdCd || '');
    const propertyType = String(req.query.type || 'officetel');
    const dong = normalizeDongName(req.query.dong);
    if (!isSupportedAreaCode(areaCode)) return res.status(400).json({ error:'Unsupported Seoul district.' });
    if (!isSupportedPropertyType(propertyType)) return res.status(400).json({ error:'Unsupported property type.' });
    if (!dong) return res.status(400).json({ error:'Dong is required.' });

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return res.status(500).json({ error:'Official transaction data is not configured.' });

    try {
      const provider = providerFactory({ serviceKey, referenceDate:new Date() });
      const [summary, buildings] = await Promise.all([
        provider.getDongSummary({ areaCode, propertyType, dong, months:6 }),
        provider.getBuildings({ areaCode, propertyType, dong, months:6 })
      ]);
      if (!summary) return res.status(404).json({ error:'No recent official transactions were found for this neighborhood.' });
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({
        city:'seoul',
        districtCode:areaCode,
        districtName:SEOUL_DISTRICTS[areaCode],
        propertyType,
        dong,
        summary,
        buildings
      });
    } catch (_) {
      return res.status(500).json({ error:'Official transaction data is temporarily unavailable.' });
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
