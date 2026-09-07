import { describe, expect, it } from 'vitest';
import { selectedResultPage } from '../lib/navigation/selected-result-page';
import { aggregateDubaiProjects } from '../scripts/build-dubai-project-evidence.mjs';

const period = { from: '2026-06-08', to: '2026-09-05' };
const areas = [{ name: 'Business Bay', slug: 'business-bay' }];
const land = { AREA_EN: 'Business Bay', PROJECT_EN: 'Tower One', PROJECT_NUMBER: '123' };
function sale(index: number, override = {}) {
  return { TRANSACTION_NUMBER: String(index), INSTANCE_DATE: '2026-08-01', GROUP_EN: 'Sales',
    PROCEDURE_EN: 'Sale', IS_OFFPLAN_EN: 'Off-Plan', USAGE_EN: 'Residential',
    AREA_EN: 'Business Bay', PROJECT_EN: 'Tower One', PROP_TYPE_EN: 'Unit', PROP_SB_TYPE_EN: 'Flat',
    TRANS_VALUE: '1500000', ACTUAL_AREA: '75', ...override };
}
describe('Explore selection visibility', () => {
  const ids = Array.from({ length: 60 }, (_, index) => `result-${index}`);
  it('opens the page containing a deep-linked or map-selected result', () => {
    expect(selectedResultPage(ids, 'result-49', 1, 24)).toBe(3);
    expect(selectedResultPage([...ids].reverse(), 'result-49', 3, 24)).toBe(1);
  });
  it('honors pagination after clearing selection and clamps missing results', () => {
    expect(selectedResultPage(ids, null, 2, 24)).toBe(2);
    expect(selectedResultPage(ids, 'removed', 99, 24)).toBe(3);
    expect(selectedResultPage([], null, 2, 24)).toBe(1);
  });
});
describe('Dubai project aggregate identity and publication', () => {
  const sales = Array.from({ length: 30 }, (_, i) => sale(i));
  it('publishes exact project/area/number matches with per-sale unit prices', () => {
    expect(aggregateDubaiProjects(sales, [land], areas, period)).toEqual([{
      id: '123-apartment-off-plan', projectNumber: '123', areaSlug: 'business-bay', name: 'Tower One',
      housing: 'apartment', stage: 'off-plan', n: 30, medianPriceAed: 1500000, medianPricePerSqmAed: 20000,
    }]);
  });
  it('suppresses small samples and never mixes Ready and Off-Plan to reach the minimum', () => {
    expect(aggregateDubaiProjects(sales.slice(1), [land], areas, period)).toEqual([]);
    expect(aggregateDubaiProjects([...sales.slice(1), sale(30, { IS_OFFPLAN_EN: 'Ready' })], [land], areas, period)).toEqual([]);
  });
  it('rejects ambiguous names, numbers spanning locations, and unrecognized areas', () => {
    expect(aggregateDubaiProjects(sales, [land, { ...land, PROJECT_NUMBER: '456' }], areas, period)).toEqual([]);
    expect(aggregateDubaiProjects(sales, [land, { ...land, AREA_EN: 'Other area' }], areas, period)).toEqual([]);
    expect(aggregateDubaiProjects(sales, [land], [], period)).toEqual([]);
  });
  it('does not inflate counts with duplicate rows or multi-property registrations', () => {
    expect(aggregateDubaiProjects([...sales, sales[0]], [land], areas, period)[0]?.n).toBe(30);
    expect(aggregateDubaiProjects([...sales, sale(0, { ACTUAL_AREA: '80' })], [land], areas, period)).toEqual([]);
  });
  it('excludes invalid prices, dates, and non-sale procedures', () => {
    for (const override of [{ TRANS_VALUE: 'NaN' }, { INSTANCE_DATE: '2026-06-07' }, { PROCEDURE_EN: 'Mortgage' }]) {
      expect(aggregateDubaiProjects([...sales.slice(1), sale(31, override)], [land], areas, period)).toEqual([]);
    }
  });
});
