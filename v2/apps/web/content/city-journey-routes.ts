import type { StoryCity, StoryLocale } from './city-stories';

// Route IDs and short labels only: safe to use in client navigation.
export const STORY_STEPS = [
  { id: 'discover', label: { en: 'Discover', ko: '도시의 매력' }, question: { en: 'What would life here feel like?', ko: '여기서 살면 어떤 일상일까?' } },
  { id: 'why-buy', label: { en: 'Why buy?', ko: '매수할 이유' }, question: { en: 'Does owning fit your plans?', ko: '내 집 마련이 앞으로의 계획에 맞을까?' } },
  { id: 'can-i-buy', label: { en: 'Can I buy?', ko: '자격과 예산' }, question: { en: 'What is possible for you?', ko: '내 조건으로 어떤 집을 살 수 있을까?' } },
  { id: 'where', label: { en: 'Where?', ko: '지역 선택' }, question: { en: 'Which neighbourhood fits?', ko: '어느 동네가 나에게 맞을까?' } },
  { id: 'which-home', label: { en: 'Which home?', ko: '집 선택' }, question: { en: 'What makes a good shortlist?', ko: '어떤 집을 후보로 남길까?' } },
  { id: 'make-it-happen', label: { en: 'Make it happen', ko: '계약과 입주' }, question: { en: 'How do you get to the keys?', ko: '계약부터 입주까지 무엇을 준비할까?' } },
] as const;

export type JourneyStage = typeof STORY_STEPS[number]['id'];
export const JOURNEY_CITIES = ['seoul', 'singapore', 'dubai', 'tokyo'] as const;
export const SEOUL_NEIGHBORHOODS = ['seongsu', 'wangsimni', 'mangwon'] as const;
export const LOCAL_ISSUE_IDS = {
  seoul: 'buy-jeonse-rent', singapore: 'new-launch-premium', tokyo: 'old-condo-costs',
} as const;

export function journeyArticleHref(city: StoryCity, id: string, locale: StoryLocale = 'en'): `/${string}` {
  return `${locale === 'ko' ? '/ko' : ''}/news/city-stories/${city}/${id}/`;
}

export function localIssueHref(city: StoryCity, locale: StoryLocale = 'en'): `/${string}` {
  return city === 'dubai'
    ? `${locale === 'ko' ? '/ko' : ''}/news/dubai-rental-yield-after-costs/`
    : journeyArticleHref(city, LOCAL_ISSUE_IDS[city], locale);
}

export const JOURNEY_ARTICLE_ROUTES = [
  ...JOURNEY_CITIES.flatMap(city => STORY_STEPS.map(step => ({ city, id: step.id }))),
  ...SEOUL_NEIGHBORHOODS.map(id => ({ city: 'seoul' as const, id })),
  ...Object.entries(LOCAL_ISSUE_IDS).map(([city, id]) => ({ city: city as StoryCity, id })),
] as const;
