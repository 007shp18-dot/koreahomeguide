const {
  normalizeServiceKey,
  completedMonths,
  fetchRentalMonth,
  fetchWithRetry
} = require('../lib/real-price-core.cjs');
const { trustedRequestSource, logApiError } = require('../lib/api-guard.cjs');
const { isSupportedAreaCode } = require('../providers/seoul-config.cjs');
const {
  TIERS,
  validateRentCheckInput,
  buildResultForTier
} = require('../lib/rent-check-core.cjs');

const FRIENDLY_UPSTREAM_ERROR = 'Official transaction data is temporarily unavailable. Please try again shortly.';

function parseRentCheckQuery(query = {}) {
  const lawdCd = String(query.lawdCd || '');
  const propertyType = String(query.type || '');
  if (!isSupportedAreaCode(lawdCd)) return { ok: false, error: 'Choose a valid Seoul district.' };
  if (!['apartment', 'officetel', 'villa', 'detached'].includes(propertyType)) {
    return { ok: false, error: 'Choose a supported property type.' };
  }
  const depositWon = Number(query.deposit);
  const rentWon = Number(query.rent);
  const areaSqm = Number(query.area);
  const validation = validateRentCheckInput({ depositWon, rentWon, areaSqm });
  if (!validation.ok) return validation;
  return { ok: true, value: { lawdCd, propertyType, ...validation.value } };
}

function createHandler({ fetchMonth = fetchRentalMonth, now = () => new Date() } = {}) {
  return async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!trustedRequestSource(req)) return res.status(403).json({ error: 'Request origin is not allowed.' });

  const parsed = parseRentCheckQuery(req.query);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });

  const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
  if (!serviceKey) return res.status(500).json({ error: 'Rent comparison is temporarily unavailable.' });

  const { lawdCd, propertyType, depositWon, rentWon, areaSqm } = parsed.value;
  const referenceDate = now();
  const months = completedMonths(referenceDate, 12);
  const allItems = [];
  let fetchedCount = 0;

  try {
    for (const tier of TIERS) {
      const neededMonths = months.slice(fetchedCount, tier.months);
      for (const dealYmd of neededMonths) {
        const group = await fetchMonth({
          serviceKey,
          type:propertyType,
          lawdCd,
          dealYmd,
          retryImpl:fetchWithRetry
        });
        for (const item of group) allItems.push({ ...item, type: propertyType });
      }
      fetchedCount = tier.months;

      const result = buildResultForTier(allItems, {
        depositWon,
        rentWon,
        areaSqm,
        referenceDate,
        propertyType
      }, tier);

      if (result.rating !== 'insufficient') {
        res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
        return res.status(200).json(result);
      }
    }

    const broad = buildResultForTier(allItems, {
      depositWon,
      rentWon,
      areaSqm,
      referenceDate,
      propertyType
    }, TIERS[2]);
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json(broad);
  } catch (error) {
    logApiError('rent-check', error, { lawdCd, type:propertyType });
    return res.status(502).json({ error: FRIENDLY_UPSTREAM_ERROR });
  }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
module.exports.parseRentCheckQuery = parseRentCheckQuery;
module.exports.FRIENDLY_UPSTREAM_ERROR = FRIENDLY_UPSTREAM_ERROR;
