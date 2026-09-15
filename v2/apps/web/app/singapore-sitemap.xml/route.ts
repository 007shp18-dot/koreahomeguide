import { singaporeSitemapGroups } from '@/lib/seo/singapore-sitemap.server';
import { xmlResponse } from '@/lib/seo/sitemap-xml';

export const dynamic = 'force-static';
export async function GET() {
  const groups = await singaporeSitemapGroups();
  const maps = [...groups.keys()].map(key => `<sitemap><loc>https://www.signedprice.com/singapore-${key}-sitemap.xml</loc></sitemap>`).join('');
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${maps}</sitemapindex>`);
}
