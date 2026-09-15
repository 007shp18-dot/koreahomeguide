import { singaporeSitemapGroups } from '@/lib/seo/singapore-sitemap.server';
import { sitemapXml, xmlResponse } from '@/lib/seo/sitemap-xml';

export const dynamic = 'force-static';
export const dynamicParams = false;
export async function generateStaticParams() {
  return [...(await singaporeSitemapGroups()).keys()].map(partition => ({ partition }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ partition: string }> }) {
  const entries = (await singaporeSitemapGroups()).get((await params).partition);
  return entries ? xmlResponse(sitemapXml(entries)) : new Response('Not found', { status: 404 });
}
