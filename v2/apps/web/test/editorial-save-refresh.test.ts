import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const boundary = vi.hoisted(() => ({ transaction: vi.fn(), tag: vi.fn(), path: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: () => Object.assign(() => ({}), { transaction: boundary.transaction }) }));
vi.mock('next/cache', () => ({ revalidateTag: boundary.tag, revalidatePath: boundary.path }));
import { POST } from '../app/api/internal/content-articles/route';
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('CONTENT_ADMIN_SECRET', 'test-only'); boundary.transaction.mockResolvedValue([]); });
afterEach(() => vi.unstubAllEnvs());
const request = (locale: string, authorization = true) => new Request('https://example.test/api/internal/content-articles', {
  method: 'POST', headers: { 'content-type': 'application/json', ...(authorization ? { authorization: 'Bearer test-only' } : {}) },
  body: JSON.stringify({ slug: 'new-story', marketKey: 'seoul', title: 'A new neighborhood story', summary: 'A new story for the editorial index.',
    bodyMarkdown: 'An original neighborhood story with a complete introduction and a detailed local description.',
    status: 'published', locale, contentType: 'data-story', evidenceState: 'not-applicable', reviewedBy: 'Test editor' }),
});
describe('editorial save visibility', () => {
  it.each([['en', ''], ['ko', '/ko'], ['zh-CN', '/zh-cn']])('expires the %s list after a successful publication', async (locale, prefix) => {
    const response = await POST(request(locale));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ href: `${prefix}/news/new-story/` });
    expect(boundary.tag).toHaveBeenCalledWith(`newsroom:${locale}`, { expire: 0 });
    expect(boundary.path.mock.calls.map(call => call[0])).toContain(`${prefix}/news/`);
    expect(boundary.path.mock.calls.map(call => call[0])).toContain(`${prefix}/news/new-story/`);
    expect(boundary.transaction.mock.invocationCallOrder[0]).toBeLessThan(boundary.tag.mock.invocationCallOrder[0]!);
  });
  it('does not save or refresh an unauthorized request', async () => {
    expect((await POST(request('en', false))).status).toBe(401);
    expect(boundary.transaction).not.toHaveBeenCalled();
    expect(boundary.tag).not.toHaveBeenCalled();
  });
});
