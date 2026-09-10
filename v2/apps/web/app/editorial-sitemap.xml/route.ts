import {listPublishedContent} from '@/lib/content/content-repository.server';
import {storedEditorialRecord} from '@/lib/content/newsroom-content.server';
export const dynamic='force-static';
export const revalidate=86400;
export async function GET() {
 const sets=await Promise.all((['en','ko','zh-CN'] as const).map(locale=>listPublishedContent({locale,limit:200})));
 const entries=sets.flat().filter(a=>['news-brief','market-brief','data-story'].includes(a.type)).map(a=>`<url><loc>https://www.signedprice.com${storedEditorialRecord(a).canonicalHref}</loc><lastmod>${new Date(a.updatedAt).toISOString()}</lastmod></url>`).join('');
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
