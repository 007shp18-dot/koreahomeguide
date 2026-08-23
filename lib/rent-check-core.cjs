const TIERS = [
  { tier: 1, months: 3, areaPct: 0.15, depositPct: 0.25, minCount: 5 },
  { tier: 2, months: 6, areaPct: 0.20, depositPct: 0.35, minCount: 5 },
  { tier: 3, months: 12, areaPct: 0.25, depositPct: 0.50, minCount: 3 }
];

function numberFromManwon(value) {
  const n = Number(String(value ?? '0').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n * 10000 : NaN;
}

function numeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function validateRentCheckInput(input) {
  const depositWon = numeric(input && input.depositWon);
  const rentWon = numeric(input && input.rentWon);
  const areaSqm = numeric(input && input.areaSqm);
  if (!Number.isFinite(depositWon) || depositWon < 0) {
    return { ok: false, error: 'Deposit must be zero or greater.' };
  }
  if (!Number.isFinite(rentWon) || rentWon < 0) {
    return { ok: false, error: 'Monthly rent must be zero or greater.' };
  }
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) {
    return { ok: false, error: 'Size must be greater than zero.' };
  }
  return { ok: true, value: { depositWon, rentWon, areaSqm } };
}

function median(values) {
  const clean = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

function completedMonthKeys(referenceDate, count) {
  const reference = referenceDate instanceof Date ? referenceDate : new Date(referenceDate || Date.now());
  const keys = [];
  for (let offset = 1; offset <= count; offset += 1) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
    keys.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function contractMonthKey(contractDate) {
  const match = String(contractDate || '').match(/^(\d{4})-(\d{2})-/);
  return match ? `${match[1]}${match[2]}` : '';
}

function withinRelative(value, target, tolerancePct) {
  if (!Number.isFinite(value) || !Number.isFinite(target)) return false;
  if (target === 0) return value === 0;
  const delta = Math.abs(value - target);
  return delta <= Math.abs(target) * tolerancePct;
}

function normalizeTransaction(item) {
  const areaSqm = numeric(item && item.area);
  const depositWon = numberFromManwon(item && item.deposit);
  const monthlyRentWon = numberFromManwon(item && item.monthlyRent);
  if (![areaSqm, depositWon, monthlyRentWon].every(Number.isFinite)) return null;
  return {
    building: String((item && item.building) || '-'),
    areaSqm,
    depositWon,
    monthlyRentWon,
    contractDate: String((item && item.contractDate) || ''),
    type: String((item && item.type) || '')
  };
}

function comparablesForTier(items, quote, tierConfig) {
  const validation = validateRentCheckInput(quote);
  if (!validation.ok) return [];
  const { depositWon, rentWon, areaSqm } = validation.value;
  const mode = rentWon > 0 ? 'monthly-rent' : 'jeonse-deposit';
  const validMonths = new Set(completedMonthKeys(quote.referenceDate || new Date(), tierConfig.months));

  return items
    .map(normalizeTransaction)
    .filter(Boolean)
    .filter(item => validMonths.has(contractMonthKey(item.contractDate)))
    .filter(item => !quote.propertyType || item.type === quote.propertyType)
    .filter(item => withinRelative(item.areaSqm, areaSqm, tierConfig.areaPct))
    .filter(item => withinRelative(item.depositWon, depositWon, tierConfig.depositPct))
    .filter(item => mode === 'monthly-rent' ? item.monthlyRentWon > 0 : item.monthlyRentWon === 0);
}

function selectComparableTier(items, quote) {
  let broadest = [];
  for (const config of TIERS) {
    const comparables = comparablesForTier(items, quote, config);
    broadest = comparables;
    if (comparables.length >= config.minCount) return { config, comparables };
  }
  return { config: null, comparables: broadest };
}

function rateDifference(differencePct) {
  if (differencePct <= -10) return 'below';
  if (differencePct >= 10) return 'above';
  return 'fair';
}

function confidenceFor(tier, comparableCount) {
  if (tier === 1 && comparableCount >= 7) return 'high';
  if (tier === 1 && comparableCount >= 5) return 'medium';
  if (tier === 2 && comparableCount >= 5) return 'medium';
  if (tier === 3 && comparableCount >= 3) return 'low';
  return null;
}

function evidenceRows(comparables) {
  return [...comparables]
    .sort((a, b) => String(b.contractDate).localeCompare(String(a.contractDate)))
    .slice(0, 10);
}

function resultFromComparables(comparables, quote, config) {
  const validation = validateRentCheckInput(quote);
  if (!validation.ok) throw new TypeError(validation.error);
  const { depositWon, rentWon } = validation.value;
  const comparisonMode = rentWon > 0 ? 'monthly-rent' : 'jeonse-deposit';
  const askingValueWon = comparisonMode === 'monthly-rent' ? rentWon : depositWon;

  if (!config || comparables.length < config.minCount) {
    return {
      rating: 'insufficient',
      comparisonMode,
      differencePct: null,
      askingValueWon,
      medianValueWon: null,
      confidence: null,
      comparableCount: comparables.length,
      monthsUsed: config ? config.months : 12,
      tier: null,
      comparables: []
    };
  }

  const values = comparables.map(item => comparisonMode === 'monthly-rent' ? item.monthlyRentWon : item.depositWon);
  const medianValueWon = median(values);
  if (!Number.isFinite(medianValueWon) || medianValueWon <= 0) {
    return {
      rating: 'insufficient',
      comparisonMode,
      differencePct: null,
      askingValueWon,
      medianValueWon: null,
      confidence: null,
      comparableCount: comparables.length,
      monthsUsed: config.months,
      tier: null,
      comparables: []
    };
  }

  const rawDifference = ((askingValueWon - medianValueWon) / medianValueWon) * 100;
  const differencePct = Math.round(rawDifference * 10) / 10;
  return {
    rating: rateDifference(differencePct),
    comparisonMode,
    differencePct,
    askingValueWon,
    medianValueWon,
    confidence: confidenceFor(config.tier, comparables.length),
    comparableCount: comparables.length,
    monthsUsed: config.months,
    tier: config.tier,
    comparables: evidenceRows(comparables)
  };
}

function buildResultForTier(items, quote, tierConfig) {
  const comparables = comparablesForTier(items, quote, tierConfig);
  return resultFromComparables(comparables, quote, tierConfig);
}

function buildRentCheckResult(items, quote) {
  const validation = validateRentCheckInput(quote);
  if (!validation.ok) throw new TypeError(validation.error);
  const selected = selectComparableTier(items, quote);
  if (!selected.config) {
    return resultFromComparables(selected.comparables, quote, null);
  }
  return resultFromComparables(selected.comparables, quote, selected.config);
}

module.exports = {
  TIERS,
  numberFromManwon,
  validateRentCheckInput,
  median,
  completedMonthKeys,
  normalizeTransaction,
  comparablesForTier,
  selectComparableTier,
  rateDifference,
  confidenceFor,
  buildResultForTier,
  buildRentCheckResult
};
