import type { PublishedContentArticle } from '../lib/content/content-types';

type ReadingLink = Readonly<{ label: string; href: string }>;

const readingGroups: readonly Readonly<{
  slugs: readonly string[];
  links: readonly ReadingLink[];
}>[] = [
  {
    slugs: ['rent-an-apartment-in-korea', 'wolse-vs-jeonse', 'korea-rental-contract-checklist', 'seoul-jeonse-market-monthly-brief', 'seoul-monthly-rent-market-brief', 'seoul-new-renewal-rent-gap', 'korea-deposit-monthly-rent-cost-structure', 'korea-rental-deposit-protection-status', 'seoul-district-price-distribution'],
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
    slugs: ['seoul-84sqm-under-one-billion-2026', 'seoul-apartment-buying-budget-guide'],
    links: [
      { label: 'Explore Seoul 84 sqm sales below KRW 1 billion', href: '/news/seoul-84sqm-under-one-billion-2026/' },
      { label: 'Build a Seoul apartment budget', href: '/guides/seoul-apartment-buying-budget-guide/' },
      { label: 'Check the foreign-buyer purchase sequence', href: '/guides/buy-property-in-korea-as-foreigner/' },
    ],
  },
];

export function relatedReading(article: Pick<PublishedContentArticle, 'slug' | 'marketId' | 'locale'>): readonly ReadingLink[] {
  // Keep the existing English destinations for translated articles.
  const links = readingGroups.find(group => group.slugs.includes(article.slug))?.links
    ?? (article.marketId === 'ae-dubai' ? [
      { label: 'Build a Dubai ready-apartment budget', href: '/guides/dubai-ready-apartment-buying-budget-guide/' },
      { label: 'Calculate rental yield after costs', href: '/news/dubai-rental-yield-after-costs/' },
      { label: 'Follow the Dubai purchase steps', href: '/ae/dubai/guide/' },
    ] : article.marketId === 'sg-singapore' ? [
      { label: 'Read Singapore project transactions', href: '/guides/read-singapore-private-transactions/' },
      { label: 'Compare CCR, RCR and OCR project prices', href: '/news/singapore-ccr-rcr-ocr-comparison/' },
      { label: 'Read the official quarterly index brief', href: '/news/singapore-private-market-quarterly-brief/' },
    ] : [
      { label: 'Build a Seoul apartment budget', href: '/guides/seoul-apartment-buying-budget-guide/' },
      { label: 'Compare Seoul sale transactions', href: '/guides/read-seoul-sale-transactions/' },
      { label: 'Compare districts on the same basis', href: '/guides/compare-seoul-district-prices/' },
    ]);
  return links.filter(({ href }) => !href.endsWith(`/${article.slug}/`)).slice(0, 2);
}
