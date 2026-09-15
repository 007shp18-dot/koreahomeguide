import type { MetadataRoute } from 'next';
import { EDITORIAL_PORTFOLIO } from '@/content/portfolio-manifest';
import { listPublishedContent } from '@/lib/content/content-repository.server';
import { storedEditorialRecord } from '@/lib/content/newsroom-content.server';
import { isContentIndexable } from '@/lib/seo/content-index-policy';
import { sitemapXml, xmlResponse } from '@/lib/seo/sitemap-xml';
import { publicCanonical } from '@/lib/public-metadata';

export const dynamic = 'force-static';
export const revalidate = 86400;
export async function GET() {
  const sets = await Promise.all((['en', 'ko', 'zh-CN'] as const).map(locale => listPublishedContent({ locale, limit: 200 })));
  // Database-backed news overrides the static edition, as on the public newsroom.
  // Static guides must remain discoverable even when no database is configured.
  const records = [...EDITORIAL_PORTFOLIO, ...sets.flat()
    .filter(article => ['news-brief', 'market-brief', 'data-story'].includes(article.type))
    .map(storedEditorialRecord)];
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const article of records) {
    if (!isContentIndexable(article.canonicalHref)) continue;
    const url = publicCanonical(article.canonicalHref as `/${string}`);
    entries.set(url, { url, lastModified: new Date(article.updatedAt) });
  }
  return xmlResponse(sitemapXml([...entries.values()]));
}
