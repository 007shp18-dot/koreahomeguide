import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/script', () => ({
  default: ({ src }: Readonly<{ src: string }>) => createElement('script', { src }),
}));

import InsightsPage, { metadata } from '../app/(en)/insights/page';
import { POST, parseEditorialArticleInput } from '../app/api/internal/content-articles/route';
import { GooglePlacePhoto } from '../components/maps/google-place-photo';
import {
  STARTER_EDITORIAL_ARTICLES,
  estimateReadMinutes,
} from '../lib/insights/editorial-content';

afterEach(() => vi.unstubAllEnvs());

describe('SignedPrice editorial insights', () => {
  it('publishes the original-reporting hub separately from external News', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const html = renderToStaticMarkup(await InsightsPage());

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/insights/',
      languages: {
        en: 'https://www.signedprice.com/insights/',
        'zh-Hans': 'https://www.signedprice.com/zh-cn/kr/seoul/insights/',
        'x-default': 'https://www.signedprice.com/insights/',
      },
    });
    expect(html).toContain('Property evidence, explained.');
    expect(html).toContain('SignedPrice reports, market analysis and practical guides.');
    expect(html).not.toContain('SignedPrice Data Desk');
    for (const article of STARTER_EDITORIAL_ARTICLES) {
      expect(html).toContain(article.title);
      expect(html).toContain(`href="/insights/${article.slug}"`);
    }
    expect(html).toContain('href="/news"');
    expect(html).not.toContain('Private editorial workspace');
  });

  it('parses only bounded article payloads and keeps drafts private by status', () => {
    const bodyMarkdown = '## Evidence\n\n' + 'A complete evidence boundary is written here. '.repeat(3);
    expect(parseEditorialArticleInput({
      slug: 'seoul-sample-report',
      marketKey: 'seoul',
      title: 'A bounded Seoul report',
      summary: 'A sufficient summary that explains the report before publication.',
      bodyMarkdown,
      status: 'draft',
    })).toMatchObject({ slug: 'seoul-sample-report', marketKey: 'seoul', status: 'draft' });
    expect(parseEditorialArticleInput({
      slug: '../bad', marketKey: 'global', title: 'Too short', summary: 'Too short', bodyMarkdown, status: 'published',
    })).toBeNull();
    expect(estimateReadMinutes('one two three')).toBe(2);
  });

  it('requires the server-only content admin secret before saving', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'private-editor-secret');
    const response = await POST(new Request('https://www.signedprice.com/api/internal/content-articles/', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthorized' });
  });

  it('starts a registry photo lookup even when Google browser credentials are absent', () => {
    const html = renderToStaticMarkup(<GooglePlacePhoto
      browserKey={null}
      buildingName="Verified Residence"
      address="1 Verified Road"
      registryKey="sg-project:verified-residence"
      fallback={<div>Location map fallback</div>}
    />);
    expect(html).toContain('Loading verified place photo');
    expect(html).not.toContain('Location map fallback');
    expect(html).not.toContain('maps.googleapis.com');
  });
});
