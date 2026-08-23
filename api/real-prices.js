const { tag, normalizeServiceKey, endpointForType, parseItems } = require('../lib/real-price-core.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawServiceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!rawServiceKey) {
    return res.status(500).json({ error: 'DATA_GO_KR_SERVICE_KEY is not configured in Vercel.' });
  }

  const serviceKey = normalizeServiceKey(rawServiceKey);

  const { type = 'apartment', lawdCd, dealYmd } = req.query;
  if (!/^\d{5}$/.test(String(lawdCd || '')) || !/^\d{6}$/.test(String(dealYmd || ''))) {
    return res.status(400).json({ error: 'Invalid lawdCd or dealYmd.' });
  }

  const endpoint = endpointForType(type);
  if (!endpoint) return res.status(400).json({ error: 'Unsupported property type.' });

  const params = new URLSearchParams({
    serviceKey,
    LAWD_CD: String(lawdCd),
    DEAL_YMD: String(dealYmd),
    numOfRows: '100',
    pageNo: '1'
  });

  try {
    const upstream = await fetch(`${endpoint}?${params.toString()}`, {
      headers: { Accept: 'application/xml,text/xml,*/*' }
    });
    const xml = await upstream.text();

    if (!upstream.ok) {
      return res.status(502).json({ error: `Public API returned HTTP ${upstream.status}.` });
    }

    const resultCode = tag(xml, 'resultCode');
    const resultMsg = tag(xml, 'resultMsg');
    if (resultCode && resultCode !== '00' && resultCode !== '000') {
      return res.status(502).json({ error: resultMsg || `Public API error (${resultCode}).` });
    }

    const items = parseItems(xml, type);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ items });
  } catch (_) {
    return res.status(500).json({ error: 'Failed to reach the public transaction API.' });
  }
};
