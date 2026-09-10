import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('../components/japan/tokyo-explorer', () => ({ default: () => null }));

describe('Tokyo public metadata', () => {
  it.each([
    ['/jp/tokyo/', () => import('../app/(en)/jp/tokyo/page')],
    ['/jp/tokyo/explore/', () => import('../app/(en)/jp/tokyo/explore/page')],
  ] as const)('%s has the complete public sharing and indexing contract', async (path, load) => {
    const { metadata } = await load();
    const canonical = `https://www.signedprice.com${path}`;
    expect(metadata.alternates?.canonical).toBe(canonical);
    expect(metadata.openGraph).toMatchObject({ url: canonical, locale: 'en_US', images: ['https://www.signedprice.com/og/en/'] });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });
});
