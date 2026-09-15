import { GET as indexXml } from '../app/singapore-sitemap.xml/route';
import { GET as shardXml } from '../app/sitemaps/singapore/[partition]/route';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { singaporeSitemapGroups } from '../lib/seo/singapore-sitemap.server';
import { sitemapXml } from '../lib/seo/sitemap-xml';

afterEach(() => vi.unstubAllEnvs());
it('partitions Singapore into scoped root XML files without losing or duplicating localized URLs', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  const groups = await singaporeSitemapGroups();
  expect(groups.size).toBe(32);
  const urls: string[] = [];
  for (const [key, entries] of groups) {
    expect(key).toMatch(/^(private-(ccr|rcr|ocr)|hdb-[a-z-]+|check)$/);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.length).toBeLessThan(5000);
    expect(Buffer.byteLength(sitemapXml(entries))).toBeLessThan(5 * 1024 * 1024);
    for (const entry of entries) {
      const path = new URL(entry.url).pathname.replace(/^\/(ko|zh-cn)/, '');
      if (key.startsWith('hdb-')) expect(path).toContain(`/hdb/${key.slice(4)}/`);
      if (key.startsWith('private-')) expect(path).toContain(`/explore/${key.slice(8)}/`);
      if (key === 'check') expect(path).toBe('/sg/singapore/check/');
      urls.push(entry.url);
    }
  }
  expect(urls).toHaveLength(32892);
  expect(new Set(urls).size).toBe(urls.length);
}, 60_000);

it('serves a root index and real XML shards, with 404 for unknown partitions', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  const index = await indexXml();
  expect(index.headers.get('content-type')).toContain('application/xml');
  const xml = await index.text();
  expect(xml).toContain('<loc>https://www.signedprice.com/singapore-private-ccr-sitemap.xml</loc>');
  expect(xml).toContain('<loc>https://www.signedprice.com/singapore-hdb-ang-mo-kio-sitemap.xml</loc>');
  const shard = await shardXml(new Request('https://www.signedprice.com/'), { params: Promise.resolve({ partition: 'check' }) });
  expect(shard.status).toBe(200);
  expect(await shard.text()).toContain('<loc>https://www.signedprice.com/ko/sg/singapore/check/</loc>');
  const missing = await shardXml(new Request('https://www.signedprice.com/'), { params: Promise.resolve({ partition: 'unknown' }) });
  expect(missing.status).toBe(404);
}, 60_000);
