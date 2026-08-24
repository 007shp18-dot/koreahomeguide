const { median, completedMonthKeys, normalizeTransaction } = require('../lib/rent-check-core.cjs');
const { buildRentMarketStats, pctChange } = require('../lib/rent-market-core.cjs');

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
      return { ...normalized, explorerBuildingName, explorerDong };
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
  return {
    buildingKey:group.key,
    buildingName:group.buildingName,
    dong:group.dong || '',
    contractCount:rows.length,
    monthlyRentCount:monthly.length,
    medianMonthlyRentWon:median(monthly.map(row => row.monthlyRentWon)),
    medianDepositWon:median(monthly.map(row => row.depositWon)),
    typicalAreaSqm:median(rows.map(row => row.areaSqm)),
    quarterChangePct:quarterChangeForRows(rows, options)
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
      quarterChangePct:quarterChangeForRows(rows, options)
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
  const buildingNames = new Set(rows.map(row => normalizeBuildingName(row.explorerBuildingName)).filter(Boolean));
  return {
    dong:selectedDong,
    contractCount:rows.length,
    totalContracts:rows.length,
    monthlyRentCount:monthly.length,
    buildingCount:buildingNames.size,
    medianMonthlyRentWon:median(monthly.map(row => row.monthlyRentWon)),
    medianDepositWon:median(monthly.map(row => row.depositWon)),
    typicalAreaSqm:median(rows.map(row => row.areaSqm)),
    quarterChangePct:quarterChangeForRows(rows, { referenceDate, months }),
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

function buildBuildingDetail(items, { buildingKey, referenceDate = new Date(), months = 6 } = {}) {
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
  return {
    ...summary,
    monthlyTrend:buildMonthlyTrend(group.rows, { referenceDate, months }),
    recentTransactions
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
  buildingKeyFromName,
  filterCompletedRows,
  quarterChangeForRows,
  aggregateDongs,
  buildDongSummary,
  aggregateBuildings,
  buildBuildingDetail,
  buildAreaSummary,
  buildMonthlyTrend
};
