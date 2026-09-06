export type ResearchTransaction = Readonly<{ month: string; price: number; area: number; group: string }>;
export type ResearchMonth = Readonly<{ month: string; count: number; median: number | null }>;
export type ResearchSize = Readonly<{ group: string; size: string; count: number; median: number | null }>;

function publishedMedian(values: readonly number[]): number | null {
  if (values.length < 5) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function eligible(row: ResearchTransaction): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(row.month) && Number.isFinite(row.price)
    && row.price > 0 && Number.isFinite(row.area) && row.area > 0;
}

/** Only call with the full released cohort, never a capped recent-transactions list. */
export function buildMonthlyResearch(rows: readonly ResearchTransaction[], from: string, to: string): readonly ResearchMonth[] {
  if (![from, to].every((month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) || from > to) return [];
  const values = new Map<string, number[]>();
  for (const row of rows.filter(eligible)) {
    const group = values.get(row.month) ?? [];
    group.push(row.price);
    values.set(row.month, group);
  }
  const months: ResearchMonth[] = [];
  const cursor = new Date(`${from}-01T00:00:00Z`);
  for (let i = 0; i < 120; i++) {
    const month = cursor.toISOString().slice(0, 7);
    if (month > to) break;
    const prices = values.get(month) ?? [];
    months.push({ month, count: prices.length, median: publishedMedian(prices) });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export function summarizeSizeCohorts(rows: readonly ResearchTransaction[]): readonly ResearchSize[] {
  const groups = new Map<string, { group: string; size: string; prices: number[] }>();
  for (const row of rows.filter(eligible)) {
    const size = row.area < 60 ? 'Under 60 m²' : row.area < 85 ? '60–85 m²' : row.area < 135 ? '85–135 m²' : '135 m² and over';
    const key = JSON.stringify([row.group, size]);
    const cohort = groups.get(key) ?? { group: row.group, size, prices: [] };
    cohort.prices.push(row.price);
    groups.set(key, cohort);
  }
  return [...groups.values()].map(({ group, size, prices }) => ({ group, size, count: prices.length, median: publishedMedian(prices) }));
}

export type PropertyScenario = Readonly<{
  price: number; acquisitionCosts: number; monthlyRent: number; annualCosts: number; vacancyMonths: number;
}>;

export function calculatePropertyScenario(input: PropertyScenario) {
  if (Object.values(input).some((value) => !Number.isFinite(value) || value < 0)
    || input.price <= 0 || input.vacancyMonths > 12) return null;
  const totalCost = input.price + input.acquisitionCosts;
  const annualRent = input.monthlyRent * (12 - input.vacancyMonths);
  const netIncome = annualRent - input.annualCosts;
  return { totalCost, annualRent, netIncome, grossYield: annualRent / input.price * 100, netYield: netIncome / totalCost * 100 };
}
