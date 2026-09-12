import { marketHref, type MarketLocale } from '../locale/market-localization';
import { cityPaths } from '../global-shortlist/model';
import { EXPLORE_PATHS, type DiscoveryMarket } from './journal';

type ReadingLink = { href: string; label: string; kind?: string };
// Small route catalog only. Full articles remain outside Explore's client bundle.
const stories = {
  seoul: { slug: 'seochon', en: 'Life among Seochon’s hanok lanes', ko: '서촌의 한옥 골목과 일상' },
  singapore: { slug: 'tiong-bahru', en: 'Daily life in Tiong Bahru', ko: '티옹바루에서 보내는 하루' },
  dubai: { slug: 'al-satwa', en: 'Al Satwa, between two Dubais', ko: '두바이 알 사트와의 골목과 생활' },
  tokyo: { slug: 'yanaka', en: 'Yanaka’s streets and everyday life', ko: '야나카의 골목과 일상' },
} as const;

export function discoveryReading(market: DiscoveryMarket, locale: MarketLocale): ReadingLink[] {
  if (locale === 'zh-CN') return [
    { href: `/zh-cn/news/?market=${market}`, label: '阅读这座城市的资讯', kind: '城市资讯' },
    { href: marketHref(locale, cityPaths[market]), label: '按预算筛选并收藏候选地点', kind: '继续研究' },
  ];
  const ko = locale === 'ko', story = stories[market];
  return [
    { href: marketHref(locale, `/news/neighbourhoods/${story.slug}/`), label: story[ko ? 'ko' : 'en'], kind: ko ? '이 도시의 동네 생활' : 'Life in this city' },
    { href: marketHref(locale, `/news/city-stories/${market}/where/`), label: ko ? '어떤 지역이 내 조건에 맞을까' : 'Find a neighbourhood that fits your plans', kind: ko ? '지역 선택 가이드' : 'Choosing an area' },
  ];
}

export function storyExploreLink(slug: string, market: DiscoveryMarket, locale: 'en' | 'ko'): ReadingLink {
  const ko = locale === 'ko';
  const scoped: Record<string, { market: DiscoveryMarket; query: string; en: string; ko: string }> = {
    seochon: { market: 'seoul', query: 'district=jongno-gu', en: 'Explore recorded prices in Jongno-gu', ko: '종로구 실거래 살펴보기' },
    'yeonhui-dong': { market: 'seoul', query: 'district=seodaemun-gu', en: 'Explore recorded prices in Seodaemun-gu', ko: '서대문구 실거래 살펴보기' },
    'tiong-bahru': { market: 'singapore', query: 'q=Tiong+Bahru', en: 'Find projects matching Tiong Bahru', ko: '티옹바루 이름으로 단지 찾아보기' },
    'joo-chiat-katong': { market: 'singapore', query: 'q=Joo+Chiat', en: 'Find projects matching Joo Chiat', ko: '주치앗 이름으로 단지 찾아보기' },
    'al-satwa': { market: 'dubai', query: 'q=Al+Satwa', en: 'Search released Al Satwa area evidence', ko: '알 사트와 공개 지역 자료 찾아보기' },
    'alserkal-al-quoz': { market: 'dubai', query: 'q=Al+Quoz', en: 'Search released Al Quoz area evidence', ko: '알 쿠오즈 공개 지역 자료 찾아보기' },
    // Current publications use source-language district names and do not always include Yanaka.
    yanaka: { market: 'tokyo', query: 'city=13106', en: 'Explore disclosed prices in Taito ward', ko: '다이토구 공개 실거래 살펴보기' },
  };
  const match = scoped[slug];
  if (match?.market === market) return { href: marketHref(locale, `${EXPLORE_PATHS[market]}?${match.query}`), label: match[ko ? 'ko' : 'en'] };
  // Kichijoji is beyond the existing 23-ward publication scope.
  return { href: marketHref(locale, EXPLORE_PATHS[market]), label: market === 'tokyo'
    ? (ko ? '도쿄 23구의 공개 실거래 살펴보기' : 'Explore disclosed prices in Tokyo’s 23 wards')
    : (ko ? '이 도시의 공개 실거래 살펴보기' : 'Explore this city’s recorded prices') };
}
