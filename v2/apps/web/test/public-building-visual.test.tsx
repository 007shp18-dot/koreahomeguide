import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BuildingVisual } from '../components/public-market/building-visual';
import { buildBuildingVisualModel } from '../lib/public-market/building-visual-model';

describe('building visual', () => {
  it('fails closed when a licensed photo is not connected', () => {
    const model = buildBuildingVisualModel({
      buildingName: 'Evidence Tower',
      mapHref: '/kr/seoul/explore/?district=gangnam-gu',
      photo: null,
    });
    expect(model).toEqual({
      kind: 'unavailable',
      title: 'Verified building image is not available',
      reason: 'A rights-cleared building photo or provider render is not connected.',
      nextAction: {
        label: 'View this building area on the map',
        href: '/kr/seoul/explore/?district=gangnam-gu',
      },
    });
    const html = renderToStaticMarkup(<BuildingVisual model={model} />);
    expect(html).toContain('Verified building image is not available');
    expect(html).toContain('data-building-media="evidence-fallback"');
    expect(html).toContain('data-photo-state="unavailable"');
    expect(html).not.toContain('Reported');
    expect(html).not.toContain('Verified</span>');
    expect(html).not.toContain('Boundary shown');
    expect(html).not.toContain('<img');
  });

  it('accepts only a licensed same-origin building asset', () => {
    const model = buildBuildingVisualModel({
      buildingName: 'Evidence Tower',
      mapHref: '/kr/seoul/explore/?district=gangnam-gu',
      photo: {
        src: '/assets/buildings/evidence-tower.jpg',
        sourceLabel: 'Owner-authorized building photograph',
        rightsPolicyId: 'kr-building-photo-owner-v1',
      },
    });
    expect(model.kind).toBe('licensed_photo');
    const html = renderToStaticMarkup(<BuildingVisual model={model} />);
    expect(html).toContain('Owner-authorized building photograph');
    expect(html).toContain('Evidence Tower exterior');
  });

  it('rejects remote, hot-linked, or malformed photo records at runtime', () => {
    const model = buildBuildingVisualModel({
      buildingName: 'Evidence Tower',
      mapHref: '/kr/seoul/explore/?district=gangnam-gu',
      photo: {
        src: 'https://images.example.com/evidence-tower.jpg',
        sourceLabel: 'Unverified remote image',
        rightsPolicyId: 'unknown',
      } as never,
    });
    expect(model.kind).toBe('unavailable');
  });
});
