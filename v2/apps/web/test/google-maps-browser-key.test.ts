import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleMapsBrowserKeyFromEnvironment } from '../lib/maps/google-maps-browser-key.server';

afterEach(() => vi.unstubAllEnvs());

describe('Google browser map credentials', () => {
  it('uses the browser-restricted key even when a server photo key is configured', () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'server-photo-key');
    vi.stubEnv('GOOGLE_MAPS_BROWSER_KEY', ' browser-map-key ');
    expect(googleMapsBrowserKeyFromEnvironment()).toBe('browser-map-key');
  });

  it('does not expose the server photo key when no browser key is configured', () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'server-photo-key');
    vi.stubEnv('GOOGLE_MAPS_BROWSER_KEY', '');
    expect(googleMapsBrowserKeyFromEnvironment()).toBeNull();
  });
});
