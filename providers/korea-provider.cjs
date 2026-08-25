const { completedMonths, fetchRentalMonth, fetchSaleMonth: defaultFetchSaleMonth } = require('../lib/real-price-core.cjs');
const { buildAreaSummary, aggregateDongs, buildDongSummary, aggregateBuildings, buildBuildingDetail } = require('./provider-utils.cjs');

function createKoreaHousingProvider({
  serviceKey,
  fetchImpl = fetch,
  referenceDate = new Date(),
  fetchMonth = fetchRentalMonth,
  fetchSaleMonth = defaultFetchSaleMonth
} = {}) {
  if (!serviceKey) throw new TypeError('serviceKey is required.');
  const cache = new Map();
  const saleCache = new Map();

  async function fetchMonthsSequentially(keys, fetcher) {
    const batches = [];
    for (const dealYmd of keys) batches.push(await fetcher(dealYmd));
    return batches.flat();
  }

  async function rowsFor({ areaCode, propertyType, months = 6 }) {
    const keys = completedMonths(referenceDate, months);
    const cacheKey = `${areaCode}:${propertyType}:${keys.join(',')}`;
    if (!cache.has(cacheKey)) {
      const promise = fetchMonthsSequentially(keys, dealYmd => fetchMonth({
        serviceKey,
        type:propertyType,
        lawdCd:areaCode,
        dealYmd,
        fetchImpl
      }));
      cache.set(cacheKey, promise);
    }
    return cache.get(cacheKey);
  }

  async function saleRowsFor({ areaCode, propertyType, months = 6 }) {
    if (propertyType !== 'apartment') return null;
    const keys = completedMonths(referenceDate, months);
    const cacheKey = `${areaCode}:${propertyType}:sale:${keys.join(',')}`;
    if (!saleCache.has(cacheKey)) {
      const promise = fetchMonthsSequentially(keys, dealYmd => fetchSaleMonth({
        serviceKey,
        type:propertyType,
        lawdCd:areaCode,
        dealYmd,
        fetchImpl
      }));
      saleCache.set(cacheKey, promise);
    }
    return saleCache.get(cacheKey);
  }

  return {
    async getAreaSummary({ areaCode, propertyType, months = 6 }) {
      const items = await rowsFor({ areaCode, propertyType, months });
      return buildAreaSummary(items, { referenceDate, months });
    },
    async getDongs({ areaCode, propertyType, months = 6 }) {
      const items = await rowsFor({ areaCode, propertyType, months });
      return aggregateDongs(items, { referenceDate, months });
    },
    async getDongSummary({ areaCode, propertyType, dong, months = 6 }) {
      const items = await rowsFor({ areaCode, propertyType, months });
      return buildDongSummary(items, { dong, referenceDate, months });
    },
    async getBuildings({ areaCode, propertyType, dong = '', months = 6 }) {
      const items = await rowsFor({ areaCode, propertyType, months });
      return aggregateBuildings(items, { dong, referenceDate, months });
    },
    async getBuildingDetail({ areaCode, propertyType, buildingKey, months = 6 }) {
      const items = await rowsFor({ areaCode, propertyType, months });
      let saleRows = null;
      if (propertyType === 'apartment') {
        try {
          saleRows = await saleRowsFor({ areaCode, propertyType, months });
        } catch (_) {
          saleRows = null;
        }
      }
      return buildBuildingDetail(items, { buildingKey, referenceDate, months, saleRows });
    }
  };
}

module.exports = { createKoreaHousingProvider };
