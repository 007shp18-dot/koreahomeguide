export type ExplorerSelection = {
  readonly districtCode: string | null;
  readonly neighborhoodId: string | null;
  readonly buildingId: string | null;
};

export type ExplorerState = {
  readonly propertyType: string;
  readonly selection: ExplorerSelection;
  readonly discoveryRail: {
    readonly neighborhoodIds: readonly string[];
    readonly buildingIds: readonly string[];
  };
  readonly map: {
    readonly queryKey: string | null;
    readonly pendingAreaKey: string | null;
    readonly movedAtMs: number | null;
    readonly interactive: boolean;
    readonly revision: number;
  };
  readonly requests: {
    readonly buildings: {
      readonly neighborhoodId: string;
      readonly requestId: string;
    } | null;
  };
};

type ExplorerSeed = {
  readonly districtCode?: string;
  readonly propertyType?: string;
  readonly neighborhoodId?: string;
  readonly buildingId?: string;
  readonly neighborhoodIds?: readonly string[];
  readonly buildingIds?: readonly string[];
  readonly mapQueryKey?: string;
};

export type ExplorerAction =
  | {
      readonly type: 'SELECT_DISTRICT';
      readonly districtCode: string;
      readonly neighborhoodIds: readonly string[];
    }
  | {
      readonly type: 'SELECT_NEIGHBORHOOD';
      readonly neighborhoodId: string;
      readonly buildingIds: readonly string[];
    }
  | { readonly type: 'SELECT_BUILDING'; readonly buildingId: string }
  | { readonly type: 'CLOSE_BUILDING' }
  | {
      readonly type: 'MAP_MOVED';
      readonly areaKey: string;
      readonly movedAtMs: number;
    }
  | { readonly type: 'SEARCH_AREA' }
  | {
      readonly type: 'BUILDINGS_REQUESTED';
      readonly neighborhoodId: string;
      readonly requestId: string;
    }
  | {
      readonly type: 'BUILDINGS_RESOLVED';
      readonly neighborhoodId: string;
      readonly requestId: string;
      readonly buildingIds: readonly string[];
    }
  | { readonly type: 'SET_MAP_INTERACTION'; readonly interactive: boolean };

export function createExplorerState(seed: ExplorerSeed = {}): ExplorerState {
  const districtCode = seed.districtCode ?? null;
  const neighborhoodIds = [...(seed.neighborhoodIds ?? [])];
  const neighborhoodId =
    districtCode &&
    seed.neighborhoodId &&
    neighborhoodIds.includes(seed.neighborhoodId)
      ? seed.neighborhoodId
      : null;
  const buildingIds = neighborhoodId ? [...(seed.buildingIds ?? [])] : [];
  const buildingId =
    neighborhoodId && seed.buildingId && buildingIds.includes(seed.buildingId)
      ? seed.buildingId
      : null;

  return {
    propertyType: seed.propertyType ?? 'officetel',
    selection: {
      districtCode,
      neighborhoodId,
      buildingId,
    },
    discoveryRail: {
      neighborhoodIds,
      buildingIds,
    },
    map: {
      queryKey: seed.mapQueryKey ?? (districtCode ? `district:${districtCode}` : null),
      pendingAreaKey: null,
      movedAtMs: null,
      interactive: false,
      revision: 0,
    },
    requests: { buildings: null },
  };
}

export function explorerReducer(
  state: ExplorerState,
  action: ExplorerAction,
): ExplorerState {
  switch (action.type) {
    case 'SELECT_DISTRICT':
      return {
        ...state,
        selection: {
          districtCode: action.districtCode,
          neighborhoodId: null,
          buildingId: null,
        },
        discoveryRail: {
          neighborhoodIds: [...action.neighborhoodIds],
          buildingIds: [],
        },
        map: {
          ...state.map,
          queryKey: `district:${action.districtCode}`,
          pendingAreaKey: null,
        },
        requests: { buildings: null },
      };
    case 'SELECT_NEIGHBORHOOD':
      if (
        !state.selection.districtCode ||
        !state.discoveryRail.neighborhoodIds.includes(action.neighborhoodId)
      ) {
        return state;
      }
      return {
        ...state,
        selection: {
          ...state.selection,
          neighborhoodId: action.neighborhoodId,
          buildingId: null,
        },
        discoveryRail: {
          ...state.discoveryRail,
          buildingIds: [...action.buildingIds],
        },
        requests: { buildings: null },
      };
    case 'SELECT_BUILDING':
      if (
        !state.selection.neighborhoodId ||
        !state.discoveryRail.buildingIds.includes(action.buildingId)
      ) {
        return state;
      }
      return {
        ...state,
        selection: { ...state.selection, buildingId: action.buildingId },
      };
    case 'CLOSE_BUILDING':
      if (!state.selection.buildingId) return state;
      return {
        ...state,
        selection: { ...state.selection, buildingId: null },
      };
    case 'MAP_MOVED':
      return {
        ...state,
        map: {
          ...state.map,
          pendingAreaKey: action.areaKey,
          movedAtMs: action.movedAtMs,
        },
      };
    case 'SEARCH_AREA':
      if (!state.map.pendingAreaKey) return state;
      return {
        ...state,
        map: {
          ...state.map,
          queryKey: state.map.pendingAreaKey,
          pendingAreaKey: null,
          revision: state.map.revision + 1,
        },
      };
    case 'BUILDINGS_REQUESTED':
      return {
        ...state,
        requests: {
          buildings: {
            neighborhoodId: action.neighborhoodId,
            requestId: action.requestId,
          },
        },
      };
    case 'BUILDINGS_RESOLVED': {
      const request = state.requests.buildings;
      if (
        !request ||
        request.requestId !== action.requestId ||
        request.neighborhoodId !== action.neighborhoodId
      ) {
        return state;
      }

      return {
        ...state,
        discoveryRail: {
          ...state.discoveryRail,
          buildingIds: [...action.buildingIds],
        },
        requests: { buildings: null },
      };
    }
    case 'SET_MAP_INTERACTION':
      return {
        ...state,
        map: { ...state.map, interactive: action.interactive },
      };
    default:
      return state;
  }
}

export function serializeExplorerQuery(state: ExplorerState): string {
  const query = new URLSearchParams();
  if (state.selection.districtCode) {
    query.set('lawdCd', state.selection.districtCode);
  }
  if (state.propertyType) query.set('type', state.propertyType);
  if (state.selection.districtCode && state.selection.neighborhoodId) {
    query.set('dong', state.selection.neighborhoodId);
  }
  if (
    state.selection.districtCode &&
    state.selection.neighborhoodId &&
    state.selection.buildingId
  ) {
    query.set('building', state.selection.buildingId);
  }
  return query.toString();
}
