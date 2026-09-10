import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const state = vi.hoisted(() => ({
  rows: [] as readonly Record<string, unknown>[],
  sql: [] as string[],
  search: vi.fn(),
}));

vi.mock('../lib/db/postgres.server', () => ({
  contentDatabase: () => async (parts: TemplateStringsArray) => {
    const query = parts.join('?');
    state.sql.push(query);
    return query.includes('FROM buildings') ? state.rows : [];
  },
}));
vi.mock('../lib/photos/naver-image-search.server', () => ({
  searchNaverBuildingImages: state.search,
}));

import { GET } from '../app/api/internal/naver-image-candidates/route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  state.rows = [];
  state.sql.length = 0;
});

function request(buildingKey: string, token = 'admin-secret') {
  return new Request(`https://example.com/api/internal/naver-image-candidates?buildingKey=${buildingKey}`, {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe('private NAVER image candidate route', () => {
  it('returns live candidates without writing thumbnails to building_photos', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'admin-secret');
    state.rows = [{
      key: 'seoul:building:1', market_key: 'seoul', official_name: '개포래미안포레스트',
      address: '서울특별시 강남구 개포동', identity_status: 'verified',
    }];
    state.search.mockResolvedValue({
      state: 'ready',
      candidates: [{
        title: '개포래미안포레스트',
        temporaryImageUrl: 'https://images.example.com/full.jpg',
        temporaryThumbnailUrl: 'https://images.example.com/thumb.jpg',
        sourceDocumentUrl: 'https://source.example.com/article',
        width: 1600,
        height: 1000,
      }],
    });

    const response = await GET(request('seoul:building:1'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ state: 'ready', resultCount: 1 });
    expect(state.search).toHaveBeenCalledWith({
      buildingName: '개포래미안포레스트',
      address: '서울특별시 강남구 개포동',
      display: 20,
    });
    expect(state.sql.join('\n')).not.toContain('INSERT INTO building_photos');
    expect(state.sql.join('\n')).toContain('INSERT INTO building_enrichment_attempts');
  });

  it('rejects unauthorized, Dubai, and unverified building requests', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'admin-secret');
    expect((await GET(request('seoul:building:1', 'wrong'))).status).toBe(401);

    state.rows = [{ key: 'dubai:building:1', market_key: 'dubai', official_name: 'Tower', address: 'Dubai', identity_status: 'verified' }];
    expect((await GET(request('dubai:building:1'))).status).toBe(400);

    state.rows = [{ key: 'seoul:building:2', market_key: 'seoul', official_name: 'Unknown', address: 'Seoul', identity_status: 'ambiguous' }];
    expect((await GET(request('seoul:building:2'))).status).toBe(409);
    expect(state.search).not.toHaveBeenCalled();
  });
});
