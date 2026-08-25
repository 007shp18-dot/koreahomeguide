const { tag, normalizeServiceKey, endpointForType, parseItems } = require('../lib/real-price-core.cjs');
const { isSupportedAreaCode, isSupportedPropertyType } = require('../providers/seoul-config.cjs');
const { trustedRequestSource, isRecentCompletedMonth, fetchWithRetry, DEFAULT_UPSTREAM_TIMEOUT_MS, logApiError } = require('../lib/api-guard.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!trustedRequestSource(req)) return res.status(403).json({ error: 'Request origin is not allowed.' });

  const rawServiceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!rawServiceKey) return res.status(500).json({ error: 'DATA_GO_KR_SERVICE_KEY is not configured in Vercel.' });
  const serviceKey = normalizeServiceKey(rawServiceKey);
  const type = String(req.query.type || 'apartment');
  const lawdCd = String(req.query.lawdCd || '');
  const dealYmd = String(req.query.dealYmd || '');

  if (!isSupportedAreaCode(lawdCd)) return res.status(400).json({ error: 'Unsupported Seoul district.' });
  if (!isSupportedPropertyType(type)) return res.status(400).json({ error: 'Unsupported property type.' });
  if (!isRecentCompletedMonth(dealYmd, { maxMonths: 60 })) return res.status(400).json({ error: 'Choose a recent completed month.' });

  const endpoint = endpointForType(type);
  const params = new URLSearchParams({ serviceKey, LAWD_CD: lawdCd, DEAL_YMD: dealYmd, numOfRows: '100', pageNo: '1' });

  try {
    const upstream = await fetchWithRetry(fetch, `${endpoint}?${params.toString()}`, {
      headers: { Accept: 'application/xml,text/xml,*/*' }
    }, DEFAULT_UPSTREAM_TIMEOUT_MS);
    const xml = await upstream.text();
    if (!upstream.ok) return res.status(502).json({ error: `Public API returned HTTP ${upstream.status}.` });
    const resultCode = tag(xml, 'resultCode');
    const resultMsg = tag(xml, 'resultMsg');
    if (resultCode && resultCode !== '00' && resultCode !== '000') {
      return res.status(502).json({ error: resultMsg || `Public API error (${resultCode}).` });
    }
    const items = parseItems(xml, type);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ items });
  } catch (err) {
    logApiError('real-prices', err, { lawdCd, type, dealYmd });
    return res.status(502).json({ error: 'Failed to reach the public transaction API.' });
  }
};
