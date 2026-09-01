import { describe, expect, it } from 'vitest';

import {
  buildingDecisionHref,
  parseBuildingDecisionSelection,
} from '../lib/public-market/building-decision-state';

describe('building decision state', () => {
  it('defaults to Overview and New and rejects arrays or unknown values', () => {
    expect(parseBuildingDecisionSelection({})).toEqual({ mode: 'overview', contract: 'new' });
    expect(parseBuildingDecisionSelection({ mode: 'rent', contract: 'all' }))
      .toEqual({ mode: 'rent', contract: 'all' });
    expect(parseBuildingDecisionSelection({ mode: ['rent'], contract: 'renewal' }))
      .toEqual({ mode: 'overview', contract: 'renewal' });
    expect(parseBuildingDecisionSelection({ mode: 'forecast', contract: 'mixed' }))
      .toEqual({ mode: 'overview', contract: 'new' });
  });

  it('keeps the canonical building path and omits default query values', () => {
    const base = '/kr/seoul/explore/gangnam-gu/evidence-tower/';
    expect(buildingDecisionHref({ base, mode: 'overview', contract: 'new' })).toBe(base);
    expect(buildingDecisionHref({ base, mode: 'rent', contract: 'new' }))
      .toBe(`${base}?mode=rent`);
    expect(buildingDecisionHref({ base, mode: 'rent', contract: 'renewal' }))
      .toBe(`${base}?mode=rent&contract=renewal`);
  });
});
