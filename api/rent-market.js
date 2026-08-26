const { normalizeServiceKey, completedMonths, fetchRentalMonth } = require('../lib/real-price-core.cjs');
const { buildRentMarketStats } = require('../lib/rent-market-core.cjs');
const { aggregateDongs } = require('../providers/provider-utils.cjs');
const { trustedRequestSource, logApiError } = require('../lib/api-guard.cjs');
const { isSupportedAreaCode } = require('../providers/seoul-config.cjs');

function createHandler({ fetchMonth = fetchRentalMonth, now = () => new Date() } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!trustedRequestSource(req)) return res.status(403).json({ error: 'Request origin is not allowed.' });

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) {
      return res.status(500).json({ error: 'DATA_GO_KR_SERVICE_KEY is not configured in Vercel.' });
    }

    const type = String(req.query.type || 'apartment');
    const lawdCd = String(req.query.lawdCd || '');
    const months = 6;
    if (!['apartment', 'officetel', 'villa', 'detached'].includes(type)) {
      return res.status(400).json({ error: 'Unsupported property type.' });
    }
    if (!isSupportedAreaCode(lawdCd)) {
      return res.status(400).json({ error: 'Invalid lawdCd.' });
    }

    try {
      const referenceDate = now();
      const keys = completedMonths(referenceDate, months);
      const batches = [];
      for (const dealYmd of keys) batches.push(await fetchMonth({ serviceKey, type, lawdCd, dealYmd }));
      const rows = batches.flat();
      const stats = buildRentMarketStats(rows, { referenceDate, months });
      const dongs = aggregateDongs(rows, { referenceDate, months });
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ districtCode: lawdCd, propertyType: type, ...stats, dongs });
    } catch (error) {
      logApiError('rent-market', error, { lawdCd, type });
      return res.status(500).json({ error: 'Failed to load rent market statistics.' });
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
