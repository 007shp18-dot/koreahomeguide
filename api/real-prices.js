const {
  normalizeServiceKey,
  endpointForType,
  fetchRentalMonth,
  fetchWithRetry
} = require('../lib/real-price-core.cjs');
const {
  trustedRequestSource,
  isRecentCompletedMonth,
  logApiError
} = require('../lib/api-guard.cjs');
const { isSupportedAreaCode } = require('../providers/seoul-config.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!trustedRequestSource(req)) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }

  const rawServiceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!rawServiceKey) {
    return res.status(500).json({ error: 'DATA_GO_KR_SERVICE_KEY is not configured in Vercel.' });
  }

  const serviceKey = normalizeServiceKey(rawServiceKey);

  const { type = 'apartment', lawdCd, dealYmd } = req.query;
  if (!isSupportedAreaCode(lawdCd) || !isRecentCompletedMonth(dealYmd)) {
    return res.status(400).json({ error: 'Invalid lawdCd or dealYmd.' });
  }

  const endpoint = endpointForType(type);
  if (!endpoint) return res.status(400).json({ error: 'Unsupported property type.' });

  try {
    const items = await fetchRentalMonth({
      serviceKey,
      type,
      lawdCd,
      dealYmd,
      pageSize:100,
      retryImpl:fetchWithRetry
    });
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ items });
  } catch (error) {
    logApiError('real-prices', error, { lawdCd, type, dealYmd });
    const status = Number.isInteger(error && error.upstreamStatus) ? 502 : 500;
    const message = status === 502
      ? 'Public transaction data is temporarily unavailable.'
      : 'Failed to reach the public transaction API.';
    return res.status(status).json({ error:message });
  }
};
