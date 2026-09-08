import { beforeEach, describe, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ read: vi.fn(), refresh: vi.fn(), after: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({ after: calls.after, NextResponse: { json: (value: unknown, options: ResponseInit) => Response.json(value, options) } }));
vi.mock('../lib/news/public-headlines.server', () => ({ loadPublicHeadlines: calls.read }));
vi.mock('../lib/news/news-route-model.server', () => ({ buildNewsIndexModel: () => ({}) }));
vi.mock('../lib/news/naver-news.server', () => ({ buildApprovedNewsWorkspaceModel: () => ({ items: [], naverState: 'not-configured' }), buildNewsWorkspaceModel: calls.refresh }));
import { GET } from '../app/api/news/route';
describe('news response latency boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.refresh.mockResolvedValue({ items: [{ id: 'unreviewed-discovery' }], naverState: 'ready' });
  });
  it('returns reviewed stored headlines without scheduling public-request collection or writes', async () => {
    calls.read.mockResolvedValue([{ id: 'singapore', market: 'singapore', url: 'https://example.test/story', publishedAt: '2026-09-06' }]);
    const response = await GET();
    expect((await response.json()).items[0].market).toBe('singapore');
    expect(calls.refresh).not.toHaveBeenCalled();
    expect(calls.after).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toContain('s-maxage=900');
  });
  it('reports a storage outage without collecting unreviewed fallback headlines', async () => {
    calls.read.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(calls.refresh).not.toHaveBeenCalled();
    expect(calls.after).not.toHaveBeenCalled();
  });
  it('keeps a successful empty review queue empty instead of publishing live discovery', async () => {
    calls.read.mockResolvedValue([]);
    const response = await GET();
    expect(await response.json()).toMatchObject({ items: [], naverState: 'ready' });
    expect(calls.refresh).not.toHaveBeenCalled();
    expect(calls.after).not.toHaveBeenCalled();
  });
});
