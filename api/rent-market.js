const { normalizeServiceKey, completedMonths, fetchRentalMonth } = require('../lib/real-price-core.cjs');
const { buildRentMarketStats } = require('../lib/rent-market-core.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
  if (!serviceKey) {
    return res.status(500).json({ error: 'DATA_GO_KR_SERVICE_KEY is not configured in Vercel.' });
  }

  const type = String(req.query.type || 'apartment');
  const lawdCd = String(req.query.lawdCd || '');
  const months = 6;
  if (!['apartment', 'officetel', 'villa'].includes(type)) {
    return res.status(400).json({ error: 'Unsupported property type.' });
  }
  if (!/^\d{5}$/.test(lawdCd)) {
    return res.status(400).json({ error: 'Invalid lawdCd.' });
  }

  try {
    const keys = completedMonths(new Date(), months);
    const batches = await Promise.all(
      keys.map(dealYmd => fetchRentalMonth({ serviceKey, type, lawdCd, dealYmd }))
    );
    const stats = buildRentMarketStats(batches.flat(), { referenceDate: new Date(), months });
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ districtCode: lawdCd, propertyType: type, ...stats });
  } catch (_) {
    return res.status(500).json({ error: 'Failed to load rent market statistics.' });
  }
};
