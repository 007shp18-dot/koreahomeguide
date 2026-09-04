import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { parseGoogleNewsRss } from '../lib/news/google-news-rss.server';

describe('Google News RSS supplement', () => {
  it('keeps publisher metadata while removing encoded feed markup', () => {
    const items = parseGoogleNewsRss(`<?xml version="1.0"?><rss><channel><item>
      <title><![CDATA[Singapore condo sales rise - Example News]]></title>
      <link>https://news.google.com/rss/articles/example?oc=5</link>
      <pubDate>Fri, 04 Sep 2026 01:00:00 GMT</pubDate>
      <description><![CDATA[&lt;a href="https://example.com"&gt;Singapore condo sales rise&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font&gt;Example News&lt;/font&gt;]]></description>
      <source url="https://example.com">Example News</source>
    </item></channel></rss>`, {
      market: 'singapore', marketLabel: 'Singapore', query: 'Singapore property',
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.summary).toBe('Singapore condo sales rise Example News');
    expect(items[0]?.publisher).toBe('Example News');
    expect(items[0]?.sourceKind).toBe('google-news-rss');
  });
});
