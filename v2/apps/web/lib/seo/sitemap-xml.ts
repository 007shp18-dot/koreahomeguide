import type { MetadataRoute } from 'next';

export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
}
export function sitemapXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries.map(({ url, lastModified, alternates }) => {
    const date = lastModified instanceof Date ? lastModified.toISOString() : lastModified;
    const languages = Object.entries(alternates?.languages ?? {}).map(([lang, href]) =>
      `<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(String(href))}"/>`).join('');
    return `<url><loc>${escapeXml(url)}</loc>${date ? `<lastmod>${escapeXml(date)}</lastmod>` : ''}${languages}</url>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}
export function xmlResponse(xml: string): Response {
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
