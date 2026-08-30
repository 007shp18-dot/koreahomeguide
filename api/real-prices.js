const {
  normalizeServiceKey,
  endpointForType,
  saleEndpointForType,
  fetchRentalMonth,
  fetchSaleMonth,
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

  // `deal` selects which register to read: rental contracts (the default, and
  // what every existing caller expects) or sale contracts. Sale exists only for
  // apartments upstream, so an unsupported combination is rejected rather than
  // quietly falling back to rentals — a silent fallback here would hand the
  // caller deposit/monthlyRent rows while it was asking for prices.
  const { type = 'apartment', lawdCd, dealYmd, deal = 'rent' } = req.query;
  if (!isSupportedAreaCode(lawdCd) || !isRecentCompletedMonth(dealYmd)) {
    return res.status(400).json({ error: 'Invalid lawdCd or dealYmd.' });
  }
  if (deal !== 'rent' && deal !== 'sale') {
    return res.status(400).json({ error: "Unsupported deal. Use 'rent' or 'sale'." });
  }

  const endpoint = deal === 'sale' ? saleEndpointForType(type) : endpointForType(type);
  if (!endpoint) {
    return res.status(400).json({
      error: deal === 'sale'
        ? 'Sale data is only available for apartments.'
        : 'Unsupported property type.'
    });
  }

  try {
    const items = deal === 'sale'
      ? await fetchSaleMonth({ serviceKey, type, lawdCd, dealYmd, pageSize: 1000, retryImpl: fetchWithRetry })
      : await fetchRentalMonth({ serviceKey, type, lawdCd, dealYmd, pageSize: 100, retryImpl: fetchWithRetry });
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ deal, items });
  } catch (error) {
    logApiError('real-prices', error, { lawdCd, type, dealYmd, deal });
    const status = Number.isInteger(error && error.upstreamStatus) ? 502 : 500;
    const message = status === 502
      ? 'Public transaction data is temporarily unavailable.'
      : 'Failed to reach the public transaction API.';
    // The upstream reason is what distinguishes "not subscribed to this
    // data.go.kr service" from "the service is down". Without it the caller is
    // guessing, which is exactly what happened while sale data looked empty.
    return res.status(status).json({
      error: message,
      reason: (error && error.message) || undefined,
      upstreamStatus: Number.isInteger(error && error.upstreamStatus) ? error.upstreamStatus : undefined
    });
  }
};
