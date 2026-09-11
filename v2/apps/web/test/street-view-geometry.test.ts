import { describe, expect, it } from 'vitest';
import { streetViewGeometry } from '../components/maps/street-view-geometry';

describe('street view building direction', () => {
  const camera = { latitude: 1.28, longitude: 103.85 };
  it('faces north, east, south and west towards the building', () => {
    for (const [latitude, longitude, heading] of [[1.2801, 103.85, 0], [1.28, 103.8501, 90], [1.2799, 103.85, 180], [1.28, 103.8499, 270]]) {
      expect(streetViewGeometry(camera, { latitude: latitude!, longitude: longitude! }, 50)?.heading).toBeCloseTo(heading!, 2);
    }
  });
  it('rejects remote, coincident and invalid locations rather than facing a random direction', () => {
    expect(streetViewGeometry(camera, { latitude: 1.29, longitude: 103.85 }, 150)).toBeNull();
    expect(streetViewGeometry(camera, camera, 50)).toBeNull();
    expect(streetViewGeometry(camera, { latitude: NaN, longitude: 103.85 }, 50)).toBeNull();
    expect(streetViewGeometry(camera, { latitude: 91, longitude: 103.85 }, 50)).toBeNull();
  });
});
