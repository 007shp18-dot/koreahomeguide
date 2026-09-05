import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { findGooglePlacePhoto, isTrustedGooglePlaceMatch } from '../components/maps/google-place-photo';
import {
  NAVER_NEWS_API_HEADER_NAMES,
  NAVER_NEWS_API_URL,
  plainNewsText,
} from '../lib/news/naver-news.server';

describe('photo and external-news safety', () => {
  it('uses the approved place ID even when its translated name differs', async () => {
    const photo = { getURI: () => 'https://photos.example.test/building.jpg', authorAttributions: [] };
    class Place {
      photos: readonly typeof photo[] = [];
      constructor(readonly options: { id: string }) {}
      async fetchFields(request: { fields: readonly string[] }) {
        if (this.options.id !== 'approved-building' || !request.fields.includes('photos')) throw new Error('Wrong request');
        this.photos = [photo];
      }
      static async searchByText(): Promise<{ places: readonly [] }> { throw new Error('Approved IDs must not be searched again'); }
    }
    const result = await findGooglePlacePhoto(Place, 'approved-building', 'Translated name', '');
    expect(result?.getURI({ maxHeight: 900, maxWidth: 1400 })).toBe('https://photos.example.test/building.jpg');
  });

  it('rejects unrelated text-search results without a prior place approval', async () => {
    class Place {
      async fetchFields() {}
      static async searchByText() {
        return { places: [{ id: 'landmark', displayName: 'Nearby park', formattedAddress: 'Seoul',
          photos: [{ getURI: () => 'https://photos.example.test/park.jpg', authorAttributions: [] }] }] };
      }
    }
    expect(await findGooglePlacePhoto(Place, null, 'Evidence Tower', 'Seoul')).toBeNull();
  });

  it('accepts an agreeing place identity and rejects unrelated streetscapes', () => {
    expect(isTrustedGooglePlaceMatch('래미안 원베일리', '래미안 원베일리')).toBe(true);
    expect(isTrustedGooglePlaceMatch('Marina Gate Residences', 'Marina Gate')).toBe(true);
    expect(isTrustedGooglePlaceMatch('Gangnam-daero street', '래미안 원베일리')).toBe(false);
  });

  it('removes Naver highlight tags and decodes common entities', () => {
    expect(plainNewsText('<b>서울</b> 아파트 &amp; 주택')).toBe('서울 아파트 & 주택');
  });

  it('uses the Naver Cloud API Hub endpoint and authentication headers', () => {
    expect(NAVER_NEWS_API_URL).toBe('https://naverapihub.apigw.ntruss.com/search/v1/news');
    expect(NAVER_NEWS_API_HEADER_NAMES).toEqual({
      clientId: 'X-NCP-APIGW-API-KEY-ID',
      clientSecret: 'X-NCP-APIGW-API-KEY',
    });
  });
});
