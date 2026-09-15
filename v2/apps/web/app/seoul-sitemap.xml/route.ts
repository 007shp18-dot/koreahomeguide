import { seoulSitemapDistricts } from '@/lib/seo/seoul-sitemap.server';
import { xmlResponse } from '@/lib/seo/sitemap-xml';

export const dynamic = 'force-static';
export function GET() {
  const maps = seoulSitemapDistricts.map(district => `<sitemap><loc>https://www.signedprice.com/seoul-${district}-sitemap.xml</loc></sitemap>`).join('');
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${maps}</sitemapindex>`);
}
