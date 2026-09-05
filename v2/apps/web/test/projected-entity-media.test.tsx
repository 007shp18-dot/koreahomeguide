import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ProjectedEntityMedia } from '../components/public-market/projected-entity-media';

describe('projected entity media', () => {
  it('renders an approved direct projection without a runtime lookup', () => {
    const html = renderToStaticMarkup(<ProjectedEntityMedia
      buildingName="Evidence Tower"
      media={{
        displayUrl: '/assets/buildings/evidence-tower.jpg', width: 1600, height: 900,
        focalX: 0.4, focalY: 0.6, attributionName: 'SignedPrice editorial',
        attributionUrl: null,
      }}
    />);

    expect(html).toContain('data-building-media="public-projection"');
    expect(html).toContain('src="/assets/buildings/evidence-tower.jpg"');
    expect(html).toContain('SignedPrice editorial');
    expect(html).not.toContain('/api/building-photo');
  });

  it('states the publication boundary when no direct media is approved', () => {
    const html = renderToStaticMarkup(<ProjectedEntityMedia
      buildingName="Evidence Tower"
      media={null}
    />);

    expect(html).toContain('data-building-media="location-only"');
    expect(html).toContain('No exact-property photo is approved');
  });
});
