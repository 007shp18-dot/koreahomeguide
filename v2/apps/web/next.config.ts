import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const nextConfig: NextConfig = {
  trailingSlash: true,
  async redirects() {
    return [
      { source: '/insights/', destination: '/news/', permanent: true },
      { source: '/insights/:slug/', destination: '/news/', permanent: true },
      { source: '/zh-cn/kr/seoul/insights/', destination: '/zh-cn/news/', permanent: true },
      { source: '/zh-cn/kr/seoul/insights/:slug/', destination: '/zh-cn/news/', permanent: true },
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
    ],
  },
};

export default nextConfig;
