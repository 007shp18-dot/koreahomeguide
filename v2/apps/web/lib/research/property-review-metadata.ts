import { actualDetailHref } from './property-review-locations';
import { indexableMetadata } from '../public-metadata';
import type { MarketLocale } from '../locale/market-localization';
import seoul from '../../content/property-reviews/seoul.json';
import singapore from '../../content/property-reviews/singapore.json';
import dubai from '../../content/property-reviews/dubai.json';
import tokyo from '../../content/property-reviews/tokyo.json';

const reviews = [...seoul,...singapore,...dubai,...tokyo];
// Existing Seoul/Singapore property URLs are indexed by their market sitemap.
export const propertyReviewPaths = reviews.filter(r => ['ae-dubai','jp-tokyo'].includes(r.marketId)).flatMap(r => (['en','ko'] as const).map(locale => actualDetailHref(locale,r.id)! as `/${string}`));
export function propertyReviewMetadata(locale: MarketLocale, profileId?: string) {
  const p = reviews.find(r=>r.id===profileId);
  const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
  const path = p ? actualDetailHref(locale,p.id)! : `${prefix}/prices/` as `/${string}`;
  const lang = locale === 'ko' ? 'ko' : 'en';
  const metadata = indexableMetadata({
    path,
    title: p ? `${p.name[lang]} · ${lang === 'ko' ? '입지·학교·비용 리뷰' : 'Location, school & cost review'} | SignedPrice` : `${lang === 'ko' ? '단지 리뷰' : 'Property reviews'} | SignedPrice`,
    description: p ? p.verdict[lang] : lang === 'ko' ? '서울·싱가포르·두바이·도쿄 단지의 입지, 교통, 학교와 보유 조건을 비교하세요.' : 'Compare location, transport, schools and ownership conditions across properties in Seoul, Singapore, Dubai and Tokyo.',
    locale: lang === 'ko' ? 'ko_KR' : 'en_US',
    languageAlternates: { en:p ? actualDetailHref('en',p.id)! : '/prices/', ko:p ? actualDetailHref('ko',p.id)! : '/ko/prices/' },
  });
  return locale === 'zh-CN' ? { ...metadata, robots: {index:false,follow:true} } : metadata;
}
