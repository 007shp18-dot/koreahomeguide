import { it, expect, vi } from 'vitest';
vi.mock('../lib/research/living-context.server', () => ({ loadLivingContexts: async () => ({ status: 'unavailable', profiles: [] }) }));
import { GET } from '../app/api/living-context/route';
it('represents unavailable optional research explicitly without a failed HTTP resource', async () => {
  const response = await GET(new Request('https://example.com/api/living-context/?entity=kr-seoul:estate:test'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'unavailable', profiles: [] });
  expect(response.headers.get('cache-control')).toBe('no-store');
});
it('rejects empty entity input', async () => {
  expect((await GET(new Request('https://example.com/api/living-context/?entity='))).status).toBe(400);
});
