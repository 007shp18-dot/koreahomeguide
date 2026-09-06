import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { searchNaverBuildingImages } from '../lib/photos/naver-image-search.server';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('NAVER building image search', () => {
  it('queries the official endpoint without caching or persisting provider payloads', async () => {
    vi.stubEnv('NAVER_SEARCH_CLIENT_ID', 'search-client');
    vi.stubEnv('NAVER_SEARCH_CLIENT_SECRET', 'search-secret');
    const providerFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{
        title: '<b>개포래미안포레스트</b> 외관',
        link: 'https://images.example.com/full.jpg',
        thumbnail: 'https://images.example.com/thumb.jpg',
        sizewidth: '1600',
        sizeheight: '1000',
      }, {
        title: 'unsafe',
        link: 'http://images.example.com/plain.jpg',
        thumbnail: 'https://images.example.com/thumb-2.jpg',
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', providerFetch);

    const result = await searchNaverBuildingImages({
      buildingName: '개포래미안포레스트',
      address: '서울특별시 강남구 개포동',
      display: 200,
    });

    expect(providerFetch).toHaveBeenCalledOnce();
    const [url, init] = providerFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://openapi.naver.com/v1/search/image');
    expect(url).toContain('display=100');
    expect(new URL(url).searchParams.get('query')).toBe('개포래미안포레스트 서울특별시 강남구 개포동');
    expect(init).toMatchObject({ cache: 'no-store' });
    expect(new Headers(init.headers).get('X-Naver-Client-Id')).toBe('search-client');
    expect(result).toEqual({
      state: 'ready',
      candidates: [{
        title: '개포래미안포레스트 외관',
        temporaryImageUrl: 'https://images.example.com/full.jpg',
        temporaryThumbnailUrl: 'https://images.example.com/thumb.jpg',
        sourceDocumentUrl: 'https://images.example.com/full.jpg',
        width: 1600,
        height: 1000,
      }],
    });
  });

  it('falls back to existing NAVER credentials and reports provider failures safely', async () => {
    vi.stubEnv('NAVER_NEWS_CLIENT_ID', 'existing-client');
    vi.stubEnv('NAVER_NEWS_CLIENT_SECRET', 'existing-secret');
    const providerFetch = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    vi.stubGlobal('fetch', providerFetch);

    await expect(searchNaverBuildingImages({
      buildingName: 'RiverGate', address: '99 Robertson Quay, Singapore', display: 0,
    })).resolves.toEqual({ state: 'provider-error', candidates: [] });
    const [, init] = providerFetch.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get('X-Naver-Client-Id')).toBe('existing-client');
  });

  it('does not call the provider without both credentials', async () => {
    const providerFetch = vi.fn();
    vi.stubGlobal('fetch', providerFetch);
    await expect(searchNaverBuildingImages({ buildingName: 'A', address: 'B' }))
      .resolves.toEqual({ state: 'not-configured', candidates: [] });
    expect(providerFetch).not.toHaveBeenCalled();
  });
});
