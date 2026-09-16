import { readFileSync } from 'node:fs';
import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Absolute resolution also works when Next starts from the workspace root.
const retiredEditorial = JSON.parse(readFileSync(new URL('./content/retired-editorial.json', import.meta.url), 'utf8')) as Record<string, string>;

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const nextConfig: NextConfig = {
  trailingSlash: true,
  async rewrites() {
    // Public XML URLs stay at the site root so their scope includes every locale.
    return [
      { source: '/seoul-:district-sitemap.xml', destination: '/sitemaps/seoul/:district/' },
      { source: '/singapore-:partition-sitemap.xml', destination: '/sitemaps/singapore/:partition/' },
    ];
  },
  async redirects() {
    return [
      ...['', '/ko', '/zh-cn'].flatMap(prefix => Object.entries(retiredEditorial).map(([slug, destination]) => ({ source: `${prefix}/news/${slug}/`, destination: `${prefix === '/zh-cn' ? '' : prefix}${destination}`, permanent: true }))),
      ...['', '/ko', '/zh-cn'].flatMap(prefix => [
        ['seoul', 'seoul-apartment-buying-budget-guide'],
        ['singapore', 'singapore-condo-buying-budget-guide'],
        ['dubai', 'dubai-ready-apartment-buying-budget-guide'],
        ['tokyo', 'tokyo-apartment-buying-budget-guide'],
      ].map(([city, slug]) => ({ source: `${prefix}/guides/${city}-same-budget-property-comparison/`, destination: `${prefix === '/zh-cn' && city !== 'tokyo' ? '' : prefix}/guides/${slug}/`, permanent: true }))),
      { source: '/sg/singapore/sitemap.xml', destination: '/singapore-sitemap.xml', permanent: true },
      // Retired district/type pages now open the current filtered explorer.
      ...['', '/ko', '/zh-cn'].flatMap(prefix => [
        { source: `${prefix}/kr/seoul/explore/:district(jongno-gu|jung-gu|yongsan-gu|seongdong-gu|gwangjin-gu|dongdaemun-gu|jungnang-gu|seongbuk-gu|gangbuk-gu|dobong-gu|nowon-gu|eunpyeong-gu|seodaemun-gu|mapo-gu|yangcheon-gu|gangseo-gu|guro-gu|geumcheon-gu|yeongdeungpo-gu|dongjak-gu|gwanak-gu|seocho-gu|gangnam-gu|songpa-gu|gangdong-gu)/`, destination: `${prefix}/kr/seoul/explore/?district=:district`, permanent: true },
        ...[['apartment', 'apartment'], ['villa', 'villa_multifamily'], ['officetel', 'officetel']].map(([path, housing]) => ({
          source: `${prefix}/kr/seoul/explore/:district(jongno-gu|jung-gu|yongsan-gu|seongdong-gu|gwangjin-gu|dongdaemun-gu|jungnang-gu|seongbuk-gu|gangbuk-gu|dobong-gu|nowon-gu|eunpyeong-gu|seodaemun-gu|mapo-gu|yangcheon-gu|gangseo-gu|guro-gu|geumcheon-gu|yeongdeungpo-gu|dongjak-gu|gwanak-gu|seocho-gu|gangnam-gu|songpa-gu|gangdong-gu)/${path}/`,
          destination: `${prefix}/kr/seoul/explore/?district=:district&propertyType=${housing}`, permanent: true,
        })),
      ]),
      ...['en', 'ko', 'zh'].map((locale) => ({
        source: `/og/${locale}/`, destination: '/og.png', permanent: false,
      })),
      { source: '/kr/seoul/news/', destination: '/news/?market=seoul', permanent: true },
      { source: '/insights/', destination: '/news/', permanent: true },
      ...[
        'korea-foreon-neighbour-price-gap',
        'singapore-lentor-launch-resale-divergence',
        'dubai-rental-yield-after-costs',
        'seoul-84sqm-under-one-billion-2026',
        'singapore-condos-under-1-5-million-2026',
      ].map((slug) => ({ source: `/insights/${slug}/`, destination: `/news/${slug}/`, permanent: true })),
      { source: '/insights/:slug/', destination: '/news/', permanent: true },
      { source: '/zh-cn/kr/seoul/insights/', destination: '/zh-cn/news/', permanent: true },
      { source: '/zh-cn/kr/seoul/insights/:slug/', destination: '/zh-cn/news/', permanent: true },
      { source: '/kr/seoul/guide/', destination: '/guides/', permanent: true },
      { source: '/kr/seoul/guide/rent-apartment-korea-foreigner/', destination: '/guides/rent-an-apartment-in-korea/', permanent: true },
      { source: '/kr/seoul/guide/read-seoul-apartment-sale-prices/', destination: '/guides/read-seoul-sale-transactions/', permanent: true },
      { source: '/kr/seoul/guide/compare-seoul-district-property-prices/', destination: '/guides/read-seoul-sale-transactions/#section-6', permanent: true },
      { source: '/guides/compare-seoul-district-prices/', destination: '/guides/read-seoul-sale-transactions/#section-6', permanent: true },
      { source: '/ko/guides/compare-seoul-district-prices/', destination: '/ko/guides/read-seoul-sale-transactions/#section-6', permanent: true },
      { source: '/kr/seoul/guide/korea-apartment-buying-checklist/', destination: '/guides/buy-property-in-korea-as-foreigner/', permanent: true },
      { source: '/kr/seoul/guide/wolse-vs-jeonse/', destination: '/guides/wolse-vs-jeonse/', permanent: true },
      { source: '/kr/seoul/guide/korea-rental-contract-checklist/', destination: '/guides/korea-rental-contract-checklist/', permanent: true },
      { source: '/kr/seoul/guide/:slug/', destination: '/guides/', permanent: true },
    ];
  },
  experimental: {
    globalNotFound: true,
  },
  turbopack: {
    root: repositoryRoot,
  },
  outputFileTracingRoot: repositoryRoot,
  outputFileTracingIncludes: {
    '/api/markets/kr-seoul/building-facts': ['./data/building-identity-index.json.gz'],
    '/*': [
      './data/observed-building-inventory.json.gz',
      './data/korea-rent-evidence.json.gz',
      './data/korea-sale-evidence.json.gz',
      './data/korea-conversion-evidence.json.gz',
      './data/kapt-building-facts.json.gz',
      './data/dubai-area-evidence.json.gz',
      './data/singapore-private-sale.json.gz',
      './data/singapore-hdb.json.gz',
      './data/singapore-check-ura-private-sale.json.gz',
      './data/singapore-check-hdb-resale.json.gz',
      './data/singapore-check-hdb-rent.json.gz',
    ],
  },
};

export default nextConfig;
