'use strict';

function createHandler({
  apiKey = process.env.GOOGLE_MAPS_BROWSER_KEY,
  mapId = process.env.GOOGLE_MAPS_MAP_ID,
  fetchImpl = (...args) => globalThis.fetch(...args)
} = {}) {
  return async function handler(req, res) {
    if (req && req.query && req.query.resource === 'maps-config') {
      if (req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
      res.setHeader('Cache-Control', 'private, max-age=300');
      const key = String(apiKey || '').trim();
      const configuredMapId = String(mapId || '').trim();
      const productionMapId = configuredMapId === 'DEMO_MAP_ID' ? '' : configuredMapId;
      return res.status(200).json(key
        ? { enabled:true, apiKey:key, ...(productionMapId ? { mapId:productionMapId } : {}) }
        : { enabled:false });
    }

    try {
      const response = await fetchImpl('https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,CNY');
      if (!response.ok) throw new Error(`FX provider returned ${response.status}`);
      const data = await response.json();
      const usd = Number(data && data.rates && data.rates.USD);
      const cny = Number(data && data.rates && data.rates.CNY);
      if (!Number.isFinite(usd) || usd <= 0 || !Number.isFinite(cny) || cny <= 0) {
        throw new Error('FX provider returned invalid rates');
      }
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({
        base: 'KRW',
        date: data.date || null,
        rates: { USD: usd, CNY: cny },
        source: 'Frankfurter'
      });
    } catch (error) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'Exchange rates are temporarily unavailable.' });
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
