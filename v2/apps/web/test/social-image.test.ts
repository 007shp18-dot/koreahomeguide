import { afterEach, expect, it, vi } from 'vitest';
import { signedPriceSocialImage } from '../lib/social-image';
import { fileURLToPath } from 'node:url';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each(['..', '../../..'])('renders the Korean share image offline from %s', async (root) => {
  const originalFetch = globalThis.fetch;
  const externalFetch = vi.fn().mockRejectedValue(new Error('External font service unavailable'));
  vi.stubGlobal('fetch', (input: Parameters<typeof fetch>[0], init?: RequestInit) =>
    String(input).startsWith('data:') ? originalFetch(input, init) : externalFetch(input, init));
  vi.spyOn(process, 'cwd').mockReturnValue(fileURLToPath(new URL(root, import.meta.url)));
  const response = await signedPriceSocialImage('ko');
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(externalFetch).not.toHaveBeenCalled();
});
