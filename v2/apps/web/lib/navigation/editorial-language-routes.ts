import type { SiteLocale } from './site-navigation';
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
export function editorialLanguageRoutes(): EditorialLanguageRoutes { return routes; }
