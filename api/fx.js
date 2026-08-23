module.exports = async function handler(req, res) {
  try {
    const response = await fetch('https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,CNY');
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
