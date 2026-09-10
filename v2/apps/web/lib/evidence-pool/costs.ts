import { readiness, safeUrl, type Evidence } from './contract';
import type { PropertyScenarioContext } from '../tools/property-scenario-context';

export type ScenarioCostOption = Readonly<{
  id: string; metric: 'service_charge' | 'repair_cost'; basis: Evidence['basis'];
  annualAmount: number; currency: Evidence['currency']; building: string; area: string;
  conditions: string; observedOn: string; observedLabel: string; expiresOn: string; sourceName: string; url: string;
  originalAmount: number; originalUnit: Evidence['unit']; billingPeriod?: Evidence['billingPeriod'];
}>;
const marketNames = { 'kr-seoul': 'seoul', 'sg-singapore': 'singapore', 'ae-dubai': 'dubai', 'jp-tokyo': 'tokyo' } as const;
const normalized = (value: string | null | undefined) => value?.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en') ?? '';

// A candidate is never an automatic cost assignment: location and free-text
// conditions still need the user's confirmation. No fuzzy building-name joins.
export function scenarioCostOptions(rows: readonly Evidence[], context: PropertyScenarioContext, today: string): ScenarioCostOption[] {
  if (!context.propertyName || !context.housing) return [];
  return rows.flatMap(row => {
    if (!readiness(row, today).ready || !safeUrl(row.url)
      || row.market !== marketNames[context.market] || row.currency !== context.currency
      || !['service_charge', 'repair_cost'].includes(row.metric)
      || row.basis === 'asking' || row.basis === 'reported'
      || normalized(row.building) !== normalized(context.propertyName)
      || !row.housingType || normalized(row.housingType) !== normalized(context.housing)) return [];
    // A whole-home quoted cost for another size cannot become this home's cost.
    if (row.unit !== 'sqm' && (row.sizeSqm === null || context.areaSqm === null || Math.abs(row.sizeSqm - context.areaSqm) > 0.01)) return [];
    const period = row.unit === 'monthly' || row.unit === 'annual' ? row.unit : row.billingPeriod;
    if (period !== 'monthly' && period !== 'annual') return []; // Never annualise a one-off repair.
    if ((row.unit === 'monthly' || row.unit === 'annual') && row.billingPeriod && row.billingPeriod !== row.unit) return [];
    const size = row.unit === 'sqm' ? context.areaSqm : 1;
    if (size === null || !Number.isFinite(size) || size <= 0) return [];
    const annualAmount = row.amount * size * (period === 'monthly' ? 12 : 1);
    if (!Number.isFinite(annualAmount) || annualAmount <= 0 || annualAmount > Number.MAX_SAFE_INTEGER) return [];
    return [{id: row.id, metric: row.metric as ScenarioCostOption['metric'], basis: row.basis,
      annualAmount, currency: row.currency, building: row.building, area: row.area,
      conditions: row.conditions!, observedOn: row.observedOn, observedLabel: row.observedPrecision === 'month' ? row.observedPeriod! : row.observedOn, expiresOn: row.expiresOn,
      sourceName: row.sourceName, url: row.url, originalAmount: row.amount,
      originalUnit: row.unit, billingPeriod: row.billingPeriod}];
  });
}
