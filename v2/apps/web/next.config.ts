import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const nextConfig: NextConfig = {
  trailingSlash: true,
  async redirects() {
    return [
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
      { source: '/zh-cn/kr/seoul/explore/', destination: '/kr/seoul/explore/', permanent: true },
      { source: '/zh-cn/kr/seoul/check/', destination: '/kr/seoul/check/', permanent: true },
      { source: '/kr/seoul/guide/', destination: '/guides/', permanent: true },
      { source: '/kr/seoul/guide/rent-apartment-korea-foreigner/', destination: '/guides/rent-an-apartment-in-korea/', permanent: true },
      { source: '/kr/seoul/guide/read-seoul-apartment-sale-prices/', destination: '/guides/read-seoul-sale-transactions/', permanent: true },
      { source: '/kr/seoul/guide/compare-seoul-district-property-prices/', destination: '/guides/compare-seoul-district-prices/', permanent: true },
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
    ],
  },
};

export default nextConfig;
