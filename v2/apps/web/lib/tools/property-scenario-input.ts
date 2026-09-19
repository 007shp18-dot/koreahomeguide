import { calculatePropertyScenario, type PropertyScenario } from '../research/property-research';

export type ScenarioDraft = Record<keyof PropertyScenario, string>;
export type ScenarioInputError = 'positive' | 'nonnegative' | 'vacancy';

/** Missing assumptions stay missing; purchase outlay does not depend on rental inputs. */
export function evaluateScenarioDraft(draft: ScenarioDraft) {
  const errors: Partial<Record<keyof PropertyScenario, ScenarioInputError>> = {};
  const missing: (keyof PropertyScenario)[] = [];
  for (const key of Object.keys(draft) as (keyof PropertyScenario)[]) {
    if (!draft[key].trim()) { missing.push(key); continue; }
    const value = Number(draft[key]);
    if (!Number.isFinite(value) || value < 0 || (key === 'price' && value === 0)) {
      errors[key] = key === 'price' ? 'positive' : 'nonnegative';
    } else if (key === 'vacancyMonths' && value > 12) errors[key] = 'vacancy';
  }
  const total = Number(draft.price) + Number(draft.acquisitionCosts);
  const totalCost = !missing.includes('price') && !missing.includes('acquisitionCosts')
    && !errors.price && !errors.acquisitionCosts && Number.isFinite(total) ? total : null;
  const scenario = missing.length === 0 && Object.keys(errors).length === 0
    ? calculatePropertyScenario({ price: Number(draft.price), acquisitionCosts: Number(draft.acquisitionCosts), monthlyRent: Number(draft.monthlyRent), annualCosts: Number(draft.annualCosts), vacancyMonths: Number(draft.vacancyMonths) })
    : null;
  return { totalCost, scenario, errors, missing };
}
