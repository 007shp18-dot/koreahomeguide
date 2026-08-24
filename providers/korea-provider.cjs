const { completedMonths, fetchRentalMonth } = require('../lib/real-price-core.cjs');
const { buildAreaSummary, aggregateBuildings, buildBuildingDetail } = require('./provider-utils.cjs');

function createKoreaHousingProvider({ serviceKey, fetchImpl = fetch, referenceDate = new Date(), fetchMonth = fetchRentalMonth } = {}) {
  if (!serviceKey) throw new TypeError('serviceKey is required.');
  const cache = new Map();

  async function rowsFor({ areaCode, propertyType, months = 6 }) {
    const keys = completedMonths(referenceDate, months);
    const cacheKey = `${areaCode}:${propertyType}:${keys.join(',')}`;
    if (!cache.has(cacheKey)) {
      const promise = Promise.all(keys.map(dealYmd => fetchMonth({
        serviceKey,
        type:propertyType,
        lawdCd:areaCode,
        dealYmd,
        fetchImpl
      }))).then(batches => batches.flat());
      cache.set(cacheKey, promise);
    }
    return cache.get(cacheKey);
  }

  return {
    async getAreaSummary({ areaCode, propertyType, months = 6 }) {
      const items = await rowsFor({ areaCode, propertyType, months });
      return buildAreaSummary(items, { referenceDate, months });
    },
    async getBuildings({ areaCode, propertyType, months = 6 }) {
      const items = await rowsFor({ areaCode, propertyType, months });
      return aggregateBuildings(items, { referenceDate, months });
    },
    async getBuildingDetail({ areaCode, propertyType, buildingKey, months = 6 }) {
      const items = await rowsFor({ areaCode, propertyType, months });
      return buildBuildingDetail(items, { buildingKey, referenceDate, months });
    }
  };
}

module.exports = { createKoreaHousingProvider };
