export const GUIDE_ACTIONS = ['budget_select', 'evidence_open', 'cost_profile_change', 'explore_open', 'check_open', 'report_open'] as const;
export type GuideAction = typeof GUIDE_ACTIONS[number];

export const GUIDE_JOURNEYS = {
  'seoul-apartment-buying-budget-guide': { market: 'kr-seoul', city: 'Seoul', explore: '/kr/seoul/explore/', check: '/kr/seoul/check/', report: '/news/seoul-monthly-2026-09/' },
  'singapore-condo-buying-budget-guide': { market: 'sg-singapore', city: 'Singapore', explore: '/sg/singapore/explore/', check: '/sg/singapore/check/', report: '/news/singapore-monthly-2026-09/' },
  'dubai-ready-apartment-buying-budget-guide': { market: 'ae-dubai', city: 'Dubai', explore: '/ae/dubai/explore/', check: '/ae/dubai/check/', report: '/news/dubai-monthly-2026-09/' },
} as const;

export function guideJourney(slug: string) {
  return Object.hasOwn(GUIDE_JOURNEYS, slug) ? GUIDE_JOURNEYS[slug as keyof typeof GUIDE_JOURNEYS] : undefined;
}

export function createBuyingGuideEvent(slug: string, action: GuideAction) {
  const journey = guideJourney(slug);
  if (!journey || !GUIDE_ACTIONS.includes(action)) throw new TypeError('Invalid buying guide event');
  return { event: 'buying_guide_action', guide: slug, market: journey.market, action } as const;
}
