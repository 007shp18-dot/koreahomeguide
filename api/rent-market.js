const { normalizeServiceKey, completedMonths, fetchRentalMonth } = require('../lib/real-price-core.cjs');
const { buildRentMarketStats } = require('../lib/rent-market-core.cjs');
const { aggregateDongs } = require('../providers/provider-utils.cjs');
const { isSupportedAreaCode, isSupportedPropertyType } = require('../providers/seoul-config.cjs');
const { trustedRequestSource, logApiError } = require('../lib/api-guard.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!trustedRequestSource(req)) return res.status(403).json({ error: 'Request origin is not allowed.' });

  const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
  if (!serviceKey) return res.status(500).json({ error: 'DATA_GO_KR_SERVICE_KEY is not configured in Vercel.' });

  const type = String(req.query.type || 'apartment');
  const lawdCd = String(req.query.lawdCd || '');
  const months = 6;
  if (!isSupportedPropertyType(type)) return res.status(400).json({ error: 'Unsupported property type.' });
  if (!isSupportedAreaCode(lawdCd)) return res.status(400).json({ error: 'Unsupported Seoul district.' });

  try {
    const keys = completedMonths(new Date(), months);
    const batches = await Promise.all(keys.map(dealYmd => fetchRentalMonth({ serviceKey, type, lawdCd, dealYmd })));
    const rows = batches.flat();
    const referenceDate = new Date();
    const stats = buildRentMarketStats(rows, { referenceDate, months });
    const dongs = aggregateDongs(rows, { referenceDate, months });
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ districtCode: lawdCd, propertyType: type, ...stats, dongs });
  } catch (err) {
    logApiError('rent-market', err, { lawdCd, type });
    return res.status(502).json({ error: 'Failed to load rent market statistics.' });
  }
};
