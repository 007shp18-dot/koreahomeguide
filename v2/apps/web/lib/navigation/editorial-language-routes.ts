import type { SiteLocale } from './site-navigation';
import { BILINGUAL_DATABASE_SLUGS } from '../../content/editorial-edition-slugs';
import { JOURNEY_ARTICLE_ROUTES, journeyArticleHref } from '../../content/city-journey-routes';
export type EditorialLanguageRoutes = Record<string, Partial<Record<SiteLocale, string>>>;
// Published translation groups only. Keep article bodies out of client navigation bundles.
const routes: EditorialLanguageRoutes = {
  "/news/policy/korea-rental-deposit-protection-status/": {
    "en": "/news/policy/korea-rental-deposit-protection-status/",
    "zh-CN": "/zh-cn/news/policy/kr-rental-deposit-protection-zh/"
  },
  "/news/policy/singapore-absd-policy-status/": {
    "en": "/news/policy/singapore-absd-policy-status/",
    "zh-CN": "/zh-cn/news/policy/sg-absd-policy-zh/"
  },
  "/news/seoul-district-price-distribution/": {
    "en": "/news/seoul-district-price-distribution/",
    "zh-CN": "/zh-cn/news/seoul-district-price-distribution-zh/"
  },
  "/news/singapore-ccr-rcr-ocr-comparison/": {
    "en": "/news/singapore-ccr-rcr-ocr-comparison/",
    "zh-CN": "/zh-cn/news/singapore-region-comparison-zh/"
  },
  "/guides/rent-an-apartment-in-korea/": {
    "en": "/guides/rent-an-apartment-in-korea/",
    "zh-CN": "/zh-cn/guides/rent-in-korea-zh/"
  },
  "/guides/wolse-vs-jeonse/": {
    "en": "/guides/wolse-vs-jeonse/",
    "zh-CN": "/zh-cn/guides/wolse-vs-jeonse-zh/"
  },
  "/guides/buy-property-in-korea-as-foreigner/": {
    "en": "/guides/buy-property-in-korea-as-foreigner/",
    "zh-CN": "/zh-cn/guides/buy-property-in-korea-zh/"
  },
  "/zh-cn/news/policy/kr-rental-deposit-protection-zh/": {
    "en": "/news/policy/korea-rental-deposit-protection-status/",
    "zh-CN": "/zh-cn/news/policy/kr-rental-deposit-protection-zh/"
  },
  "/zh-cn/news/policy/sg-absd-policy-zh/": {
    "en": "/news/policy/singapore-absd-policy-status/",
    "zh-CN": "/zh-cn/news/policy/sg-absd-policy-zh/"
  },
  "/zh-cn/news/seoul-district-price-distribution-zh/": {
    "en": "/news/seoul-district-price-distribution/",
    "zh-CN": "/zh-cn/news/seoul-district-price-distribution-zh/"
  },
  "/zh-cn/news/singapore-region-comparison-zh/": {
    "en": "/news/singapore-ccr-rcr-ocr-comparison/",
    "zh-CN": "/zh-cn/news/singapore-region-comparison-zh/"
  },
  "/zh-cn/guides/rent-in-korea-zh/": {
    "en": "/guides/rent-an-apartment-in-korea/",
    "zh-CN": "/zh-cn/guides/rent-in-korea-zh/"
  },
  "/zh-cn/guides/wolse-vs-jeonse-zh/": {
    "en": "/guides/wolse-vs-jeonse/",
    "zh-CN": "/zh-cn/guides/wolse-vs-jeonse-zh/"
  },
  "/zh-cn/guides/buy-property-in-korea-zh/": {
    "en": "/guides/buy-property-in-korea-as-foreigner/",
    "zh-CN": "/zh-cn/guides/buy-property-in-korea-zh/"
  }
};
// Canonical English/Korean pairs, without importing article bodies into the client.
const koreanPairs = [
  ['/news/dubai-buy-now-or-too-late/', '/ko/news/dubai-buy-now-or-too-late/'],
  ['/news/singapore-small-condo-first-upgrade-trap/', '/ko/news/singapore-small-condo-first-upgrade-trap/'],
  ['/guides/seoul-59-to-84-upgrade-budget/', '/ko/guides/seoul-59-to-84-upgrade-budget/'],
  ['/guides/dubai-two-million-total-purchase-budget/', '/ko/guides/dubai-two-million-total-purchase-budget/'],
  ['/news/dubai-without-a-car-metro-last-mile/', '/ko/news/dubai-without-a-car-metro-last-mile/'],
  ['/news/singapore-everton-park-blair-plain-afternoon/', '/ko/news/singapore-everton-park-blair-plain-afternoon/'],
  ['/news/seoul-same-complex-price-gap/', '/ko/news/seoul-same-complex-price-gap/'],
  ['/news/tokyo-cheaper-rent-longer-commute/', '/ko/news/tokyo-cheaper-rent-longer-commute/'],
  ['/news/seoul-buam-dong-afternoon-walk/', '/ko/news/seoul-buam-dong-afternoon-walk/'],
  ['/news/tokyo-koenji-vintage-evening-walk/', '/ko/news/tokyo-koenji-vintage-evening-walk/'],

  ['/news/seoul-euljiro-read-the-workshop-signs/', '/ko/news/seoul-euljiro-read-the-workshop-signs/'],
  ['/news/dubai-deira-gold-and-spice-walk/', '/ko/news/dubai-deira-gold-and-spice-walk/'],
  ['/news/seoul-footfall-shop-rent-capacity/', '/ko/news/seoul-footfall-shop-rent-capacity/'],
  ['/news/dubai-valuation-purchase-cash-gap/', '/ko/news/dubai-valuation-purchase-cash-gap/'],
  ['/news/singapore-lower-psf-higher-total-budget/', '/ko/news/singapore-lower-psf-higher-total-budget/'],
  ['/news/dubai-new-renewal-rent-mix/', '/ko/news/dubai-new-renewal-rent-mix/'],
  ['/news/singapore-queenstown-everyday-heritage/', '/ko/news/singapore-queenstown-everyday-heritage/'],
  ['/news/tokyo-kiyosumi-shirakawa-between-stops/', '/ko/news/tokyo-kiyosumi-shirakawa-between-stops/'],
  ['/news/singapore-condo-prices-2026-by-project/', '/ko/news/singapore-condo-prices-2026-by-project/'],
  ['/news/tokyo-asking-price-vs-contracted-price-2026/', '/ko/news/tokyo-asking-price-vs-contracted-price-2026/'],
  [
    "/news/policy/korea-rental-deposit-protection-status/",
    "/ko/news/korea-rental-deposit-protection-status/"
  ],
  [
    "/news/policy/korea-foreign-property-reporting-status/",
    "/ko/news/korea-foreign-property-reporting-status/"
  ],
  [
    "/news/policy/seoul-land-transaction-permit-status/",
    "/ko/news/seoul-land-transaction-permit-status/"
  ],
  [
    "/news/policy/korea-housing-finance-rules-status/",
    "/ko/news/korea-housing-finance-rules-status/"
  ],
  [
    "/news/policy/singapore-absd-policy-status/",
    "/ko/news/singapore-absd-policy-status/"
  ],
  [
    "/news/policy/singapore-hdb-private-owner-waitout-status/",
    "/ko/news/singapore-hdb-private-owner-waitout-status/"
  ],
  [
    "/news/seoul-sale-market-monthly-brief/",
    "/ko/news/seoul-sale-market-monthly-brief/"
  ],
  [
    "/news/seoul-jeonse-market-monthly-brief/",
    "/ko/news/seoul-jeonse-market-monthly-brief/"
  ],
  [
    "/news/seoul-monthly-rent-market-brief/",
    "/ko/news/seoul-monthly-rent-market-brief/"
  ],
  [
    "/news/singapore-private-market-quarterly-brief/",
    "/ko/news/singapore-private-market-quarterly-brief/"
  ],
  [
    "/news/seoul-district-price-distribution/",
    "/ko/news/seoul-district-price-distribution/"
  ],
  [
    "/news/seoul-new-renewal-rent-gap/",
    "/ko/news/seoul-new-renewal-rent-gap/"
  ],
  [
    "/news/korea-deposit-monthly-rent-cost-structure/",
    "/ko/news/korea-deposit-monthly-rent-cost-structure/"
  ],
  [
    "/news/singapore-ccr-rcr-ocr-comparison/",
    "/ko/news/singapore-ccr-rcr-ocr-comparison/"
  ],
  [
    "/guides/rent-an-apartment-in-korea/",
    "/ko/guides/rent-an-apartment-in-korea/"
  ],
  [
    "/guides/wolse-vs-jeonse/",
    "/ko/guides/wolse-vs-jeonse/"
  ],
  [
    "/guides/korea-rental-contract-checklist/",
    "/ko/guides/korea-rental-contract-checklist/"
  ],
  [
    "/guides/read-seoul-sale-transactions/",
    "/ko/guides/read-seoul-sale-transactions/"
  ],
  [
    "/guides/buy-property-in-korea-as-foreigner/",
    "/ko/guides/buy-property-in-korea-as-foreigner/"
  ],
  [
    "/guides/read-singapore-private-transactions/",
    "/ko/guides/read-singapore-private-transactions/"
  ],
  [
    "/news/seoul-monthly-2026-09/",
    "/ko/news/seoul-monthly-2026-09/"
  ],
  [
    "/news/singapore-monthly-2026-09/",
    "/ko/news/singapore-monthly-2026-09/"
  ],
  [
    "/news/dubai-monthly-2026-09/",
    "/ko/news/dubai-monthly-2026-09/"
  ],
  [
    "/guides/seoul-apartment-buying-budget-guide/",
    "/ko/guides/seoul-apartment-buying-budget-guide/"
  ],
  [
    "/guides/singapore-condo-buying-budget-guide/",
    "/ko/guides/singapore-condo-buying-budget-guide/"
  ],
  [
    "/guides/dubai-ready-apartment-buying-budget-guide/",
    "/ko/guides/dubai-ready-apartment-buying-budget-guide/"
  ]
] as const;
for (const [en, ko] of koreanPairs) {
  const group = { ...(routes[en] ?? {}), en, ko };
  for (const href of Object.values(group)) routes[href] = group;
}
for (const city of ['seoul', 'singapore', 'dubai']) {
  const path = `/news/${city}-monthly-2026-09/`;
  const group = { en: path, ko: `/ko${path}`, 'zh-CN': `/zh-cn${path}` };
  for (const href of Object.values(group)) routes[href] = group;
}
for (const path of ['/news/dubai-rental-yield-after-costs/', '/news/tokyo-older-apartments-shinagawa-renewal-2026/']) {
  const group = { en: path, ko: `/ko${path}`, 'zh-CN': `/zh-cn${path}` };
  for (const href of Object.values(group)) routes[href] = group;
}
for (const { city, id } of JOURNEY_ARTICLE_ROUTES) {
  const en = journeyArticleHref(city, id);
  const ko = journeyArticleHref(city, id, 'ko');
  const pair = { en, ko };
  routes[en] = pair;
  routes[ko] = pair;
}
export function editorialLanguageRoutes(): EditorialLanguageRoutes { return routes; }
for (const slug of BILINGUAL_DATABASE_SLUGS) {
  const en = `/news/${slug}/`, ko = `/ko/news/${slug}/`;
  routes[en] = routes[ko] = { en, ko };
}

