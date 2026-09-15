import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { GET } from '../app/editorial-sitemap.xml/route';
import sitemap from '../app/sitemap';
import { seoulBuildingSitemap, seoulSitemapDistricts } from '../lib/seo/seoul-sitemap.server';
import { GET as districtSitemap } from '../app/sitemaps/seoul/[district]/route';
import { GET as seoulIndex } from '../app/seoul-sitemap.xml/route';
import { sitemapXml } from '../lib/seo/sitemap-xml';
import { generateMetadata as neighborhoodMetadata } from '../app/(en)/kr/seoul/explore/[district]/neighborhood/[neighborhoodId]/page';

afterEach(() => vi.unstubAllEnvs());

it('publishes static guides and stories even without a content database', async () => {
  vi.stubEnv('DATABASE_URL', '');
  const response = await GET();
  const xml = await response.text();
  expect(response.headers.get('content-type')).toContain('application/xml');
  expect(xml).toContain('<loc>https://www.signedprice.com/guides/tokyo-apartment-buying-budget-guide/</loc>');
  expect(xml).toContain('<loc>https://www.signedprice.com/ko/guides/tokyo-apartment-buying-budget-guide/</loc>');
  expect(xml).toContain('<loc>https://www.signedprice.com/news/seoul-same-complex-price-gap/</loc>');
  expect(xml).not.toContain('/zh-cn/guides/buy-property-in-korea-zh/');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  expect(new Set(urls).size).toBe(urls.length);
});

it('keeps building inventory out of the core discovery sitemap', () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', undefined);
  const entries = sitemap();
  expect(entries.some(({ url }) => /\/explore\/songpa-gu\/songpa-gu-/.test(url))).toBe(false);
  expect(entries.some(({ url }) => url.endsWith('/guides/'))).toBe(true);
}, 20_000);

it('partitions every eligible Seoul URL exactly once and advertises all districts', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', undefined);
  const index = await seoulIndex().text();
  const all = seoulBuildingSitemap().map(entry => entry.url);
  const partitioned: string[] = [];
  for (const district of seoulSitemapDistricts) {
    expect(index).toContain(`https://www.signedprice.com/seoul-${district}-sitemap.xml`);
    const entries = seoulBuildingSitemap(district);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(entry => entry.url.includes(`/explore/${district}/`))).toBe(true);
    expect(entries.length).toBeLessThan(50_000);
    expect(Buffer.byteLength(sitemapXml(entries))).toBeLessThan(50 * 1024 * 1024);
    partitioned.push(...entries.map(entry => entry.url));
  }
  expect(partitioned.sort()).toEqual(all.sort());
  expect(new Set(partitioned).size).toBe(partitioned.length);
  const response = await districtSitemap(new Request('https://www.signedprice.com/'), { params: Promise.resolve({ district: 'not-a-district' }) });
  expect(response.status).toBe(404);
}, 20_000);

it('escapes XML URLs and preserves language alternates', () => {
  const xml = sitemapXml([{ url: 'https://www.signedprice.com/?a=1&b=2', alternates: { languages: { en: 'https://www.signedprice.com/?a=1&b=2' } } }]);
  expect(xml).toContain('<loc>https://www.signedprice.com/?a=1&amp;b=2</loc>');
  expect(xml).toContain('hreflang="en" href="https://www.signedprice.com/?a=1&amp;b=2"');
});

it('redirects a retired thin neighborhood to its filtered explorer instead of a dead page', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', undefined);
  await expect(neighborhoodMetadata({ params: Promise.resolve({ district: 'jongno-gu', neighborhoodId: 'jongno-gu-dong-10nk0bq' }) }))
    .rejects.toMatchObject({ digest: expect.stringContaining('/kr/seoul/explore/?district=jongno-gu&neighborhood=jongno-gu-dong-10nk0bq') });
}, 20_000);
