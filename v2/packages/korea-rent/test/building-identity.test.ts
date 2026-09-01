import { describe, expect, it } from 'vitest';

import { buildKoreaBuildingIdentity } from '../src';

describe('Korea building identity', () => {
  it('normalizes official names while preserving the installed apartment ID contract', () => {
    expect(buildKoreaBuildingIdentity({
      districtSlug: 'gangnam-gu',
      legalDong: '  대치동 ',
      buildingLabel: ' 래미안   대치팰리스 ',
      sourceHousingType: 'apartment',
    })).toEqual({
      buildingId: 'gangnam-gu-9lowgq',
      districtSlug: 'gangnam-gu',
      neighborhoodId: 'gangnam-gu-dong-3ta0ic',
      neighborhoodName: '대치동',
      buildingName: '래미안 대치팰리스',
      housingType: 'apartment',
    });
  });

  it.each([
    ['officetel', 'officetel'],
    ['villa', 'villa_multifamily'],
    ['detached', 'detached'],
  ] as const)('maps %s into the canonical %s housing type', (sourceHousingType, housingType) => {
    expect(buildKoreaBuildingIdentity({
      districtSlug: 'jongno-gu',
      legalDong: '청운동',
      buildingLabel: '검증타워',
      sourceHousingType,
    })).toMatchObject({ housingType });
  });

  it.each([
    { legalDong: undefined, buildingLabel: '검증타워' },
    { legalDong: '청운동', buildingLabel: undefined },
    { legalDong: '  ', buildingLabel: '검증타워' },
    { legalDong: '청운동', buildingLabel: '  ' },
  ])('refuses an incomplete stable identity', ({ legalDong, buildingLabel }) => {
    expect(buildKoreaBuildingIdentity({
      districtSlug: 'jongno-gu',
      legalDong,
      buildingLabel,
      sourceHousingType: 'apartment',
    })).toBeNull();
  });
});
