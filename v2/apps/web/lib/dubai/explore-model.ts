import type { DubaiSaleStage } from './evidence-contract';
import type { DubaiExploreArea } from './route-types';

export type DubaiExploreState = Readonly<{
  query: string;
  housing: 'apartment' | 'villa';
  stage: DubaiSaleStage;
  budgetMaximumAed: number | null;
  yieldMinimumPct: number | null;
  page: number;
  selectedArea: string | null;
  selectedProject?: string | null;
}>;

export type DubaiExploreFilterState = Pick<
  DubaiExploreState,
  'query' | 'housing' | 'stage' | 'budgetMaximumAed' | 'yieldMinimumPct'
>;

export type DubaiExploreResult = Readonly<{
  area: DubaiExploreArea;
  segment: DubaiExploreArea['segments'][number];
  sale: NonNullable<DubaiExploreArea['segments'][number]['sales']['ready']>;
}>;

export const DUBAI_EXPLORE_PAGE_SIZE = 24 as const;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const INTEGER = /^[1-9]\d*$/u;
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u;

export function parseDubaiExploreState(
  query: Readonly<Record<string, string | string[] | undefined>>,
): DubaiExploreState {
  const invalidArray = Object.values(query).some(Array.isArray);
  if (invalidArray) return Object.freeze({
    query: '', housing: 'apartment', stage: 'ready', budgetMaximumAed: null,
    yieldMinimumPct: null, page: 1, selectedArea: null,
  });
  const housing = query.housing === 'villa' ? 'villa' : 'apartment';
  const stage = query.stage === 'off-plan' ? 'off-plan' : 'ready';
  const budget = typeof query.budgetMax === 'string' && INTEGER.test(query.budgetMax)
    ? Number(query.budgetMax)
    : null;
  const minimumRatio = typeof query.yieldMin === 'string' && DECIMAL.test(query.yieldMin)
    ? Number(query.yieldMin)
    : null;
  const page = typeof query.page === 'string' && INTEGER.test(query.page)
    ? Math.min(Number(query.page), 10_000)
    : 1;
  const selectedArea = typeof query.area === 'string' && SLUG.test(query.area)
    ? query.area
    : null;
  return Object.freeze({
    query: typeof query.q === 'string' ? query.q.trim().slice(0, 100) : '',
    housing,
    stage,
    budgetMaximumAed: budget !== null && budget >= 1 && budget <= 500_000_000
      ? budget
      : null,
    yieldMinimumPct: stage === 'ready' && minimumRatio !== null
      && minimumRatio >= 0 && minimumRatio <= 100 ? minimumRatio : null,
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
    selectedArea,
    selectedProject: typeof query.project === 'string' && /^\d+-(?:apartment|villa)-(?:ready|off-plan)$/.test(query.project) ? query.project : null,
  });
}

function normalized(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en');
}

export function filterDubaiExploreResults(
  areas: readonly DubaiExploreArea[],
  state: DubaiExploreFilterState,
): readonly DubaiExploreResult[] {
  const term = normalized(state.query);
  return Object.freeze(areas.flatMap((area) => {
    const segment = area.segments.find(({ housing }) => housing === state.housing);
    const sale = segment?.sales[state.stage === 'off-plan' ? 'offPlan' : 'ready'] ?? null;
    if (segment === undefined || sale === null) return [];
    const searchText = normalized([area.name, ...area.searchAliases].join(' '));
    if (term !== '' && !searchText.includes(term)) return [];
    if (state.budgetMaximumAed !== null && sale.medianPriceAed > state.budgetMaximumAed) return [];
    if (state.stage === 'ready' && state.yieldMinimumPct !== null
      && (segment.readyGrossYieldPct === null
        || segment.readyGrossYieldPct < state.yieldMinimumPct)) return [];
    return [Object.freeze({ area, segment, sale })];
  }).sort((left, right) => (
    right.sale.n - left.sale.n || left.area.name.localeCompare(right.area.name, 'en')
  )));
}

export function buildDubaiExploreHref(state: DubaiExploreState): string {
  const query = new URLSearchParams();
  const term = state.query.trim();
  if (term !== '') query.set('q', term);
  if (state.housing !== 'apartment') query.set('housing', state.housing);
  if (state.stage !== 'ready') query.set('stage', state.stage);
  if (state.budgetMaximumAed !== null) query.set('budgetMax', String(state.budgetMaximumAed));
  if (state.stage === 'ready' && state.yieldMinimumPct !== null) {
    query.set('yieldMin', String(state.yieldMinimumPct));
  }
  if (state.page > 1) query.set('page', String(state.page));
  if (state.selectedArea !== null) query.set('area', state.selectedArea);
  if (state.selectedArea !== null && state.selectedProject) query.set('project', state.selectedProject);
  const serialized = query.toString();
  return `/ae/dubai/explore/${serialized === '' ? '' : `?${serialized}`}`;
}
