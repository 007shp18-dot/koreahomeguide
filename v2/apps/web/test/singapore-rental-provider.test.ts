import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { parseUraPrivateRentalEnvelope, requestUraJson } from '../lib/market-data/singapore-collector.server';
afterEach(() => vi.unstubAllGlobals());
describe('URA rental upstream failures', () => {
  it('distinguishes an explicit provider failure from an invalid successful schema', () => {
    let failure: unknown;
    try { parseUraPrivateRentalEnvelope({ Status: 'Failure', Message: 'Provider unavailable', Result: [] }, '26q3'); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(Error);
    expect(failure).not.toBeInstanceOf(TypeError);
    expect(() => parseUraPrivateRentalEnvelope({ Status: 'Success', Message: '', Result: [] }, '26q3')).toThrow(TypeError);
  });
  it('retries one transient server error and returns the next response', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(Response.json({ Status: 'Success' }));
    vi.stubGlobal('fetch', fetcher);
    expect(await requestUraJson('https://eservice.ura.gov.sg/test', {})).toEqual({ Status: 'Success' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('bounds network retries at two requests', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('Network unavailable'));
    vi.stubGlobal('fetch', fetcher);
    await expect(requestUraJson('https://eservice.ura.gov.sg/test', {})).rejects.toThrow('URA provider request failed.');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it.each([401, 403, 429])('does not retry HTTP %s', async status => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status }));
    vi.stubGlobal('fetch', fetcher);
    await expect(requestUraJson('https://eservice.ura.gov.sg/test', {})).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not retry a JSON provider failure or invalid successful JSON', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ Status: 'Failure' })).mockResolvedValueOnce(new Response('invalid-json'));
    vi.stubGlobal('fetch', fetcher);
    expect(await requestUraJson('https://eservice.ura.gov.sg/test', {})).toEqual({ Status: 'Failure' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await expect(requestUraJson('https://eservice.ura.gov.sg/test', {})).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
