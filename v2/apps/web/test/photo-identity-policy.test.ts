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
      policyVersion: 'photo-identity-v2',
      evidence: ['name', 'country', 'postal-code'],
    });
  });

  it('auto-approves an exact name and exact Singapore street address without coordinates', () => {
    expect(scorePhotoIdentity({
      market: 'singapore',
      canonicalName: '10 Evelyn',
      aliases: [],
      address: '10 Evelyn Road, Singapore',
      postalCode: null,
      entityLocation: null,
      providerName: '10 Evelyn',
      providerAddress: '10 Evelyn Rd, Singapore',
      providerLocation: null,
      hasPhoto: true,
    })).toEqual({
      disposition: 'auto-approve',
      confidence: 0.97,
      policyVersion: 'photo-identity-v2',
      evidence: ['name', 'country', 'address'],
    });
  });

  it('auto-approves an exact name and nearby provider coordinates despite address formatting differences', () => {
    expect(scorePhotoIdentity({
      market: 'seoul',
      canonicalName: '래미안원베일리',
      aliases: [],
      address: '서울특별시 서초구 반포동',
      postalCode: null,
      entityLocation: { latitude: 37.5065, longitude: 127.0006 },
      providerName: '래미안원베일리',
      providerAddress: '대한민국 서울특별시 서초구 신반포로 333',
      providerLocation: { latitude: 37.5068, longitude: 127.0009 },
      hasPhoto: true,
    })).toMatchObject({
      disposition: 'auto-approve',
      confidence: 0.98,
      policyVersion: 'photo-identity-v2',
      evidence: ['name', 'country', 'distance<=250m'],
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
      confidence: 0.98,
      evidence: ['name', 'country', 'distance<=250m'],
    });
  });

  it('auto-approves an exact Seoul name with matching district and neighborhood', () => {
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
    })).toMatchObject({
      disposition: 'auto-approve',
      confidence: 0.97,
      evidence: ['name', 'country', 'address'],
    });
  });

  it('keeps a district-only Seoul address match in review', () => {
    expect(scorePhotoIdentity({
      market: 'seoul',
      canonicalName: '래미안원베일리',
      aliases: [],
      address: '서울특별시 서초구',
      postalCode: null,
      entityLocation: null,
      providerName: '래미안원베일리',
      providerAddress: '대한민국 서울특별시 서초구',
      providerLocation: null,
      hasPhoto: true,
    })).toMatchObject({ disposition: 'review', confidence: 0.75 });
  });

  it('rejects a conflicting street number instead of auto-approving a name match', () => {
    expect(scorePhotoIdentity({
      market: 'singapore',
      canonicalName: '10 Evelyn',
      aliases: [],
      address: '10 Evelyn Road, Singapore',
      postalCode: null,
      entityLocation: null,
      providerName: '10 Evelyn',
      providerAddress: '11 Evelyn Road, Singapore',
      providerLocation: null,
      hasPhoto: true,
    })).toMatchObject({ disposition: 'reject', evidence: ['address-number-conflict'] });
  });

  it('rejects a conflicting Singapore postal code', () => {
    expect(scorePhotoIdentity({
      market: 'singapore',
      canonicalName: 'RIVERGATE',
      aliases: [],
      address: '99 ROBERTSON QUAY SINGAPORE 238258',
      postalCode: '238258',
      entityLocation: null,
      providerName: 'RiverGate',
      providerAddress: '99 Robertson Quay, Singapore 238259',
      providerLocation: null,
      hasPhoto: true,
    })).toMatchObject({ disposition: 'reject', evidence: ['postal-code-conflict'] });
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
