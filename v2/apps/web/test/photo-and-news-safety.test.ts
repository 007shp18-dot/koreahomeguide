import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { isTrustedGooglePlaceMatch } from '../components/maps/google-place-photo';
import {
  NAVER_NEWS_API_HEADER_NAMES,
  NAVER_NEWS_API_URL,
  plainNewsText,
} from '../lib/news/naver-news.server';

describe('photo and external-news safety', () => {
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
