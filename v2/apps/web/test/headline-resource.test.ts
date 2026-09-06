import { expect, it, vi } from 'vitest';
import { createHeadlineResource } from '../lib/news/headline-resource';
it('shares concurrent requests and reuses results until expiry', async () => {
  let now = 0;
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ items: [], naverState: 'ready' })));
  const resource = createHeadlineResource(fetcher, () => now);
  const first = resource.load();
  expect(resource.load()).toBe(first);
  await first; await resource.load(); expect(fetcher).toHaveBeenCalledTimes(1);
  now = 900001; await resource.load(); expect(fetcher).toHaveBeenCalledTimes(2);
  await resource.load(true); expect(fetcher).toHaveBeenCalledTimes(3);
});
it('retains a loaded snapshot when refresh fails and permits retry', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({items: [], naverState: 'ready'})))
    .mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response(JSON.stringify({items: [], naverState: 'ready'})));
  const resource = createHeadlineResource(fetcher);
  const model = await resource.load(); await expect(resource.load(true)).rejects.toThrow('offline');
  expect(resource.peek()).toBe(model); await resource.load(true); expect(fetcher).toHaveBeenCalledTimes(3);
});
