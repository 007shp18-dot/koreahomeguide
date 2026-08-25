const { normalizeServiceKey, completedMonths } = require('../lib/real-price-core.cjs');
const { SEOUL_DISTRICTS, isSupportedPropertyType } = require('../providers/seoul-config.cjs');
const { trustedRequestSource, logApiError } = require('../lib/api-guard.cjs');

const SUPPORTED_DISTRICT_CODES = Object.freeze(Object.keys(SEOUL_DISTRICTS));
const SEOUL_WIDE_MONTHS = 3;
const DEFAULT_BATCH_SIZE = 5;

function chunk(items, size) {
  const output = [];
  const width = Math.max(1, Number(size) || DEFAULT_BATCH_SIZE);
  for (let i = 0; i < items.length; i += width) output.push(items.slice(i, i + width));
  return output;
}

function createHandler({
  fetchMonth = null,
  aggregateDongs = null,
  buildAreaSummary = null,
  referenceDate = null,
  batchSize = DEFAULT_BATCH_SIZE
} = {}) {
  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
    if (!trustedRequestSource(req)) return res.status(403).json({ error:'Request origin is not allowed.' });

    const propertyType = String(req.query.type || 'officetel');
    if (!isSupportedPropertyType(propertyType)) return res.status(400).json({ error:'Unsupported property type.' });

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return res.status(500).json({ error:'Official transaction data is not configured.' });

    const effectiveReferenceDate = referenceDate || new Date();
    const monthKeys = completedMonths(effectiveReferenceDate, SEOUL_WIDE_MONTHS);
    const actualFetchMonth = fetchMonth || require('../lib/real-price-core.cjs').fetchRentalMonth;
    const providerUtils = (!aggregateDongs || !buildAreaSummary) ? require('../providers/provider-utils.cjs') : null;
    const actualAggregateDongs = aggregateDongs || providerUtils.aggregateDongs;
    const actualBuildAreaSummary = buildAreaSummary || providerUtils.buildAreaSummary;

    try {
      const allRows = [];
      const dongs = [];

      for (const districtBatch of chunk(SUPPORTED_DISTRICT_CODES, batchSize)) {
        const districtResults = await Promise.all(districtBatch.map(async areaCode => {
          const monthlyBatches = await Promise.all(monthKeys.map(dealYmd => actualFetchMonth({
            serviceKey,
            type:propertyType,
            lawdCd:areaCode,
            dealYmd
          })));
          const rows = monthlyBatches.flat();
          const districtDongs = actualAggregateDongs(rows, {
            areaCode,
            referenceDate:effectiveReferenceDate,
            months:SEOUL_WIDE_MONTHS
          }).map(item => ({
            ...item,
            districtCode:areaCode,
            districtName:SEOUL_DISTRICTS[areaCode]
          }));
          return { rows, districtDongs };
        }));

        for (const result of districtResults) {
          allRows.push(...result.rows);
          dongs.push(...result.districtDongs);
        }
      }

      const summary = actualBuildAreaSummary(allRows, {
        referenceDate:effectiveReferenceDate,
        months:SEOUL_WIDE_MONTHS
      });
      if (summary && summary.monthsUsed == null) summary.monthsUsed = SEOUL_WIDE_MONTHS;

      res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
      return res.status(200).json({
        city:'seoul',
        districtCode:'all',
        districtName:'All supported Seoul',
        propertyType,
        summary,
        dongs,
        buildings:[]
      });
    } catch (err) {
      logApiError('explore-seoul', err, { type:propertyType });
      return res.status(502).json({ error:'Official transaction data is temporarily unavailable.' });
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
module.exports.SUPPORTED_DISTRICT_CODES = SUPPORTED_DISTRICT_CODES;
module.exports.SEOUL_WIDE_MONTHS = SEOUL_WIDE_MONTHS;
