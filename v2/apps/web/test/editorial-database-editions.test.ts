import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({ publicContentDatabase: () => mocks.sql }));
import { getPublishedContent, listPublishedContent } from '../lib/content/content-repository.server';
const slug = 'seoul-august-2026-sales-reporting-lag';
const row = {slug,locale:'en',market_id:'kr-seoul',content_type:'market-brief',title:'Original reporting-lag headline',summary:'Original summary',body_markdown:'Original body',published_at:'2026-09-12T00:00:00Z',updated_at:'2026-09-12T00:00:00Z',reviewed_at:'2026-09-12T00:00:00Z',reviewed_by:'editor',evidence_state:'verified',sources:[{id:'molit',kind:'primary',publisher:'MOLIT',title:'Transaction reporting',href:'https://rt.molit.go.kr/',checkedAt:'2026-09-12T00:00:00Z'}]};
beforeEach(() => {vi.clearAllMocks();mocks.sql.mockImplementation((parts:TemplateStringsArray,locale:string) => Promise.resolve(locale==='en'?[row]:[]));});
describe('reviewed database language editions', () => {
  it('serves a real Korean revision with the original evidence dates and sources', async () => {
    const article = await getPublishedContent('ko',slug);
    expect(article?.locale).toBe('ko');
    expect(article?.title).toMatch(/[가-힣]/);
    expect(article?.bodyMarkdown).toMatch(/[가-힣]/);
    expect(article?.reviewedAt).toBe(row.reviewed_at);
    expect(article?.sources[0]?.checkedAt).toBe(row.sources[0]!.checkedAt);
    expect((await listPublishedContent({locale:'ko',limit:20})).map(a=>a.slug)).toEqual([slug]);
  });
  it('requires the live English source to remain publishable', async () => {
    mocks.sql.mockResolvedValue([{...row,evidence_state:'withdrawn'}]);
    expect(await getPublishedContent('ko',slug)).toBeNull();
    expect(await listPublishedContent({locale:'ko',limit:20})).toEqual([]);
  });
  it('excludes any existing native edition, including withdrawals or drafts, at the SQL boundary', async () => {
    mocks.sql.mockResolvedValue([]);
    expect(await getPublishedContent('ko',slug)).toBeNull();
    const fallback = mocks.sql.mock.calls.find(call => call[1]==='en');
    expect(fallback?.[0].join('')).toMatch(/NOT EXISTS \(\s*SELECT 1 FROM content_articles sibling/);
    expect(fallback?.[0].join('')).toContain('sibling.slug = article.slug AND sibling.locale =');
    expect(fallback?.slice(1,4)).toEqual(['en','ko','ko']);
    expect(fallback?.[0].join('')).not.toContain('sibling.editorial_status');
  });
  it('does not create a Korean fallback for an unapproved translation slug', async () => {
    expect(await getPublishedContent('ko','untranslated-story')).toBeNull();
    expect(mocks.sql).toHaveBeenCalledTimes(1);
  });
  it('does not relabel a future English revision as Korean', async () => {
    mocks.sql.mockImplementation((parts:TemplateStringsArray,locale:string) => Promise.resolve(locale==='en'?[{...row,updated_at:'2026-09-15T00:00:00Z'}]:[]));
    expect(await getPublishedContent('ko',slug)).toBeNull();
    expect(await listPublishedContent({locale:'ko',limit:20})).toEqual([]);
  });
});
