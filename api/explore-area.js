'use strict';

const {
  normalizeServiceKey,
  completedMonths,
  fetchRentalMonth
} = require('../lib/real-price-core.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const {
  aggregateDongs,
  buildAreaSummary
} = require('../providers/provider-utils.cjs');
const {
  SEOUL_DISTRICTS,
  districtSlugFromCode,
  isSupportedAreaCode,
  isSupportedPropertyType
} = require('../providers/seoul-config.cjs');
const LOCATIONS = require('../location-catalog.js');
const { trustedRequestSource, logApiError } = require('../lib/api-guard.cjs');

const SUPPORTED_DISTRICT_CODES = Object.freeze(Object.keys(SEOUL_DISTRICTS));
const SEOUL_WIDE_MONTHS = 3;
const DEFAULT_BATCH_SIZE = 5;

function chunk(items, size) {
  const output = [];
  const width = Math.max(1, Number(size) || DEFAULT_BATCH_SIZE);
  for (let index = 0; index < items.length; index += width) {
    output.push(items.slice(index, index + width));
  }
  return output;
}

function normalizeOptions(input) {
  if (typeof input === 'function') return { providerFactory:input };
  return input || {};
}

async function loadAllSeoul({
  serviceKey,
  propertyType,
  referenceDate,
  fetchMonth,
  aggregate,
  buildSummary,
  batchSize
}) {
  const monthKeys = completedMonths(referenceDate, SEOUL_WIDE_MONTHS);
  const allRows = [];
  const dongs = [];
  const districts = [];

  for (const districtBatch of chunk(SUPPORTED_DISTRICT_CODES, batchSize)) {
    const districtResults = await Promise.all(districtBatch.map(async areaCode => {
      const monthlyBatches = await Promise.all(monthKeys.map(dealYmd => fetchMonth({
        serviceKey,
        type:propertyType,
        lawdCd:areaCode,
        dealYmd
      })));
      const rows = monthlyBatches.flat();
      const districtDongs = aggregate(rows, {
        areaCode,
        referenceDate,
        months:SEOUL_WIDE_MONTHS
      }).map(item => ({
        ...item,
        districtCode:areaCode,
        districtName:SEOUL_DISTRICTS[areaCode]
      }));
      const districtSummary = buildSummary(rows, {
        referenceDate,
        months:SEOUL_WIDE_MONTHS
      });
      if (districtSummary && districtSummary.monthsUsed == null) {
        districtSummary.monthsUsed = SEOUL_WIDE_MONTHS;
      }
      return {
        rows,
        districtDongs,
        district:{
          districtCode:areaCode,
          slug:districtSlugFromCode(areaCode),
          districtName:SEOUL_DISTRICTS[areaCode],
          districtNameKo:LOCATIONS.RENT_CHECK_DISTRICTS[areaCode]?.ko || '',
          summary:districtSummary,
          contractCount:Number(districtSummary?.totalContracts || 0)
        }
      };
    }));

    for (const result of districtResults) {
      allRows.push(...result.rows);
      dongs.push(...result.districtDongs);
      districts.push(result.district);
    }
  }

  const summary = buildSummary(allRows, {
    referenceDate,
    months:SEOUL_WIDE_MONTHS
  });
  if (summary && summary.monthsUsed == null) summary.monthsUsed = SEOUL_WIDE_MONTHS;

  return {
    city:'seoul',
    districtCode:'all',
    districtName:'All supported Seoul',
    propertyType,
    summary,
    districts,
    dongs,
    buildings:[]
  };
}

function createHandler(input = {}) {
  const {
    providerFactory = options => createKoreaHousingProvider(options),
    fetchMonth = fetchRentalMonth,
    aggregateDongs:aggregate = aggregateDongs,
    buildAreaSummary:buildSummary = buildAreaSummary,
    referenceDate = null,
    batchSize = DEFAULT_BATCH_SIZE
  } = normalizeOptions(input);

  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
    if (!trustedRequestSource(req)) return res.status(403).json({ error:'Request origin is not allowed.' });

    const query = req.query || {};
    const allSeoul = String(query.scope || '') === 'all';
    const propertyType = String(query.type || 'officetel');
    const areaCode = String(query.lawdCd || '');
    if (!isSupportedPropertyType(propertyType)) {
      return res.status(400).json({ error:'Unsupported property type.' });
    }
    if (!allSeoul && !isSupportedAreaCode(areaCode)) {
      return res.status(400).json({ error:'Unsupported Seoul district.' });
    }

    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return res.status(500).json({ error:'Official transaction data is not configured.' });

    const effectiveReferenceDate = referenceDate || new Date();
    try {
      if (allSeoul) {
        const payload = await loadAllSeoul({
          serviceKey,
          propertyType,
          referenceDate:effectiveReferenceDate,
          fetchMonth,
          aggregate,
          buildSummary,
          batchSize
        });
        res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
        return res.status(200).json(payload);
      }

      const provider = providerFactory({ serviceKey, referenceDate:effectiveReferenceDate });
      const [summary, dongs, buildings] = await Promise.all([
        provider.getAreaSummary({ areaCode, propertyType, months:6 }),
        provider.getDongs({ areaCode, propertyType, months:6 }),
        provider.getBuildings({ areaCode, propertyType, months:6 })
      ]);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({
        city:'seoul',
        districtCode:areaCode,
        districtName:SEOUL_DISTRICTS[areaCode],
        propertyType,
        summary,
        dongs,
        buildings
      });
    } catch (error) {
      logApiError(allSeoul ? 'explore-seoul' : 'explore-area', error, {
        lawdCd:allSeoul ? undefined : String(query.lawdCd || ''),
        type:propertyType
      });
      return res.status(allSeoul ? 502 : 500).json({
        error:'Official transaction data is temporarily unavailable.'
      });
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
module.exports.loadAllSeoul = loadAllSeoul;
module.exports.SUPPORTED_DISTRICT_CODES = SUPPORTED_DISTRICT_CODES;
module.exports.SEOUL_WIDE_MONTHS = SEOUL_WIDE_MONTHS;
module.exports.DEFAULT_BATCH_SIZE = DEFAULT_BATCH_SIZE;
