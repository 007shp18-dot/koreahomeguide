import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { scorePhotoIdentity } from '../lib/photos/photo-identity-policy';

describe('photo identity policy', () => {
  it('auto-approves an exact name and Singapore postal-code match', () => {
    expect(scorePhotoIdentity({
      market: 'singapore',
      canonicalName: 'RIVERGATE',
      aliases: [],
      address: '99 ROBERTSON QUAY SINGAPORE 238258',
      postalCode: '238258',
      entityLocation: null,
      providerName: 'RiverGate',
      providerAddress: '99 Robertson Quay, Singapore 238258',
      providerLocation: null,
      hasPhoto: true,
    })).toEqual({
      disposition: 'auto-approve',
      confidence: 1,
      policyVersion: 'photo-identity-v1',
      evidence: ['name', 'country', 'postal-code'],
    });
  });

  it('auto-approves a name and locality match within 250 metres', () => {
    expect(scorePhotoIdentity({
      market: 'seoul',
      canonicalName: '개포래미안포레스트',
      aliases: [],
      address: '서울특별시 강남구 개포동',
      postalCode: null,
      entityLocation: { latitude: 37.4803, longitude: 127.0542 },
      providerName: '개포래미안포레스트',
      providerAddress: '대한민국 서울특별시 강남구 개포동',
      providerLocation: { latitude: 37.4807, longitude: 127.0547 },
      hasPhoto: true,
    })).toMatchObject({
      disposition: 'auto-approve',
      confidence: 0.95,
      evidence: ['name', 'country', 'locality', 'distance<=250m'],
    });
  });

  it('keeps name and locality matches in review without independent location evidence', () => {
    expect(scorePhotoIdentity({
      market: 'seoul',
      canonicalName: '래미안원베일리',
      aliases: [],
      address: '서울특별시 서초구 반포동',
      postalCode: null,
      entityLocation: null,
      providerName: '래미안 원베일리',
      providerAddress: '서울특별시 서초구 반포동',
      providerLocation: null,
      hasPhoto: true,
    })).toMatchObject({ disposition: 'review', confidence: 0.75 });
  });

  it('rejects a country conflict and a result without photos', () => {
    expect(scorePhotoIdentity({
      market: 'singapore',
      canonicalName: 'The Interlace',
      aliases: [],
      address: 'Depot Road, Singapore',
      postalCode: null,
      entityLocation: null,
      providerName: 'The Interlace',
      providerAddress: 'London, United Kingdom',
      providerLocation: null,
      hasPhoto: true,
    })).toMatchObject({ disposition: 'reject', evidence: ['country-conflict'] });

    expect(scorePhotoIdentity({
      market: 'singapore',
      canonicalName: 'The Interlace',
      aliases: [],
      address: 'Depot Road, Singapore',
      postalCode: null,
      entityLocation: null,
      providerName: 'The Interlace',
      providerAddress: 'Depot Road, Singapore',
      providerLocation: null,
      hasPhoto: false,
    })).toMatchObject({ disposition: 'reject', evidence: ['missing-photo'] });
  });
});
