import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import * as naverImageSearch from '../lib/photos/naver-image-search.server';

const { searchNaverBuildingImages } = naverImageSearch;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('NAVER building image search', () => {
  it('selects a clear, high-resolution building candidate while retaining rights review', () => {
    type Selector = (input: Readonly<{
      buildingName: string;
      candidates: readonly naverImageSearch.NaverImageCandidate[];
    }>) => Readonly<{
      candidate: naverImageSearch.NaverImageCandidate;
      confidence: number;
      evidence: readonly string[];
    }> | null;
    const select = (naverImageSearch as typeof naverImageSearch & {
      selectNaverBuildingImageCandidate?: Selector;
    }).selectNaverBuildingImageCandidate;
    expect(select).toBeTypeOf('function');
    if (select === undefined) return;
    const result = select({
      buildingName: 'Burj Khalifa',
      candidates: [{
        title: 'Dubai skyline panorama',
        temporaryImageUrl: 'https://images.example.com/skyline.jpg',
        temporaryThumbnailUrl: 'https://images.example.com/skyline-thumb.jpg',
        sourceDocumentUrl: 'https://images.example.com/skyline.jpg',
        width: 3200,
        height: 1800,
      }, {
        title: 'Burj Khalifa exterior',
        temporaryImageUrl: 'https://images.example.com/burj.jpg',
        temporaryThumbnailUrl: 'https://images.example.com/burj-thumb.jpg',
        sourceDocumentUrl: 'https://images.example.com/burj.jpg',
        width: 2400,
        height: 1600,
      }],
    });
    expect(result).toMatchObject({
      candidate: { temporaryImageUrl: 'https://images.example.com/burj.jpg' },
      confidence: 0.65,
      evidence: ['name', 'address-in-search-query', 'rights-review-required'],
    });
  });

  it('queries NAVER API HUB without HTTP caching and returns normalized candidate metadata', async () => {
    vi.stubEnv('NAVER_API_HUB_CLIENT_ID', 'api-hub-client');
    vi.stubEnv('NAVER_API_HUB_CLIENT_SECRET', 'api-hub-secret');
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
    expect(url).toContain('https://naverapihub.apigw.ntruss.com/search/v1/image');
    expect(url).toContain('display=100');
    expect(new URL(url).searchParams.get('query')).toBe('개포래미안포레스트 서울특별시 강남구 개포동');
    expect(init).toMatchObject({ cache: 'no-store' });
    expect(new Headers(init.headers).get('X-NCP-APIGW-API-KEY-ID')).toBe('api-hub-client');
    expect(new Headers(init.headers).get('X-NCP-APIGW-API-KEY')).toBe('api-hub-secret');
    expect(new Headers(init.headers).has('X-Naver-Client-Id')).toBe(false);
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

  it('keeps the legacy NAVER Search endpoint available for existing applications', async () => {
    vi.stubEnv('NAVER_SEARCH_CLIENT_ID', 'legacy-client');
    vi.stubEnv('NAVER_SEARCH_CLIENT_SECRET', 'legacy-secret');
    const providerFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', providerFetch);

    await searchNaverBuildingImages({ buildingName: 'A', address: 'B' });

    const [url, init] = providerFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://openapi.naver.com/v1/search/image');
    expect(new Headers(init.headers).get('X-Naver-Client-Id')).toBe('legacy-client');
    expect(new Headers(init.headers).get('X-Naver-Client-Secret')).toBe('legacy-secret');
  });

  it('falls back to existing NAVER credentials and reports provider failures safely', async () => {
    vi.stubEnv('NAVER_NEWS_CLIENT_ID', 'existing-client');
    vi.stubEnv('NAVER_NEWS_CLIENT_SECRET', 'existing-secret');
    const providerFetch = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    vi.stubGlobal('fetch', providerFetch);

    await expect(searchNaverBuildingImages({
      buildingName: 'RiverGate', address: '99 Robertson Quay, Singapore', display: 0,
    })).resolves.toEqual({ state: 'provider-error', candidates: [], reason: 'http-429' });
    const [url, init] = providerFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://naverapihub.apigw.ntruss.com/search/v1/image');
    expect(new Headers(init.headers).get('X-NCP-APIGW-API-KEY-ID')).toBe('existing-client');
  });

  it('does not call the provider without both credentials', async () => {
    const providerFetch = vi.fn();
    vi.stubGlobal('fetch', providerFetch);
    await expect(searchNaverBuildingImages({ buildingName: 'A', address: 'B' }))
      .resolves.toEqual({ state: 'not-configured', candidates: [] });
    expect(providerFetch).not.toHaveBeenCalled();
  });
});
