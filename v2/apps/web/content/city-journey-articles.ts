import type { StoryCity, StoryLink, StoryLocale, StoryText } from './city-stories';
import { JOURNEY_ARTICLE_ROUTES, STORY_STEPS, journeyArticleHref, localIssueHref } from './city-journey-routes';
import articles from './city-journey-articles.json';

export type JourneySource = Readonly<{ id: string; title: string; href: string }>;
export type JourneyTable = Readonly<{
  title: StoryText;
  columns: Readonly<{ en: readonly string[]; ko: readonly string[] }>;
  rows: Readonly<{ en: readonly (readonly string[])[]; ko: readonly (readonly string[])[] }>;
  note: StoryText;
}>;
export type JourneyArticle = Readonly<{
  city: StoryCity;
  id: string;
  kind: 'journey' | 'neighborhood' | 'local-issue';
  title: StoryText;
  deck: StoryText;
  checkedAt: string;
  sections: readonly Readonly<{
    id: string; title: StoryText; paragraphs: Readonly<{ en: readonly string[]; ko: readonly string[] }>;
    sourceIds: readonly string[]; table?: JourneyTable;
  }>[];
  sources: readonly JourneySource[];
}>;

export const CITY_JOURNEY_ARTICLES: readonly JourneyArticle[] = articles as readonly JourneyArticle[];

export function getJourneyArticle(city: string, id: string): JourneyArticle | undefined {
  return CITY_JOURNEY_ARTICLES.find(article => article.city === city && article.id === id);
}

export function journeyArticleParams() {
  return JOURNEY_ARTICLE_ROUTES.map(({ city, id }) => ({ city, step: id }));
}

const cityExplore = { seoul: '/kr/seoul/explore/', singapore: '/sg/singapore/explore/', dubai: '/ae/dubai/explore/', tokyo: '/jp/tokyo/explore/' } as const;
const text = (en: string, ko: string): StoryText => ({ en, ko });

export function journeyArticleActions(article: JourneyArticle, locale: StoryLocale): Readonly<{ primary: StoryLink; related: readonly StoryLink[] }> {
  const index = STORY_STEPS.findIndex(step => step.id === article.id);
  const articleLink = (id: string): StoryLink => ({
    href: journeyArticleHref(article.city, id, locale),
    label: getJourneyArticle(article.city, id)!.title,
  });
  const prefix = locale === 'ko' && article.city !== 'tokyo' ? '/ko' : '';
  const explore: StoryLink = { href: `${prefix}${cityExplore[article.city]}`, label: text('Explore this city', '이 도시의 지역 살펴보기') };
  if (article.kind === 'local-issue') return { primary: articleLink('which-home'), related: [articleLink('can-i-buy'), articleLink('make-it-happen')] };
  if (article.kind === 'neighborhood') return { primary: explore, related: [articleLink('where'), articleLink('which-home')] };
  const next = STORY_STEPS[index + 1];
  const primary = next ? articleLink(next.id) : explore;
  if (article.id === 'discover') return { primary, related: [articleLink('can-i-buy'), articleLink('where')] };
  if (article.id === 'where') return { primary, related: [articleLink('can-i-buy'), explore] };
  if (article.id === 'can-i-buy') return { primary, related: [articleLink('make-it-happen'), { href: `${locale === 'ko' ? '/ko' : ''}/tools/property-scenario/`, label: text('Build a purchase-cost scenario', '매입·보유 비용 계산하기') }] };
  return { primary, related: [articleLink(article.id === 'make-it-happen' ? 'can-i-buy' : 'where'), { href: localIssueHref(article.city, locale), label: text('Read the local issue analysis', '현지 이슈 분석 읽기') }] };
}
