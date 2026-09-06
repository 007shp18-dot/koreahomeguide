import { describe, expect, it } from 'vitest';
import { svy21ToWgs84, resolveUraProjectLocation } from '../lib/singapore/project-location';

describe('URA project coordinates', () => {
  it('maps the SLA false origin and a published SVY21 reference pair', () => {
    const origin = svy21ToWgs84(28001.642, 38744.572)!;
    expect(origin.latitude).toBeCloseTo(1 + 22 / 60, 7);
    expect(origin.longitude).toBeCloseTo(103 + 50 / 60, 7);
    const reference = svy21ToWgs84(21362.157043860374, 30811.26429645264)!;
    expect(reference.latitude).toBeCloseTo(1.2949192688485278, 5);
    expect(reference.longitude).toBeCloseTo(103.77367436885834, 5);
  });
  it('rejects absent, invalid and conflicting project coordinates', () => {
    expect(svy21ToWgs84(null, null)).toBeNull();
    expect(svy21ToWgs84(Infinity, 0)).toBeNull();
    expect(svy21ToWgs84(999999, 999999)).toBeNull();
    expect(resolveUraProjectLocation([{ x: 28001.642, y: 38744.572 }, { x: 48001.642, y: 38744.572 }])).toBeNull();
    expect(resolveUraProjectLocation([{ x: null, y: null }, { x: 28001.642, y: 38744.572 }])).toMatchObject({ provider: 'URA', latitude: expect.any(Number), longitude: expect.any(Number) });
  });
});
