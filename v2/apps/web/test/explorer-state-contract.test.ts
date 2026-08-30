import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any -- contract test exercises a deliberately implementation-neutral state API */

type ExplorerStateModule = {
  createExplorerState: (seed?: Record<string, unknown>) => any;
  explorerReducer: (state: any, action: Record<string, unknown>) => any;
  serializeExplorerQuery: (state: any) => string;
};

async function loadExplorerState(): Promise<ExplorerStateModule> {
  const modulePath = '../lib/explorer-state';
  return import(/* @vite-ignore */ modulePath) as Promise<ExplorerStateModule>;
}

const dongjakSeed = {
  districtCode: '11590',
  propertyType: 'officetel',
  neighborhoodId: 'noryangjin-dong',
  buildingId: 'noryangjin-dream-square',
  neighborhoodIds: [
    'noryangjin-dong',
    'sindaebang-dong',
    'sadang-dong',
    'daebang-dong',
    'sangdo-1-dong',
    'sangdo-dong',
  ],
  buildingIds: [
    'noryangjin-dream-square',
    'megastudy-tower',
    'hangang-cube-state',
    'noryangjin-cube-state',
    'taeyoung-officetel',
    'baekmyeong-trendy-tower',
    'noryangjin-39-9',
  ],
  mapQueryKey: 'district:11590',
};

describe('Explorer explicit discovery state machine', () => {
  it('requires district, then neighborhood, then building selection and only clears descendants', async () => {
    const { createExplorerState, explorerReducer } = await loadExplorerState();
    const initial = createExplorerState();

    const district = explorerReducer(initial, {
      type: 'SELECT_DISTRICT',
      districtCode: '11590',
      neighborhoodIds: dongjakSeed.neighborhoodIds,
    });
    expect(district.selection).toEqual({
      districtCode: '11590',
      neighborhoodId: null,
      buildingId: null,
    });
    expect(district.discoveryRail.neighborhoodIds).toEqual(
      dongjakSeed.neighborhoodIds,
    );
    expect(district.discoveryRail.buildingIds).toEqual([]);

    const neighborhood = explorerReducer(district, {
      type: 'SELECT_NEIGHBORHOOD',
      neighborhoodId: 'noryangjin-dong',
      buildingIds: dongjakSeed.buildingIds,
    });
    expect(neighborhood.selection).toEqual({
      districtCode: '11590',
      neighborhoodId: 'noryangjin-dong',
      buildingId: null,
    });
    expect(neighborhood.discoveryRail.buildingIds).toEqual(dongjakSeed.buildingIds);

    const building = explorerReducer(neighborhood, {
      type: 'SELECT_BUILDING',
      buildingId: 'noryangjin-dream-square',
    });
    expect(building.selection).toEqual({
      districtCode: '11590',
      neighborhoodId: 'noryangjin-dong',
      buildingId: 'noryangjin-dream-square',
    });

    const changedDistrict = explorerReducer(building, {
      type: 'SELECT_DISTRICT',
      districtCode: '11680',
      neighborhoodIds: ['yeoksam-dong'],
    });
    expect(changedDistrict.selection).toEqual({
      districtCode: '11680',
      neighborhoodId: null,
      buildingId: null,
    });
  });

  it('rejects out-of-order and unknown descendant selections', async () => {
    const { createExplorerState, explorerReducer } = await loadExplorerState();
    const empty = createExplorerState();
    expect(
      explorerReducer(empty, {
        type: 'SELECT_NEIGHBORHOOD',
        neighborhoodId: 'noryangjin-dong',
        buildingIds: dongjakSeed.buildingIds,
      }),
    ).toEqual(empty);
    expect(
      explorerReducer(empty, {
        type: 'SELECT_BUILDING',
        buildingId: 'noryangjin-dream-square',
      }),
    ).toEqual(empty);

    const district = explorerReducer(empty, {
      type: 'SELECT_DISTRICT',
      districtCode: '11590',
      neighborhoodIds: dongjakSeed.neighborhoodIds,
    });
    expect(
      explorerReducer(district, {
        type: 'SELECT_NEIGHBORHOOD',
        neighborhoodId: 'unknown-neighborhood',
        buildingIds: dongjakSeed.buildingIds,
      }),
    ).toEqual(district);

    const neighborhood = explorerReducer(district, {
      type: 'SELECT_NEIGHBORHOOD',
      neighborhoodId: 'noryangjin-dong',
      buildingIds: dongjakSeed.buildingIds,
    });
    expect(
      explorerReducer(neighborhood, {
        type: 'SELECT_BUILDING',
        buildingId: 'unknown-building',
      }),
    ).toEqual(neighborhood);
  });

  it('closes only the building and never serializes orphan descendants', async () => {
    const { createExplorerState, explorerReducer, serializeExplorerQuery } =
      await loadExplorerState();
    const selected = createExplorerState(dongjakSeed);
    const closed = explorerReducer(selected, { type: 'CLOSE_BUILDING' });

    expect(closed.selection).toEqual({
      districtCode: '11590',
      neighborhoodId: 'noryangjin-dong',
      buildingId: null,
    });
    expect(serializeExplorerQuery(closed)).not.toContain('building=');

    expect(
      serializeExplorerQuery(
        createExplorerState({
          neighborhoodId: 'noryangjin-dong',
          buildingId: 'noryangjin-dream-square',
        }),
      ),
    ).toBe('type=officetel');
    expect(
      serializeExplorerQuery(
        createExplorerState({
          districtCode: '11590',
          buildingId: 'noryangjin-dream-square',
        }),
      ),
    ).toBe('lawdCd=11590&type=officetel');
  });

  it('keeps selection, discovery rail and URL stable through map movement beyond ten seconds', async () => {
    const { createExplorerState, explorerReducer, serializeExplorerQuery } =
      await loadExplorerState();
    const selected = createExplorerState(dongjakSeed);
    const queryBefore = serializeExplorerQuery(selected);

    const afterFirstMove = explorerReducer(selected, {
      type: 'MAP_MOVED',
      areaKey: 'viewport:37.50,126.92:37.53,126.97',
      movedAtMs: 0,
    });
    const afterTenSeconds = explorerReducer(afterFirstMove, {
      type: 'MAP_MOVED',
      areaKey: 'viewport:37.49,126.91:37.54,126.98',
      movedAtMs: 10_100,
    });

    expect(afterTenSeconds.selection).toEqual(selected.selection);
    expect(afterTenSeconds.discoveryRail).toEqual(selected.discoveryRail);
    expect(serializeExplorerQuery(afterTenSeconds)).toBe(queryBefore);
    expect(afterTenSeconds.map.queryKey).toBe('district:11590');
    expect(afterTenSeconds.map.pendingAreaKey).toBe(
      'viewport:37.49,126.91:37.54,126.98',
    );
  });

  it('applies Search this area only to the map query key, never to selection, rail or URL', async () => {
    const { createExplorerState, explorerReducer, serializeExplorerQuery } =
      await loadExplorerState();
    const selected = createExplorerState(dongjakSeed);
    const moved = explorerReducer(selected, {
      type: 'MAP_MOVED',
      areaKey: 'viewport:dongjak-west',
      movedAtMs: 1_000,
    });
    const searched = explorerReducer(moved, { type: 'SEARCH_AREA' });

    expect(searched.selection).toEqual(selected.selection);
    expect(searched.discoveryRail).toEqual(selected.discoveryRail);
    expect(serializeExplorerQuery(searched)).toBe(serializeExplorerQuery(selected));
    expect(searched.map).toMatchObject({
      queryKey: 'viewport:dongjak-west',
      pendingAreaKey: null,
      revision: 1,
    });
  });

  it('serializes only the explicit discovery selection, not transient viewport state', async () => {
    const { createExplorerState, explorerReducer, serializeExplorerQuery } =
      await loadExplorerState();
    const selected = createExplorerState(dongjakSeed);
    const moved = explorerReducer(selected, {
      type: 'MAP_MOVED',
      areaKey: 'viewport:must-not-leak-into-url',
      movedAtMs: 2_000,
    });

    const serialized = serializeExplorerQuery(moved);
    const query = new URLSearchParams(serialized);

    expect(Object.fromEntries(query)).toMatchObject({
      lawdCd: '11590',
      type: 'officetel',
      building: 'noryangjin-dream-square',
    });
    expect(query.get('dong')).toBeTruthy();
    expect(serialized).not.toContain('viewport');
  });

  it('discards an older building response after a newer neighborhood request starts', async () => {
    const { createExplorerState, explorerReducer } = await loadExplorerState();
    const selected = createExplorerState(dongjakSeed);
    const firstRequest = explorerReducer(selected, {
      type: 'BUILDINGS_REQUESTED',
      neighborhoodId: 'noryangjin-dong',
      requestId: 'request-old',
    });
    const newerRequest = explorerReducer(firstRequest, {
      type: 'BUILDINGS_REQUESTED',
      neighborhoodId: 'noryangjin-dong',
      requestId: 'request-current',
    });
    const staleResult = explorerReducer(newerRequest, {
      type: 'BUILDINGS_RESOLVED',
      neighborhoodId: 'noryangjin-dong',
      requestId: 'request-old',
      buildingIds: ['stale-building'],
    });

    expect(staleResult).toEqual(newerRequest);

    const currentResult = explorerReducer(staleResult, {
      type: 'BUILDINGS_RESOLVED',
      neighborhoodId: 'noryangjin-dong',
      requestId: 'request-current',
      buildingIds: dongjakSeed.buildingIds,
    });
    expect(currentResult.discoveryRail.buildingIds).toEqual(dongjakSeed.buildingIds);
  });

  it('keeps map pointer interaction paused until the explicit Interact toggle', async () => {
    const { createExplorerState, explorerReducer } = await loadExplorerState();
    const initial = createExplorerState(dongjakSeed);

    expect(initial.map.interactive).toBe(false);
    expect(
      explorerReducer(initial, { type: 'SET_MAP_INTERACTION', interactive: true }).map
        .interactive,
    ).toBe(true);
  });
});
