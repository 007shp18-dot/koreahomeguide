import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { selectPublishedBuildingPhoto } from '../lib/photos/published-photo-selection';
import { ProjectedEntityMedia } from '../components/public-market/projected-entity-media';
import type { PublicEntityMedia } from '../lib/public-data/entity-media-projection.server';
import type { StoredPublicPhotoApproval } from '../lib/photos/building-photo-store.server';

vi.mock('next/script', () => ({ default: () => null }));
const previous: PublicEntityMedia = {
  entityId: 'sg-singapore:project:example', mediaAssetId: '1', role: 'hero', position: 0,
  displayUrl: 'https://images.example/previous.jpg', providerReference: null,
  width: null, height: null, focalX: null, focalY: null,
  attributionName: 'Photographer', attributionUrl: 'https://license.example/by',
  sourcePageUrl: 'https://source.example/file', exactSubject: true,
  publishedAt: '2026-09-08T00:00:00Z', lastCheckedAt: '2026-09-08T00:00:00Z',
};
const replacement: StoredPublicPhotoApproval = {
  buildingKey: 'singapore:project:example',
  provider: 'licensed-url', subjectKind: 'building-exterior', placeId: null,
  assetUrl: 'https://images.example/replacement.jpg', attributionName: 'New photographer',
  attributionUrl: 'https://license.example/by-sa', sourcePageUrl: 'https://source.example/new-file',
  buildingName: 'Example', address: 'Example street', approvedAt: '2026-09-09T00:00:00Z',
};

describe('published building photographs', () => {
  it('does not reuse a name-based registry approval on a different canonical building', () => {
    expect(selectPublishedBuildingPhoto([], replacement, 'singapore:project:other')).toBeNull();
    expect(selectPublishedBuildingPhoto([], replacement, 'singapore:project:example')?.displayUrl).toBe(replacement.assetUrl);
  });
  it('uses a newer replacement immediately without waiting for the projection refresh', () => {
    expect(selectPublishedBuildingPhoto([previous], replacement)).toMatchObject({
      displayUrl: replacement.assetUrl, sourcePageUrl: replacement.sourcePageUrl, relationship: 'exact',
    });
    expect(selectPublishedBuildingPhoto([previous], { ...replacement, approvedAt: '2026-09-01T00:00:00Z' })?.displayUrl).toBe(previous.displayUrl);
  });

  it('keeps aerial context distinct and prevents map-only approvals becoming photographs', () => {
    expect(selectPublishedBuildingPhoto([], { ...replacement, subjectKind: 'site-aerial' })?.relationship).toBe('parent');
    expect(selectPublishedBuildingPhoto([previous], { ...replacement, subjectKind: 'map-only' })).toBeNull();
  });

  it('renders image credits and the source file separately underneath the image', () => {
    const html = renderToStaticMarkup(<ProjectedEntityMedia buildingName="Example" media={selectPublishedBuildingPhoto([previous])} />);
    expect(html.indexOf('<figcaption')).toBeGreaterThan(html.indexOf('<img'));
    expect(html).toContain('href="https://license.example/by"');
    expect(html).toContain('href="https://source.example/file"');
    expect(html).toContain('Photo source');
  });

  it('uses a compact location fallback when a building has no approved image', () => {
    const html = renderToStaticMarkup(<ProjectedEntityMedia locale="ko" buildingName="Example" media={null} fallbackMarket="singapore" />);
    expect(html).not.toContain('curated-market-photo');
    expect(html).toContain('data-location-fallback="true"');
    expect(html).toContain('지도에서 위치 확인');
    expect(html).not.toContain('<img');
  });
});
