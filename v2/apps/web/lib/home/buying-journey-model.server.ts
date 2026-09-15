import 'server-only';
import { BUYING_GUIDE_DATA } from '../../content/en/buying-guide-data';
import { KOREAN_BUYING_GUIDE_DATA } from '../../content/ko/buying-guides';
import { BUDGET_GUIDE_SERIES } from '../../content/budget-guide-series';
import { TOKYO_BUDGET_EXAMPLES } from '../../content/tokyo-buying-guide';
import { getPortfolioRecord } from '../../content/portfolio-manifest';
import type { SiteLocale } from '../navigation/site-navigation';
import type { BuyingCityModel } from './buying-journey';

const names = {
  en: ['Seoul', 'Singapore', 'Dubai', 'Tokyo'],
  ko: ['서울', '싱가포르', '두바이', '도쿄'],
  'zh-CN': ['首尔', '新加坡', '迪拜', '东京'],
} as const;
const bases = ['/kr/seoul', '/sg/singapore', '/ae/dubai', '/jp/tokyo'] as const;
const markets = ['kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo'] as const;

function chineseDetail(detail: string): string {
  return detail.replace(/^Built (\d+)$/, '$1年建成')
    .replace(/^99 yrs lease commencing from (\d+)$/, '$1年起 · 99年租赁权')
    .replace('1 B/R', '1间卧室').replace('2 B/R', '2间卧室')
    .replace('Studio', '单间').replace('Free Hold (source)', '永久产权 · 原资料');
}

/** Project reviewed editorial data into a small public payload, never raw snapshots. */
export function createBuyingJourney(locale: SiteLocale): readonly BuyingCityModel[] {
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  const guides = locale === 'ko' ? KOREAN_BUYING_GUIDE_DATA : BUYING_GUIDE_DATA;
  return BUDGET_GUIDE_SERIES.map((series, index) => {
    const article = getPortfolioRecord(locale, series.slug) ?? getPortfolioRecord('en', series.slug)!;
    const guide = guides.find(guide => guide.slug === series.slug);
    const tokyo = series.city === 'tokyo';
    const currency = guide?.currency ?? 'JPY';
    return {
      city: series.city, market: markets[index]!, name: names[locale][index]!, currency, slug: series.slug,
      scope: tokyo ? 'neighbourhood' : 'project', period: series.period[locale],
      guideHref: article.canonicalHref, guideLocale: article.locale,
      exploreHref: `${prefix}${bases[index]}/explore/`,
      checkHref: `${prefix}${bases[index]}/${tokyo ? 'tools' : 'check'}/`,
      costsHref: `${prefix}/tools/property-scenario/?market=${markets[index]}&currency=${currency}`,
      bands: guide ? guide.bands.map(band => ({ cap: band.cap, examples: band.examples.map(example => ({
        name: example.name.trim(), region: example.region, detail: locale === 'zh-CN' ? chineseDetail(example.detail) : example.detail,
        price: example.price, area: example.area, count: example.n, latest: example.latest,
      })) })) : TOKYO_BUDGET_EXAMPLES.map(example => ({ cap: example.cap, examples: [{
        name: example.names[locale], region: locale === 'ko' ? '지요다구' : locale === 'zh-CN' ? '千代田区' : 'Chiyoda',
        detail: `${example.layout} · ${example.built}`, price: [example.cap, example.cap], area: [example.area, example.area], count: 1, latest: '2026 Q1',
      }] })),
    };
  });
}
