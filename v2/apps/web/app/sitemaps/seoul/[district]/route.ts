import { seoulBuildingSitemap, seoulSitemapDistricts } from '@/lib/seo/seoul-sitemap.server';
import { sitemapXml, xmlResponse } from '@/lib/seo/sitemap-xml';

export const dynamic = 'force-static';
export const revalidate = 86400;
export function generateStaticParams() {
  return seoulSitemapDistricts.map(district => ({ district }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ district: string }> }) {
  const { district } = await params;
  if (!seoulSitemapDistricts.some(slug => slug === district)) return new Response('Not found', { status: 404 });
  return xmlResponse(sitemapXml(seoulBuildingSitemap(district)));
}
