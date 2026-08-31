import { describe, expect, it } from 'vitest';

import {
  SEOUL_RENT_CHECK_DISTRICTS,
  getSeoulDistrictBySlug,
} from '../src/districts';

describe('Seoul public district catalog', () => {
  it('owns exactly 25 unique route identities in legal-code order', () => {
    expect(SEOUL_RENT_CHECK_DISTRICTS).toHaveLength(25);
    expect(SEOUL_RENT_CHECK_DISTRICTS[0]).toEqual({
      lawdCd: '11110',
      slug: 'jongno-gu',
      nameEn: 'Jongno-gu',
      nameKo: '종로구',
    });
    expect(SEOUL_RENT_CHECK_DISTRICTS.at(-1)).toEqual({
      lawdCd: '11740',
      slug: 'gangdong-gu',
      nameEn: 'Gangdong-gu',
      nameKo: '강동구',
    });
    expect(new Set(SEOUL_RENT_CHECK_DISTRICTS.map(({ lawdCd }) => lawdCd)).size)
      .toBe(25);
    expect(new Set(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug)).size)
      .toBe(25);
    expect(SEOUL_RENT_CHECK_DISTRICTS.map(({ lawdCd }) => lawdCd))
      .toEqual([...SEOUL_RENT_CHECK_DISTRICTS]
        .map(({ lawdCd }) => lawdCd)
        .sort((left, right) => left.localeCompare(right)));
  });

  it('resolves only canonical public slugs', () => {
    expect(getSeoulDistrictBySlug('gangnam-gu')).toEqual({
      lawdCd: '11680',
      slug: 'gangnam-gu',
      nameEn: 'Gangnam-gu',
      nameKo: '강남구',
    });
    expect(getSeoulDistrictBySlug('Gangnam-gu')).toBeNull();
    expect(getSeoulDistrictBySlug('unknown-gu')).toBeNull();
  });
});
