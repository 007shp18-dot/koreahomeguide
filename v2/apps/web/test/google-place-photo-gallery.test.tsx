import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/script', () => ({ default: () => null }));

import { GooglePlacePhoto, findGooglePlacePhotos, photoApprovalLabel } from '../components/maps/google-place-photo';

describe('approved Google place photo gallery', () => {
  it('returns no more than five live photos with their author credits', async () => {
    const photos = Array.from({ length: 7 }, (_, index) => ({
      getURI: () => `https://photos.example.test/${index + 1}.jpg`,
      authorAttributions: [{ displayName: `Photographer ${index + 1}`, uri: `https://maps.google.com/author/${index + 1}` }],
    }));
    class Place {
      photos: readonly typeof photos[number][] = [];
      constructor(readonly options: { id: string }) {}
      async fetchFields(request: { fields: readonly string[] }) {
        expect(this.options.id).toBe('place-1');
        expect(request.fields).toEqual(['photos']);
        this.photos = photos;
      }
      static searchByText = vi.fn();
    }

    const result = await findGooglePlacePhotos(Place, 'place-1', 12);

    expect(result).toHaveLength(5);
    expect(result[0]?.authorAttributions[0]).toEqual({
      displayName: 'Photographer 1', uri: 'https://maps.google.com/author/1',
    });
    expect(Place.searchByText).not.toHaveBeenCalled();
  });

  it('requires a server-approved place ID', async () => {
    class Place {
      photos = [];
      constructor(options: { id: string }) { void options; }
      async fetchFields() {}
      static searchByText = vi.fn();
    }
    await expect(findGooglePlacePhotos(Place, null)).resolves.toEqual([]);
    expect(Place.searchByText).not.toHaveBeenCalled();
  });

  it('labels estate context separately from an exact building photograph', () => {
    expect(photoApprovalLabel('site-aerial', 'licensed-url')).toBe('Verified project or estate photograph');
    expect(photoApprovalLabel('building-exterior', 'licensed-url')).toBe('Verified building photograph');
    expect(photoApprovalLabel('building-exterior', 'google-place')).toBe('Verified place photos');
  });
});

it('uses a corrected loading label without changing source identity props', () => {
  const html = renderToStaticMarkup(<GooglePlacePhoto browserKey="test" buildingName={"ENCHANT\uFFFD"} displayBuildingName="ENCHANTÉ" address="EVELYN ROAD" registryKey="source-key" fallback={<p>No photo</p>} />);
  expect(html).toContain('ENCHANTÉ');
  expect(html).not.toContain('\uFFFD');
});
