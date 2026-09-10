import { describe, expect, it, vi } from 'vitest';
import { requestSingaporeExplore } from '../lib/singapore/explore-request';
describe('Singapore selection request recovery', () => {
  it('recovers a transient failure without asking the reader to click Retry', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(Response.json({ status: 'ready' }));
    expect(await requestSingaporeExplore('/api/singapore/explore/?region=CCR', new AbortController().signal, fetcher)).toEqual({ status: 'ready' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('bounds repeated failures and does not retry rejected filters', async () => {
    for (const status of [503, 400, 429]) {
      const fetcher = vi.fn().mockResolvedValue(new Response('', { status }));
      await expect(requestSingaporeExplore('/api/singapore/explore/', new AbortController().signal, fetcher)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(status === 503 ? 2 : 1);
    }
  });
  it('does not restart an old selection after it is aborted', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockImplementation(async () => { controller.abort(); throw new Error('aborted'); });
    await expect(requestSingaporeExplore('/api/singapore/explore/', controller.signal, fetcher)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
