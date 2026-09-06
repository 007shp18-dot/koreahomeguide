import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createKoreaBuildingEnrichmentLoader } from '../lib/public-market/korea-building-enrichment.server';
import type { PublicEntityProjection } from '../lib/public-data/entity-location-projection.server';
import type { StoredPublicPhotoApproval } from '../lib/photos/building-photo-store.server';
import { renderKoreaBuildingRoute } from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';

afterEach(() => vi.unstubAllEnvs());

describe('Korea building static enrichment', () => {
  it('bulk-loads the complete prerender wave once per build worker', async () => {
    const projection = { entityId: 'kr-seoul:estate:building-a' } as PublicEntityProjection;
    const photo = { buildingName: 'Building A' } as StoredPublicPhotoApproval;
    const listBuildings = vi.fn(async (ids: readonly string[]) => new Map([
      [ids[0]!, projection],
    ]));
    const listPhotoApprovals = vi.fn(async (keys: readonly string[]) => ({
      approvals: new Map([[keys[0]!, photo]]),
      databaseReadFailed: true,
    }));
    const load = createKoreaBuildingEnrichmentLoader({
      phase: () => 'phase-production-build',
      listPrerenderedBuildingIds: () => ['building-a', 'building-b', 'building-a'],
      projectionReader: () => ({ listBuildings }),
      listPhotoApprovals,
    });

    await expect(load('building-a')).resolves.toEqual({
      entityProjection: projection,
      photoApproval: photo,
      photoApprovalReadFailed: false,
    });
    await expect(load('building-b')).resolves.toEqual({
      entityProjection: null,
      photoApproval: null,
      photoApprovalReadFailed: true,
    });

    expect(listBuildings).toHaveBeenCalledTimes(1);
    expect(listBuildings).toHaveBeenCalledWith([
      'kr-seoul:estate:building-a',
      'kr-seoul:estate:building-b',
    ]);
    expect(listPhotoApprovals).toHaveBeenCalledTimes(1);
    expect(listPhotoApprovals).toHaveBeenCalledWith([
      'kr-seoul:building-a',
      'kr-seoul:building-b',
    ]);
  });

  it('loads only the requested identity outside the production build', async () => {
    const listBuildings = vi.fn(async () => new Map());
    const listPhotoApprovals = vi.fn(async () => ({
      approvals: new Map(),
      databaseReadFailed: false,
    }));
    const load = createKoreaBuildingEnrichmentLoader({
      phase: () => 'phase-production-server',
      listPrerenderedBuildingIds: vi.fn(() => ['ignored-building']),
      projectionReader: () => ({ listBuildings }),
      listPhotoApprovals,
    });

    await load('requested-building');

    expect(listBuildings).toHaveBeenCalledWith(['kr-seoul:estate:requested-building']);
    expect(listPhotoApprovals).toHaveBeenCalledWith(['kr-seoul:requested-building']);
  });

  it('rejects unknown and property-type routes before enrichment', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const loadEnrichment = vi.fn(async () => ({
      entityProjection: null,
      photoApproval: null,
      photoApprovalReadFailed: false,
    }));

    await expect(renderKoreaBuildingRoute({
      district: 'gangnam-gu',
      buildingId: 'definitely-not-a-building',
      locale: 'en',
    }, { loadEnrichment })).rejects.toThrow();
    await expect(renderKoreaBuildingRoute({
      district: 'gangnam-gu',
      buildingId: 'apartment',
      locale: 'en',
    }, { loadEnrichment })).resolves.toBeDefined();

    expect(loadEnrichment).not.toHaveBeenCalled();
  }, 20_000);
});
