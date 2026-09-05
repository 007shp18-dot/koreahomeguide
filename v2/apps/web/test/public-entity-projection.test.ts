import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildPublicEntityProjection,
  createPublicEntityProjectionReader,
  type PublicEntityProjectionReadPort,
} from '../lib/public-data/entity-location-projection.server';
import { selectPublicEntityMedia } from '../lib/public-data/entity-media-projection.server';
import {
  createPublicEntityProjectionPublisher,
  type PublicEntityProjectionSqlPort,
} from '../lib/public-data/entity-projection-publisher.server';
import type { PublicEntityLocation } from '../lib/public-data/public-evidence-types';

const verifiedLocation: PublicEntityLocation = Object.freeze({
  entityId: 'building-1',
  marketId: 'kr-seoul',
  latitude: 37.5665,
  longitude: 126.978,
  precision: 'rooftop',
  provider: 'official-address',
  providerReference: 'record-1',
  rightsPolicyId: 'kr-open-data',
  verificationStatus: 'verified',
  verifiedAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
});

describe('public entity projection', () => {
  it('rejects provisional coordinates and district centroids as building pins', () => {
    const provisional = buildPublicEntityProjection({
      entityId: 'building-1',
      entityKind: 'building',
      location: { ...verifiedLocation, verificationStatus: 'provisional' },
      media: [],
      evidenceReleaseId: 'release-1',
    });
    const centroid = buildPublicEntityProjection({
      entityId: 'building-1',
      entityKind: 'building',
      location: { ...verifiedLocation, precision: 'district-centroid' },
      media: [],
      evidenceReleaseId: 'release-1',
    });

    expect(provisional).toMatchObject({ state: 'location-unverified', location: null });
    expect(centroid).toMatchObject({ state: 'location-unverified', location: null });
  });

  it('retains a verified district centroid for district display only', () => {
    const projection = buildPublicEntityProjection({
      entityId: 'district-1',
      entityKind: 'district',
      location: { ...verifiedLocation, entityId: 'district-1', precision: 'district-centroid' },
      media: [],
      evidenceReleaseId: 'release-1',
    });

    expect(projection.state).toBe('ready');
    expect(projection.location?.precision).toBe('district-centroid');
    expect(Object.isFrozen(projection)).toBe(true);
  });

  it('publishes only approved, displayable media in deterministic order', () => {
    const media = selectPublicEntityMedia([
      {
        entityId: 'building-1', mediaAssetId: '3', role: 'exterior', position: 2,
        displayUrl: '/assets/buildings/third.jpg', providerReference: null,
        width: 1600, height: 900, focalX: 0.5, focalY: 0.5,
        attributionName: 'Owner', attributionUrl: null, exactSubject: true,
        publishedAt: '2026-09-01T00:00:00.000Z', lastCheckedAt: '2026-09-01T00:00:00.000Z',
        reviewState: 'approved', canDisplay: true,
      },
      {
        entityId: 'building-1', mediaAssetId: '1', role: 'hero', position: 0,
        displayUrl: '/assets/buildings/hero.jpg', providerReference: null,
        width: 1600, height: 900, focalX: 0.4, focalY: 0.6,
        attributionName: 'Owner', attributionUrl: null, exactSubject: true,
        publishedAt: '2026-09-01T00:00:00.000Z', lastCheckedAt: '2026-09-01T00:00:00.000Z',
        reviewState: 'approved', canDisplay: true,
      },
      {
        entityId: 'building-1', mediaAssetId: '2', role: 'hero', position: 1,
        displayUrl: '/assets/buildings/rejected.jpg', providerReference: null,
        width: 1600, height: 900, focalX: null, focalY: null,
        attributionName: null, attributionUrl: null, exactSubject: true,
        publishedAt: '2026-09-01T00:00:00.000Z', lastCheckedAt: '2026-09-01T00:00:00.000Z',
        reviewState: 'rejected', canDisplay: true,
      },
      {
        entityId: 'building-1', mediaAssetId: '4', role: 'context', position: 3,
        displayUrl: '/assets/buildings/blocked.jpg', providerReference: null,
        width: 1600, height: 900, focalX: null, focalY: null,
        attributionName: null, attributionUrl: null, exactSubject: false,
        publishedAt: '2026-09-01T00:00:00.000Z', lastCheckedAt: '2026-09-01T00:00:00.000Z',
        reviewState: 'approved', canDisplay: false,
      },
    ]);

    expect(media.map(({ mediaAssetId }) => mediaAssetId)).toEqual(['1', '3']);
    expect(media.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(media)).toBe(true);
  });

  it('distinguishes rights-blocked and unavailable location fallbacks', () => {
    expect(buildPublicEntityProjection({
      entityId: 'building-1', entityKind: 'building', location: null, media: [],
      evidenceReleaseId: null, locationFailure: 'rights-blocked',
    }).state).toBe('rights-blocked');
    expect(buildPublicEntityProjection({
      entityId: 'building-1', entityKind: 'building', location: null, media: [],
      evidenceReleaseId: null, locationFailure: 'unavailable',
    }).state).toBe('unavailable');
  });

  it('refreshes only explicitly verified candidates and returns sanitized status counts', async () => {
    const calls: string[] = [];
    const port: PublicEntityProjectionSqlPort = {
      async query(statement) {
        calls.push(statement);
        if (statement.includes('public-entity-projection:counts')) return [{
          published: '12', provisional: '4', rejected: '2', rights_blocked: '3', media_published: '7',
        }];
        return [];
      },
    };
    const publisher = createPublicEntityProjectionPublisher(port);

    await expect(publisher.publishSeoul()).resolves.toEqual({
      published: 12, provisional: 4, rejected: 2, rightsBlocked: 3, mediaPublished: 7,
    });
    expect(calls).toHaveLength(4);
    expect(calls[0]).toContain('locationVerificationStatus');
    expect(calls[0]).toContain("= 'verified'");
    expect(calls[1]).toContain('building_photos');
    expect(calls[1]).toContain("'kr-seoul:estate:' || building.external_id");
    expect(calls[1]).toContain('legacy_registry_key');
    expect(calls[2]).toContain("media.review_state = 'approved'");
  });

  it('loads stored locations and media in two bounded bulk reads', async () => {
    const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];
    const port: PublicEntityProjectionReadPort = {
      async query(statement, parameters) {
        calls.push({ statement, parameters });
        if (statement.includes('public-entity-projection:locations')) return [
          {
            entity_id: 'building-1', market_id: 'kr-seoul', latitude: 37.5, longitude: 127,
            precision: 'rooftop', provider: 'official-address', provider_reference: 'r1',
            rights_policy_id: 'kr-open-data', verification_status: 'verified',
            verified_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-01T00:00:00.000Z',
            can_display: true,
          },
          {
            entity_id: 'building-2', market_id: 'kr-seoul', latitude: 37.6, longitude: 127.1,
            precision: 'street', provider: 'candidate', provider_reference: null,
            rights_policy_id: 'kr-open-data', verification_status: 'provisional',
            verified_at: null, updated_at: '2026-09-01T00:00:00.000Z', can_display: true,
          },
        ];
        if (statement.includes('public-entity-projection:media')) return [{
          entity_id: 'building-1', media_asset_id: '9', role: 'hero', position: 0,
          display_url: '/assets/buildings/hero.jpg', provider_reference: null,
          width: 1600, height: 900, focal_x: 0.5, focal_y: 0.5,
          attribution_name: 'Owner', attribution_url: null, exact_subject: true,
          published_at: '2026-09-01T00:00:00.000Z', last_checked_at: '2026-09-01T00:00:00.000Z',
          review_state: 'approved', can_display: true,
        }];
        if (statement.includes('public-entity-projection:nearby')) return [
          {
            entity_id: 'building-1', kind: 'station', provider_id: 'SEOUL:STN/001',
            name: '시청역', distance_meters: 220, lines: ['1호선', '2호선'], is_nearest: true,
          },
          {
            entity_id: 'building-1', kind: 'school', provider_id: 'SEOUL:SCH/001',
            name: '서울학교', distance_meters: 410, lines: [], is_nearest: true,
          },
        ];
        throw new Error('Unexpected query.');
      },
    };

    const result = await createPublicEntityProjectionReader(port)
      .listBuildings(['building-1', 'building-2']);

    expect(result?.get('building-1')).toMatchObject({
      state: 'ready', location: { latitude: 37.5, longitude: 127 },
      media: [{ mediaAssetId: '9', displayUrl: '/assets/buildings/hero.jpg' }],
      proximity: {
        status: 'ready',
        coordinateStatus: 'ready',
        nearestStation: { sourceId: 'SEOUL:STN/001', name: '시청역', lines: ['1호선', '2호선'], distanceMeters: 220 },
        nearestSchool: { sourceId: 'SEOUL:SCH/001', name: '서울학교', distanceMeters: 410 },
      },
    });
    expect(result?.get('building-2')).toMatchObject({ state: 'location-unverified', location: null });
    expect(calls).toHaveLength(3);
    expect(calls.every(({ parameters }) => parameters.length === 1 && Array.isArray(parameters[0])))
      .toBe(true);
  });

  it('keeps approved photos available when the coordinate query fails', async () => {
    const reader = createPublicEntityProjectionReader({
      async query(statement) {
        if (statement.includes(':locations')) throw new Error('Location timeout');
        if (statement.includes(':nearby')) return [];
        return [{
          entity_id: 'building-1', media_asset_id: '9', role: 'hero', position: 0,
          display_url: '/assets/buildings/hero.jpg', provider_reference: null,
          width: 1600, height: 900, focal_x: 0.5, focal_y: 0.5,
          attribution_name: 'Owner', attribution_url: null, exact_subject: true,
          published_at: '2026-09-01', last_checked_at: '2026-09-01',
          review_state: 'approved', can_display: true,
        }];
      },
    });
    expect((await reader.listBuildings(['building-1']))?.get('building-1')).toMatchObject({
      location: null, media: [{ mediaAssetId: '9' }],
    });
  });
});
