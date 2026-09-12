import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { fetchGoogleNewsRssItems, parseGoogleNewsRss } from '../lib/news/google-news-rss.server';

describe('Google News RSS supplement', () => {
  it('keeps publisher metadata while removing encoded feed markup', () => {
    const items = parseGoogleNewsRss(`<?xml version="1.0"?><rss><channel><item>
      <title><![CDATA[Research &amp;amp; Development - Example News]]></title>
      <link>https://news.google.com/rss/articles/example?oc=5</link>
      <pubDate>Fri, 04 Sep 2026 01:00:00 GMT</pubDate>
      <description><![CDATA[&lt;a href="https://example.com"&gt;Singapore condo sales rise&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font&gt;Example News&lt;/font&gt;]]></description>
      <source url="https://example.com">Example News</source>
    </item></channel></rss>`, {
      market: 'singapore', marketLabel: 'Singapore', query: 'Singapore property',
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Research & Development - Example News');
    expect(items[0]?.summary).toBe('Singapore condo sales rise Example News');
    expect(items[0]?.publisher).toBe('Example News');
    expect(items[0]?.sourceKind).toBe('google-news-rss');
  });
});

it('collects Tokyo alongside the other three cities', async () => {
  const requested: string[] = [];
  vi.stubGlobal('fetch', async (url: URL) => { requested.push(url.searchParams.get('q') ?? ''); return new Response('<rss><channel></channel></rss>'); });
  try { await fetchGoogleNewsRssItems(); expect(requested.some(query => /Tokyo/.test(query))).toBe(true); }
  finally { vi.unstubAllGlobals(); }
});

it('bypasses prior feed responses during scheduled collection', async () => {
  const fetcher = vi.fn(async () => new Response('<rss><channel></channel></rss>'));
  vi.stubGlobal('fetch', fetcher);
  try {
    await fetchGoogleNewsRssItems({ fresh: true });
    expect(fetcher).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ cache: 'no-store' }));
  } finally { vi.unstubAllGlobals(); }
});

it('requests Japanese and Arabic editions alongside English feeds', async () => {
  const requested: URL[] = [];
  vi.stubGlobal('fetch', async (url: URL) => {
    requested.push(new URL(String(url)));
    return new Response('<rss><channel></channel></rss>');
  });
  try {
    await fetchGoogleNewsRssItems({ fresh: true });
    expect(requested).toHaveLength(6);
    const japanese = requested.find(url => url.searchParams.get('hl') === 'ja');
    expect(japanese?.searchParams.get('q')).toContain('東京');
    expect(japanese?.searchParams.get('ceid')).toBe('JP:ja');
    const arabic = requested.find(url => url.searchParams.get('hl') === 'ar');
    expect(arabic?.searchParams.get('q')).toContain('دبي');
    expect(arabic?.searchParams.get('ceid')).toBe('AE:ar');
  } finally { vi.unstubAllGlobals(); }
});
