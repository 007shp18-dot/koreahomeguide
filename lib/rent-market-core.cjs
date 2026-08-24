const { median, completedMonthKeys, normalizeTransaction } = require('./rent-check-core.cjs');

const SIZE_BANDS = [
  { key:'under20', label:'Under 20㎡', min:0, max:20 },
  { key:'20to30', label:'20–30㎡', min:20, max:30 },
  { key:'30to40', label:'30–40㎡', min:30, max:40 },
  { key:'40to60', label:'40–60㎡', min:40, max:60 },
  { key:'60plus', label:'60㎡+', min:60, max:Infinity }
];

const DEPOSIT_BANDS = [
  { key:'under10m', minDepositWon:0, maxDepositWon:10_000_000 },
  { key:'10to30m', minDepositWon:10_000_000, maxDepositWon:30_000_000 },
  { key:'30to50m', minDepositWon:30_000_000, maxDepositWon:50_000_000 },
  { key:'50to100m', minDepositWon:50_000_000, maxDepositWon:100_000_000 },
  { key:'100to200m', minDepositWon:100_000_000, maxDepositWon:200_000_000 },
  { key:'200to400m', minDepositWon:200_000_000, maxDepositWon:400_000_000 },
  { key:'400mplus', minDepositWon:400_000_000, maxDepositWon:Infinity }
];

function monthKey(date) {
  const m = String(date || '').match(/^(\d{4})-(\d{2})-/);
  return m ? `${m[1]}${m[2]}` : '';
}

function pctChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;
  return Math.round((((current - previous) / previous) * 100) * 10) / 10;
}

function contractTypeCounts(rows) {
  const counts = { new:0, renewal:0, unknown:0 };
  for (const row of rows || []) {
    const key = row && (row.contractType === 'new' || row.contractType === 'renewal') ? row.contractType : 'unknown';
    counts[key] += 1;
  }
  return counts;
}

function contextualMonthlyRows(rows, minimumNew = 3) {
  const monthly = (rows || []).filter(row => row.monthlyRentWon > 0);
  const newRows = monthly.filter(row => row.contractType === 'new');
  if (newRows.length >= minimumNew) return { rows:newRows, basis:'new-contracts', newRows, monthly };
  return { rows:monthly, basis:'all-reported-monthly-rent', newRows, monthly };
}

function buildDepositBands(rows) {
  return DEPOSIT_BANDS.map(band => {
    const matches = (rows || []).filter(row => row.monthlyRentWon > 0 && row.depositWon >= band.minDepositWon && row.depositWon < band.maxDepositWon);
    return {
      ...band,
      count:matches.length,
      medianDepositWon:median(matches.map(row => row.depositWon)),
      medianMonthlyRentWon:median(matches.map(row => row.monthlyRentWon)),
      minMonthlyRentWon:matches.length ? Math.min(...matches.map(row => row.monthlyRentWon)) : null,
      maxMonthlyRentWon:matches.length ? Math.max(...matches.map(row => row.monthlyRentWon)) : null
    };
  }).filter(band => band.count > 0);
}

function approximateArea(areaSqm) {
  const n = Number(areaSqm);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(5, Math.round(n / 5) * 5);
}

function buildAreaGroups(rows) {
  const groups = new Map();
  for (const row of rows || []) {
    if (!(row.monthlyRentWon > 0)) continue;
    const approxAreaSqm = approximateArea(row.areaSqm);
    if (!approxAreaSqm) continue;
    if (!groups.has(approxAreaSqm)) groups.set(approxAreaSqm, []);
    groups.get(approxAreaSqm).push(row);
  }
  return [...groups.entries()].sort((a,b) => a[0]-b[0]).map(([approxAreaSqm, matches]) => ({
    approxAreaSqm,
    count:matches.length,
    medianAreaSqm:median(matches.map(row => row.areaSqm)),
    medianDepositWon:median(matches.map(row => row.depositWon)),
    medianMonthlyRentWon:median(matches.map(row => row.monthlyRentWon)),
    depositBands:buildDepositBands(matches)
  }));
}

function contextualStatsFromNormalized(rows) {
  const monthly = (rows || []).filter(row => row.monthlyRentWon > 0);
  const newMonthly = monthly.filter(row => row.contractType === 'new');
  const renewalMonthly = monthly.filter(row => row.contractType === 'renewal');
  const selected = contextualMonthlyRows(rows);
  return {
    contractTypeCounts:contractTypeCounts(rows),
    newContractMonthlyRentCount:newMonthly.length,
    renewalMonthlyRentCount:renewalMonthly.length,
    unknownMonthlyRentCount:monthly.length - newMonthly.length - renewalMonthly.length,
    contextualBasis:selected.basis,
    contextualMonthlyRentCount:selected.rows.length,
    contextualMedianMonthlyRentWon:median(selected.rows.map(row => row.monthlyRentWon)),
    contextualMedianDepositWon:median(selected.rows.map(row => row.depositWon)),
    medianMonthlyRentWonNew:median(newMonthly.map(row => row.monthlyRentWon)),
    medianDepositWonNew:median(newMonthly.map(row => row.depositWon)),
    depositBands:buildDepositBands(selected.rows),
    areaGroups:buildAreaGroups(selected.rows)
  };
}

function buildRentMarketStats(items, options = {}) {
  const months = Number(options.months || 6);
  const referenceDate = options.referenceDate || new Date();
  const validMonths = completedMonthKeys(referenceDate, months);
  const validMonthSet = new Set(validMonths);
  const normalized = (items || [])
    .map(normalizeTransaction)
    .filter(Boolean)
    .filter(item => validMonthSet.has(monthKey(item.contractDate)));

  const monthly = normalized.filter(item => item.monthlyRentWon > 0);
  const jeonse = normalized.filter(item => item.monthlyRentWon === 0);
  const firstQuarterMonths = new Set(validMonths.slice(0, 3));
  const priorQuarterMonths = new Set(validMonths.slice(3, 6));
  const currentQuarter = monthly.filter(item => firstQuarterMonths.has(monthKey(item.contractDate)));
  const previousQuarter = monthly.filter(item => priorQuarterMonths.has(monthKey(item.contractDate)));
  const currentMedian = median(currentQuarter.map(item => item.monthlyRentWon));
  const previousMedian = median(previousQuarter.map(item => item.monthlyRentWon));

  const sizeBands = SIZE_BANDS.map(band => {
    const rows = monthly.filter(item => item.areaSqm >= band.min && item.areaSqm < band.max);
    return {
      key: band.key,
      label: band.label,
      count: rows.length,
      medianMonthlyRentWon: median(rows.map(item => item.monthlyRentWon)),
      medianDepositWon: median(rows.map(item => item.depositWon))
    };
  });

  const recentContracts = [...normalized]
    .sort((a, b) => String(b.contractDate).localeCompare(String(a.contractDate)))
    .slice(0, 10);

  const latestMonth = validMonths[0] || '';
  return {
    monthsUsed: months,
    totalContracts: normalized.length,
    monthlyRentCount: monthly.length,
    // Legacy medians retained for compatibility. UI should prefer contextual* and bands.
    medianDepositWon: median(monthly.map(item => item.depositWon)),
    medianMonthlyRentWon: median(monthly.map(item => item.monthlyRentWon)),
    jeonseCount: jeonse.length,
    medianJeonseDepositWon: median(jeonse.map(item => item.depositWon)),
    sizeBands,
    ...contextualStatsFromNormalized(normalized),
    quarterChangePct: pctChange(currentMedian, previousMedian),
    recentContracts,
    dataThroughMonth: latestMonth ? `${latestMonth.slice(0, 4)}-${latestMonth.slice(4)}` : null
  };
}

module.exports = {
  SIZE_BANDS,
  DEPOSIT_BANDS,
  pctChange,
  contractTypeCounts,
  contextualMonthlyRows,
  buildDepositBands,
  buildAreaGroups,
  contextualStatsFromNormalized,
  buildRentMarketStats
};
