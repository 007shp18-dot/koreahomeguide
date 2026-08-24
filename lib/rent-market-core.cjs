const { median, completedMonthKeys, normalizeTransaction } = require('./rent-check-core.cjs');

const SIZE_BANDS = [
  { key:'under20', label:'Under 20㎡', min:0, max:20 },
  { key:'20to30', label:'20–30㎡', min:20, max:30 },
  { key:'30to40', label:'30–40㎡', min:30, max:40 },
  { key:'40to60', label:'40–60㎡', min:40, max:60 },
  { key:'60plus', label:'60㎡+', min:60, max:Infinity }
];

function monthKey(date) {
  const m = String(date || '').match(/^(\d{4})-(\d{2})-/);
  return m ? `${m[1]}${m[2]}` : '';
}

function pctChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;
  return Math.round((((current - previous) / previous) * 100) * 10) / 10;
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
    medianDepositWon: median(monthly.map(item => item.depositWon)),
    medianMonthlyRentWon: median(monthly.map(item => item.monthlyRentWon)),
    jeonseCount: jeonse.length,
    medianJeonseDepositWon: median(jeonse.map(item => item.depositWon)),
    sizeBands,
    quarterChangePct: pctChange(currentMedian, previousMedian),
    recentContracts,
    dataThroughMonth: latestMonth ? `${latestMonth.slice(0, 4)}-${latestMonth.slice(4)}` : null
  };
}

module.exports = { SIZE_BANDS, pctChange, buildRentMarketStats };
