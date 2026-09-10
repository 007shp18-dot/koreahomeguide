import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: [
      'https://www.signedprice.com/sitemap.xml',
      'https://www.signedprice.com/editorial-sitemap.xml',
      'https://www.signedprice.com/sg/singapore/sitemap.xml',
    ],
    host: 'https://www.signedprice.com',
  };
}
