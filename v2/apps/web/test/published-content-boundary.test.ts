import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('server-only', () => ({}));

import {
  canonicalContentHref,
  createPublishedContentRepository,
  type PublishedContentArticle,
} from '../lib/content/content-repository.server';
import { externalDiscoveryPublicHref } from '../lib/content/content-types';

function article(
  overrides: Partial<PublishedContentArticle> = {},
): PublishedContentArticle {
  return Object.freeze({
    id: 'article-1', slug: 'reviewed-market-brief', locale: 'en',
    marketId: 'kr-seoul', type: 'market-brief', title: 'Reviewed market brief',
    deck: 'What changed and what the released evidence can support.',
    bodyMarkdown: '## Evidence\n\nReviewed evidence body.',
    status: 'published', evidenceState: 'verified',
    authorName: 'SignedPrice Data Desk', reviewedAt: '2026-09-04T00:00:00.000Z',
    reviewedBy: 'editor-1', publishedAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z', relatedHref: '/kr/seoul/explore/',
    sources: Object.freeze([Object.freeze({
      id: 'source-1', kind: 'primary', publisher: 'MOLIT', title: 'Reported contracts',
      href: 'https://rt.molit.go.kr/', checkedAt: '2026-09-04T00:00:00.000Z',
    })]),
    ...overrides,
  });
}

describe('published content boundary', () => {
  it('keeps the public News route off the external discovery repository', () => {
    const source = readFileSync(new URL('../app/(en)/news/page.tsx', import.meta.url), 'utf8');
    expect(source).toContain('listNewsroomArticles');
    expect(source).not.toContain('buildNewsWorkspaceModel');
    expect(source).not.toContain('naver-news.server');
  });

  it('never gives an unreviewed external discovery item a canonical public route', () => {
    expect(externalDiscoveryPublicHref({ id: 'external-1', reviewState: 'new' })).toBeNull();
  });

  it('requires review provenance and primary evidence unless evidence is not applicable', () => {
    const records = [
      article(),
      article({ id: 'draft', slug: 'draft', status: 'draft' }),
      article({ id: 'unreviewed', slug: 'unreviewed', reviewedAt: null }),
      article({ id: 'unsourced', slug: 'unsourced', sources: [] }),
      article({
        id: 'method', slug: 'method-note', type: 'guide', evidenceState: 'not-applicable',
        sources: [],
      }),
      article({ id: 'unsupported-locale', slug: 'unsupported-locale', locale: 'fr' as 'en' }),
    ];
    const repository = createPublishedContentRepository(records);

    expect(repository.list({ locale: 'en', limit: 20 }).map(({ slug }) => slug)).toEqual([
      'method-note', 'reviewed-market-brief',
    ]);
    expect(repository.get('en', 'unreviewed')).toBeNull();
    expect(repository.get('en', 'unsourced')).toBeNull();
  });

  it('creates public paths only for reviewed content types', () => {
    expect(canonicalContentHref(article())).toBe('/news/reviewed-market-brief/');
    expect(canonicalContentHref(article({ type: 'policy-update' })))
      .toBe('/news/policy/reviewed-market-brief/');
    expect(canonicalContentHref(article({ type: 'guide' })))
      .toBe('/guides/reviewed-market-brief/');
  });
});
