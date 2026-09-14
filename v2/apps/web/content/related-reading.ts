import { languageDestinations } from '../lib/navigation/site-navigation';
import type { EditorialPortfolioRecord } from './portfolio-types';
import type { PublishedContentArticle } from '../lib/content/content-types';

type ReadingLink = Readonly<{ label: string; href: string }>;

const readingGroups: readonly Readonly<{
  slugs: readonly string[];
  links: readonly ReadingLink[];
}>[] = [
  {
    slugs: ['rent-in-korea-zh', 'wolse-vs-jeonse-zh', 'rent-an-apartment-in-korea', 'wolse-vs-jeonse', 'korea-rental-contract-checklist', 'seoul-jeonse-market-monthly-brief', 'seoul-monthly-rent-market-brief', 'seoul-new-renewal-rent-gap', 'korea-deposit-monthly-rent-cost-structure', 'korea-rental-deposit-protection-status', 'seoul-district-price-distribution'],
    links: [
      { label: 'Choose between wolse and jeonse', href: '/guides/wolse-vs-jeonse/' },
      { label: 'Work through a rental-cost example', href: '/news/korea-deposit-monthly-rent-cost-structure/' },
      { label: 'Check the rental contract before paying', href: '/guides/korea-rental-contract-checklist/' },
    ],
  },
  {
    slugs: ['singapore-condos-under-1-5-million-2026', 'singapore-condo-buying-budget-guide'],
    links: [
      { label: 'Compare condos below S$1.5 million', href: '/news/singapore-condos-under-1-5-million-2026/' },
      { label: 'Build a Singapore condo budget', href: '/guides/singapore-condo-buying-budget-guide/' },
      { label: 'Read comparable project transactions', href: '/guides/read-singapore-private-transactions/' },
    ],
  },
  {
    slugs: ['seoul-59sqm-under-700-million-2026', 'seoul-84sqm-under-one-billion-2026', 'seoul-apartment-buying-budget-guide'],
    links: [
      { label: 'Explore Seoul 59 sqm sales below KRW 700 million', href: '/news/seoul-59sqm-under-700-million-2026/' },
      { label: 'Explore Seoul 84 sqm sales below KRW 1 billion', href: '/news/seoul-84sqm-under-one-billion-2026/' },
      { label: 'Build a Seoul apartment budget', href: '/guides/seoul-apartment-buying-budget-guide/' },
    ],
  },
];

export function relatedReading(article: Pick<PublishedContentArticle, 'slug' | 'marketId' | 'locale'>): readonly ReadingLink[] {
  // Resolve translated destinations against the published portfolio at rendering.
  const links = readingGroups.find(group => group.slugs.includes(article.slug))?.links
    ?? (article.marketId === 'ae-dubai' ? [
      { label: 'Build a Dubai ready-apartment budget', href: '/guides/dubai-ready-apartment-buying-budget-guide/' },
      { label: 'Calculate rental yield after costs', href: '/news/dubai-rental-yield-after-costs/' },
      { label: 'Follow the Dubai purchase steps', href: '/ae/dubai/guide/' },
    ] : article.marketId === 'jp-tokyo' ? [
      { label: article.locale === 'ko' ? '도쿄 실거래가 탐색하기' : article.locale === 'zh-CN' ? '查看东京成交记录' : 'Explore Tokyo transactions', href: '/jp/tokyo/explore/' },
      { label: article.locale === 'ko' ? '도쿄 시장 한눈에 보기' : article.locale === 'zh-CN' ? '东京市场概览' : 'Tokyo market overview', href: '/jp/tokyo/' },
    ] : article.marketId === 'sg-singapore' ? [
      { label: 'Read Singapore project transactions', href: '/guides/read-singapore-private-transactions/' },
      { label: 'Compare CCR, RCR and OCR project prices', href: '/news/singapore-ccr-rcr-ocr-comparison/' },
      { label: 'Read the official quarterly index brief', href: '/news/singapore-private-market-quarterly-brief/' },
    ] : [
      { label: 'Build a Seoul apartment budget', href: '/guides/seoul-apartment-buying-budget-guide/' },
      { label: 'Compare Seoul sale transactions', href: '/guides/read-seoul-sale-transactions/' },
      { label: 'Read the district price comparison', href: '/news/seoul-district-price-distribution/' },
    ]);
  return links.filter(({ href }) => !href.endsWith(`/${article.slug}/`)).slice(0, 2);
}

/** Prefer an existing translation; never invent a translated editorial slug. */
export function localizeReadingLink(
  item: ReadingLink,
  locale: PublishedContentArticle['locale'],
  records: readonly EditorialPortfolioRecord[],
): ReadingLink {
  const url = new URL(item.href, 'https://www.signedprice.com');
  if (url.origin !== 'https://www.signedprice.com') return item;
  const record = records.find(record => record.canonicalHref.replace(/\/$/, '') === url.pathname.replace(/\/$/, ''));
  if (record) {
    const translated = records.find(candidate => candidate.locale === locale && (
      candidate.id === record.id
      || (record.translationGroupId !== null && candidate.translationGroupId === record.translationGroupId)
      || (candidate.slug === record.slug && candidate.type === record.type)
    ));
    if (translated) return { href: `${translated.canonicalHref}${url.search}${url.hash}`, label: translated.title };
    const language = record.locale === 'en' ? (locale === 'ko' ? ' (영문)' : locale === 'zh-CN' ? '（英文）' : '') : '';
    return { href: item.href, label: `${item.label}${language}` };
  }
  const destination = languageDestinations(url.pathname, url.search)[locale];
  return { href: destination ? `${destination}${url.hash}` : item.href, label: item.label };
}
