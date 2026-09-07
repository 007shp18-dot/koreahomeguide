import { describe, expect, it } from 'vitest';
import { buildingDisplayLabel } from '../lib/public-market/building-display-label';

describe('source-backed building display labels', () => {
  const identity = { name: '(554-31)', neighborhoodName: '도봉동', districtSlug: 'dobong-gu' };
  it('identifies a lot rather than presenting its number as a building name', () => {
    expect(buildingDisplayLabel(identity, 'en')).toEqual({title:'Lot 554-31',location:'Dobong-gu · Dobong-dong · 도봉동 554-31',original:'도봉구 도봉동 554-31',isLot:true});
    expect(buildingDisplayLabel(identity, 'ko').title).toBe('도봉동 554-31');
  });
  it('preserves a reported name and distinguishes mountain lots', () => {
    expect(buildingDisplayLabel({...identity,name:'우성'},'en').title).toBe('우성');
    expect(buildingDisplayLabel({...identity,name:'(산12-3)'},'en').title).toBe('Mountain lot 12-3');
    expect(buildingDisplayLabel({...identity,name:'101동'},'ko').isLot).toBe(false);
  });
});
