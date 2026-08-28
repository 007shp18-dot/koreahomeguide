const { median, completedMonthKeys, normalizeTransaction, numberFromManwon } = require('../lib/rent-check-core.cjs');
const { buildRentMarketStats, pctChange, contextualStatsFromNormalized } = require('../lib/rent-market-core.cjs');
const { getBuildingNameDisplay } = require('../building-name-utils.js');

function normalizeBuildingName(name) {
  const normalized = String(name || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized || normalized === '-') return '';
  return normalized;
}

function normalizeDongName(name) {
  return String(name || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAddressPart(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatRoadAddress(roadName, mainNumber, subNumber) {
  const road = normalizeAddressPart(roadName);
  const main = normalizeAddressPart(mainNumber).replace(/^0+/, '') || '0';
  const sub = normalizeAddressPart(subNumber).replace(/^0+/, '');
  if (!road || main === '0') return '';
  const number = `${main}${sub && sub !== '0' ? `-${sub}` : ''}`;
  return new RegExp(`(?:^|\\s)${number.replace('-', '\\-')}$`).test(road) ? road : `${road} ${number}`;
}

function buildingKeyFromName(name, dong = '') {
  const building = normalizeBuildingName(name).toLocaleLowerCase('en-US');
  const dongKey = normalizeDongName(dong).toLocaleLowerCase('ko-KR');
  if (!building) return '';
  return dongKey ? `${dongKey}::${building}` : building;
}

function monthKey(date) {
  const match = String(date || '').match(/^(\d{4})-(\d{2})-/);
  return match ? `${match[1]}${match[2]}` : '';
}

function filterCompletedRows(items, { referenceDate = new Date(), months = 6 } = {}) {
  const validMonths = new Set(completedMonthKeys(referenceDate, months));
  return (items || [])
    .map(item => {
      const normalized = normalizeTransaction(item);
      if (!normalized) return null;
      const hasExplicitBuildingName = Object.prototype.hasOwnProperty.call(item || {}, 'buildingName');
      const explorerBuildingName = normalizeBuildingName(hasExplicitBuildingName ? item.buildingName : item.building);
      const explorerDong = normalizeDongName(item && item.dong);
      return {
        ...normalized,
        explorerBuildingName,
        explorerDong,
        explorerJibun:normalizeAddressPart(item && item.jibun),
        explorerRoadName:normalizeAddressPart(item && item.roadName),
        explorerRoadMainNumber:normalizeAddressPart(item && item.roadMainNumber),
        explorerRoadSubNumber:normalizeAddressPart(item && item.roadSubNumber)
      };
    })
    .filter(Boolean)
    .filter(row => validMonths.has(monthKey(row.contractDate)));
}

function quarterChangeForRows(rows, { referenceDate = new Date(), months = 6 } = {}) {
  const keys = completedMonthKeys(referenceDate, Math.max(6, months));
  const currentKeys = new Set(keys.slice(0, 3));
  const previousKeys = new Set(keys.slice(3, 6));
  const monthlyRows = (rows || []).filter(row => row.monthlyRentWon > 0);
  const current = monthlyRows.filter(row => currentKeys.has(monthKey(row.contractDate)));
  const previous = monthlyRows.filter(row => previousKeys.has(monthKey(row.contractDate)));
  if (current.length < 3 || previous.length < 3) return null;
  return pctChange(
    median(current.map(row => row.monthlyRentWon)),
    median(previous.map(row => row.monthlyRentWon))
  );
}

function groupBuildingRows(items, options = {}) {
  const groups = new Map();
  const selectedDong = normalizeDongName(options.dong);
  for (const row of filterCompletedRows(items, options)) {
    const buildingName = normalizeBuildingName(row.explorerBuildingName);
    const dong = normalizeDongName(row.explorerDong);
    if (!buildingName) continue;
    if (selectedDong && dong !== selectedDong) continue;
    const key = buildingKeyFromName(buildingName, dong);
    if (!groups.has(key)) groups.set(key, { key, buildingName, dong, rows:[] });
    groups.get(key).rows.push({ ...row, building:buildingName, dong });
  }
  return groups;
}

function summaryForBuilding(group, options = {}) {
  const rows = group.rows;
  const monthly = rows.filter(row => row.monthlyRentWon > 0);
  const enName = getBuildingNameDisplay(group.buildingName, 'en');
  const zhName = getBuildingNameDisplay(group.buildingName, 'zh');
  const propertyType = String(rows[0] && rows[0].type || '');
  const jibuns = [...new Set(rows.map(row => normalizeAddressPart(row.explorerJibun)).filter(Boolean))];
  const roadAddresses = [...new Set(rows.map(row => {
    return formatRoadAddress(row.explorerRoadName, row.explorerRoadMainNumber, row.explorerRoadSubNumber);
  }).filter(Boolean))];
  const singleJibun = jibuns.length === 1 ? jibuns[0] : '';
  const singleRoadAddress = roadAddresses.length === 1 ? roadAddresses[0] : '';
  const mapEligible = ['apartment','officetel'].includes(propertyType) ||
    (propertyType === 'villa' && rows.length >= 3 && Boolean(singleJibun || singleRoadAddress));
  return {
    buildingKey:group.key,
    buildingName:group.buildingName,
    officialBuildingNameKo:enName.officialNameKo,
    displayBuildingNameEn:enName.primary,
    displayBuildingNameZh:zhName.primary,
    dong:group.dong || '',
    propertyType,
    mapLocation:mapEligible ? {
      buildingName:group.buildingName,
      dong:group.dong || '',
      jibun:singleJibun,
      roadAddress:singleRoadAddress,
      basis:singleJibun || singleRoadAddress ? 'official-address' : 'named-building'
    } : null,
    contractCount:rows.length,
    monthlyRentCount:monthly.length,
    // Legacy fields kept for existing consumers; contextual fields below are safer for display.
    medianMonthlyRentWon:median(monthly.map(row => row.monthlyRentWon)),
    medianDepositWon:median(monthly.map(row => row.depositWon)),
    medianJeonseDepositWon:median(rows.filter(row => row.monthlyRentWon === 0).map(row => row.depositWon)),
    typicalAreaSqm:median(rows.map(row => row.areaSqm)),
    quarterChangePct:quarterChangeForRows(rows, options),
    ...contextualStatsFromNormalized(rows)
  };
}

function aggregateDongs(items, options = {}) {
  const groups = new Map();
  for (const row of filterCompletedRows(items, options)) {
    const dong = normalizeDongName(row.explorerDong);
    if (!dong) continue;
    if (!groups.has(dong)) groups.set(dong, []);
    groups.get(dong).push(row);
  }
  return [...groups.entries()].map(([dong, rows]) => {
    const monthly = rows.filter(row => row.monthlyRentWon > 0);
    const buildingNames = new Set(rows.map(row => normalizeBuildingName(row.explorerBuildingName)).filter(Boolean));
    return {
      dong,
      contractCount:rows.length,
      monthlyRentCount:monthly.length,
      buildingCount:buildingNames.size,
      medianMonthlyRentWon:median(monthly.map(row => row.monthlyRentWon)),
      medianDepositWon:median(monthly.map(row => row.depositWon)),
      typicalAreaSqm:median(rows.map(row => row.areaSqm)),
      quarterChangePct:quarterChangeForRows(rows, options),
      ...contextualStatsFromNormalized(rows)
    };
  }).sort((a, b) => {
    if (b.contractCount !== a.contractCount) return b.contractCount - a.contractCount;
    return a.dong.localeCompare(b.dong, 'ko');
  });
}

function buildDongSummary(items, { dong, referenceDate = new Date(), months = 6 } = {}) {
  const selectedDong = normalizeDongName(dong);
  if (!selectedDong) return null;
  const rows = filterCompletedRows(items, { referenceDate, months }).filter(row => normalizeDongName(row.explorerDong) === selectedDong);
  if (!rows.length) return null;
  const monthly = rows.filter(row => row.monthlyRentWon > 0);
  const jeonse = rows.filter(row => row.monthlyRentWon === 0);
  const buildingNames = new Set(rows.map(row => normalizeBuildingName(row.explorerBuildingName)).filter(Boolean));
  const recentTransactions = [...rows]
    .sort((a, b) => String(b.contractDate).localeCompare(String(a.contractDate)))
    .slice(0, 10)
    .map(row => ({
      building:normalizeBuildingName(row.explorerBuildingName) || row.building || '-',
      areaSqm:row.areaSqm,
      depositWon:row.depositWon,
      monthlyRentWon:row.monthlyRentWon,
      contractDate:row.contractDate,
      type:row.type,
      contractType:row.contractType,
      contractTypeRaw:row.contractTypeRaw,
      contractTerm:row.contractTerm,
      useRRRight:row.useRRRight,
      preDepositWon:row.preDepositWon,
      preMonthlyRentWon:row.preMonthlyRentWon
    }));
  return {
    dong:selectedDong,
    contractCount:rows.length,
    totalContracts:rows.length,
    monthlyRentCount:monthly.length,
    jeonseCount:jeonse.length,
    buildingCount:buildingNames.size,
    medianMonthlyRentWon:median(monthly.map(row => row.monthlyRentWon)),
    medianDepositWon:median(monthly.map(row => row.depositWon)),
    medianJeonseDepositWon:median(jeonse.map(row => row.depositWon)),
    typicalAreaSqm:median(rows.map(row => row.areaSqm)),
    quarterChangePct:quarterChangeForRows(rows, { referenceDate, months }),
    ...contextualStatsFromNormalized(rows),
    recentTransactions,
    monthsUsed:months,
    dataThroughMonth:completedMonthKeys(referenceDate, months)[0]?.replace(/^(\d{4})(\d{2})$/, '$1-$2') || null
  };
}

function aggregateBuildings(items, options = {}) {
  return [...groupBuildingRows(items, options).values()]
    .map(group => summaryForBuilding(group, options))
    .sort((a, b) => {
      if (b.contractCount !== a.contractCount) return b.contractCount - a.contractCount;
      return a.buildingName.localeCompare(b.buildingName, 'en');
    });
}

function buildMonthlyTrend(rows, { referenceDate = new Date(), months = 6 } = {}) {
  const keys = completedMonthKeys(referenceDate, months).reverse();
  return keys.map(key => {
    const monthRows = rows.filter(row => monthKey(row.contractDate) === key && row.monthlyRentWon > 0);
    return {
      month:`${key.slice(0, 4)}-${key.slice(4)}`,
      count:monthRows.length,
      medianMonthlyRentWon:median(monthRows.map(row => row.monthlyRentWon)),
      medianDepositWon:median(monthRows.map(row => row.depositWon))
    };
  });
}


function normalizeSaleTransaction(item) {
  if (!item) return null;
  const areaSqm = Number(item.areaSqm ?? item.area);
  const dealAmountWon = Number.isFinite(Number(item.dealAmountWon))
    ? Number(item.dealAmountWon)
    : numberFromManwon(item.dealAmount);
  if (!Number.isFinite(areaSqm) || areaSqm <= 0 || !Number.isFinite(dealAmountWon) || dealAmountWon <= 0) return null;
  return {
    building:normalizeBuildingName(item.buildingName || item.building),
    buildingName:normalizeBuildingName(item.buildingName || item.building),
    dong:normalizeDongName(item.dong),
    areaSqm,
    dealAmountWon,
    contractDate:String(item.contractDate || ''),
    floor:item.floor == null || item.floor === '' ? null : Number(item.floor),
    cancelled:Boolean(item.cancelled)
  };
}

function buildSaleSummary(saleRows, { buildingName, dong } = {}) {
  if (saleRows == null) return null;
  const targetName = normalizeBuildingName(buildingName);
  const targetDong = normalizeDongName(dong);
  const rows = (saleRows || [])
    .map(normalizeSaleTransaction)
    .filter(Boolean)
    .filter(row => !row.cancelled)
    .filter(row => normalizeBuildingName(row.buildingName) === targetName)
    .filter(row => !targetDong || normalizeDongName(row.dong) === targetDong)
    .sort((a,b) => String(b.contractDate).localeCompare(String(a.contractDate)));
  if (!rows.length) return null;
  const groups = new Map();
  for (const row of rows) {
    const approxAreaSqm = Math.max(5, Math.round(row.areaSqm / 5) * 5);
    if (!groups.has(approxAreaSqm)) groups.set(approxAreaSqm, []);
    groups.get(approxAreaSqm).push(row);
  }
  const areaGroups = [...groups.entries()].sort((a,b) => a[0]-b[0]).map(([approxAreaSqm, matches]) => ({
    approxAreaSqm,
    count:matches.length,
    medianAreaSqm:median(matches.map(row => row.areaSqm)),
    medianSalePriceWon:median(matches.map(row => row.dealAmountWon)),
    latestSalePriceWon:matches[0].dealAmountWon,
    latestContractDate:matches[0].contractDate
  }));
  return {
    contractCount:rows.length,
    medianSalePriceWon:median(rows.map(row => row.dealAmountWon)),
    areaGroups,
    recentSales:rows.slice(0, 10)
  };
}

function buildBuildingDetail(items, { buildingKey, referenceDate = new Date(), months = 6, saleRows = null } = {}) {
  const requestedKey = String(buildingKey || '').normalize('NFKC').trim().toLocaleLowerCase('en-US');
  if (!requestedKey) return null;
  const groups = groupBuildingRows(items, { referenceDate, months });
  let group = groups.get(requestedKey);
  if (!group && !requestedKey.includes('::')) {
    const matches = [...groups.values()].filter(candidate => buildingKeyFromName(candidate.buildingName) === requestedKey);
    if (matches.length === 1) group = matches[0];
  }
  if (!group) return null;
  const summary = summaryForBuilding(group, { referenceDate, months });
  const recentTransactions = [...group.rows]
    .sort((a, b) => String(b.contractDate).localeCompare(String(a.contractDate)))
    .slice(0, 12);
  const saleSummary = buildSaleSummary(saleRows, { buildingName:group.buildingName, dong:group.dong });
  return {
    ...summary,
    monthlyTrend:buildMonthlyTrend(group.rows, { referenceDate, months }),
    recentTransactions,
    saleSummary,
    recentSales:saleSummary ? saleSummary.recentSales : []
  };
}

function buildAreaSummary(items, { referenceDate = new Date(), months = 6 } = {}) {
  const stats = buildRentMarketStats(items, { referenceDate, months });
  const rows = filterCompletedRows(items, { referenceDate, months });
  return {
    ...stats,
    quarterChangePct:quarterChangeForRows(rows, { referenceDate, months })
  };
}

module.exports = {
  normalizeBuildingName,
  normalizeDongName,
  formatRoadAddress,
  buildingKeyFromName,
  filterCompletedRows,
  quarterChangeForRows,
  aggregateDongs,
  buildDongSummary,
  aggregateBuildings,
  normalizeSaleTransaction,
  buildSaleSummary,
  buildBuildingDetail,
  buildAreaSummary,
  buildMonthlyTrend
};
