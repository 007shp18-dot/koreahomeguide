import { beforeEach, describe, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ read: vi.fn(), refresh: vi.fn(), after: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({ after: calls.after, NextResponse: { json: (value: unknown, options: ResponseInit) => Response.json(value, options) } }));
vi.mock('../lib/news/news-persistence.server', () => ({ loadPersistedNewsItems: calls.read }));
vi.mock('../lib/news/news-route-model.server', () => ({ buildNewsIndexModel: () => ({}) }));
vi.mock('../lib/news/naver-news.server', () => ({ buildApprovedNewsWorkspaceModel: () => ({ items: [], naverState: 'not-configured' }), buildNewsWorkspaceModel: calls.refresh }));
import { GET } from '../app/api/news/route';
describe('news response latency boundary', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns stored Dubai headlines without waiting for external collection or writes', async () => {
    calls.read.mockResolvedValue([{ id: 'dubai', market: 'dubai', url: 'https://example.test/story', publishedAt: '2026-09-06' }]);
    const response = await GET();
    expect((await response.json()).items[0].market).toBe('dubai');
    expect(calls.refresh).not.toHaveBeenCalled();
    expect(calls.after).toHaveBeenCalledOnce();
    await calls.after.mock.calls[0]![0]();
    expect(calls.refresh).toHaveBeenCalledOnce();
    expect(response.headers.get('cache-control')).toContain('s-maxage=900');
  });
  it('collects a fallback when the DB has no items', async () => {
    calls.read.mockResolvedValue(null);
    calls.refresh.mockResolvedValue({ items: [], naverState: 'unavailable' });
    expect((await (await GET()).json()).naverState).toBe('unavailable');
    expect(calls.after).not.toHaveBeenCalled();
  });
});
