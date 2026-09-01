'use client';

import { useEffect, useReducer } from 'react';
import {
  createExplorerState,
  explorerReducer,
  serializeExplorerQuery,
} from '../lib/explorer-state';
import {
  EXPLORER_PARITY_FIXTURE_VERSION,
  getExplorerBuildings,
  getExplorerDistrict,
  getExplorerNeighborhoods,
} from '../lib/seoul-explorer-data';
import { resolveExplorerRentCheckContext } from '../lib/rent-check/explorer-context';
import { BuildingDialog } from './building-dialog';

function markerPosition(
  item: { readonly lat: number | null; readonly lng: number | null },
  reference: readonly { readonly lat: number | null; readonly lng: number | null }[],
) {
  if (item.lat === null || item.lng === null) return null;
  const located = reference.filter(
    (candidate): candidate is { readonly lat: number; readonly lng: number } =>
      candidate.lat !== null && candidate.lng !== null,
  );
  if (located.length === 0) return null;
  const lats = located.map((candidate) => candidate.lat);
  const lngs = located.map((candidate) => candidate.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latitudeRange = Math.max(maxLat - minLat, 0.001);
  const longitudeRange = Math.max(maxLng - minLng, 0.001);

  return {
    left: `${12 + ((item.lng - minLng) / longitudeRange) * 76}%`,
    top: `${12 + ((maxLat - item.lat) / latitudeRange) * 76}%`,
  };
}

type ExplorerWorkspaceProps = {
  readonly initialDistrictCode: string;
  readonly initialPropertyType: string;
  readonly initialNeighborhoodId?: string;
  readonly initialBuildingId?: string;
};

export function createExplorerRentCheckHref(
  query: Readonly<Record<string, unknown>>,
): string | null {
  const context = resolveExplorerRentCheckContext(query);
  if (!context?.neighborhoodId || !context.buildingId) return null;

  const rentCheckQuery = new URLSearchParams();
  rentCheckQuery.set('lawdCd', context.lawdCd);
  rentCheckQuery.set('type', context.housingType);
  rentCheckQuery.set('dong', context.neighborhoodId);
  rentCheckQuery.set('building', context.buildingId);
  return `/kr/seoul/tools/rent-check/?${rentCheckQuery.toString()}`;
}

export function ExplorerWorkspace({
  initialDistrictCode,
  initialPropertyType,
  initialNeighborhoodId,
  initialBuildingId,
}: ExplorerWorkspaceProps) {
  const district = getExplorerDistrict(initialDistrictCode) ?? getExplorerDistrict('11590');
  if (!district) throw new Error('Approved Explorer district fixture is unavailable.');

  const districtNeighborhoods = getExplorerNeighborhoods(district.id);
  const initialNeighborhood = districtNeighborhoods.find(
    (item) => item.id === initialNeighborhoodId,
  );
  const initialBuildings = initialNeighborhood
    ? getExplorerBuildings(district.id, initialNeighborhood.id)
    : [];
  const initialBuilding = initialBuildings.find((item) => item.id === initialBuildingId);

  const [state, dispatch] = useReducer(
    explorerReducer,
    createExplorerState({
      districtCode: district.id,
      propertyType: initialPropertyType,
      neighborhoodId: initialNeighborhood?.id,
      buildingId: initialBuilding?.id,
      neighborhoodIds: districtNeighborhoods.map((item) => item.id),
      buildingIds: initialBuildings.map((item) => item.id),
      mapQueryKey: `district:${district.id}`,
    }),
  );

  const selectedNeighborhood = districtNeighborhoods.find(
    (item) => item.id === state.selection.neighborhoodId,
  );
  const buildings = selectedNeighborhood
    ? getExplorerBuildings(district.id, selectedNeighborhood.id)
    : [];
  const selectedBuilding = buildings.find(
    (item) => item.id === state.selection.buildingId,
  );
  const markerItems = selectedNeighborhood ? buildings : districtNeighborhoods;
  const locatedMarkerItems = markerItems.filter(
    (item) => item.lat !== null && item.lng !== null,
  );
  const rentCheckHref = selectedNeighborhood && selectedBuilding
    ? createExplorerRentCheckHref({
        lawdCd: state.selection.districtCode,
        type: state.propertyType,
        dong: selectedNeighborhood.id,
        building: selectedBuilding.id,
      })
    : null;

  const stableQuery = serializeExplorerQuery(state);

  useEffect(() => {
    const nextUrl = `${window.location.pathname}?${stableQuery}`;
    window.history.replaceState(null, '', nextUrl);
  }, [stableQuery]);

  return (
    <section className="explorer-workspace" aria-label="Seoul Explorer workspace">
      <aside className="explorer-rail" aria-label="Property discovery">
        <div className="explorer-rail__intro">
          <p className="section-eyebrow">Seoul Explorer · Preview</p>
          <h1>Choose the place.<br />Then the building.</h1>
          <p>Selections change only when you choose them. Moving the map never rewrites this rail.</p>
        </div>

        <section className="explorer-step" data-discovery-step="district">
          <div className="explorer-step__heading"><span>01</span><h2>District</h2></div>
          <button className="explorer-choice is-selected" type="button" aria-pressed="true">
            <strong>{district.label}</strong>
            <span>Selected market area</span>
          </button>
        </section>

        <section className="explorer-step" data-discovery-step="neighborhood">
          <div className="explorer-step__heading"><span>02</span><h2>Neighborhood</h2></div>
          <div className="explorer-choice-list">
            {districtNeighborhoods.map((neighborhood) => (
              <button
                className={neighborhood.id === state.selection.neighborhoodId ? 'explorer-choice is-selected' : 'explorer-choice'}
                key={neighborhood.id}
                type="button"
                aria-pressed={neighborhood.id === state.selection.neighborhoodId}
                onClick={() => dispatch({
                  type: 'SELECT_NEIGHBORHOOD',
                  neighborhoodId: neighborhood.id,
                  buildingIds: getExplorerBuildings(district.id, neighborhood.id).map((item) => item.id),
                })}
              >
                <strong>{neighborhood.nameEn}</strong>
                <span>{neighborhood.nameKo}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="explorer-step" data-discovery-step="building">
          <div className="explorer-step__heading"><span>03</span><h2>Building</h2></div>
          {selectedNeighborhood ? (
            buildings.length > 0 ? (
              <div className="explorer-choice-list">
                {buildings.map((building) => (
                  <button
                    className={building.id === state.selection.buildingId ? 'explorer-choice is-selected' : 'explorer-choice'}
                    key={building.id}
                    type="button"
                    aria-label={`Open ${building.nameKo} building status`}
                    aria-pressed={building.id === state.selection.buildingId}
                    onClick={() => dispatch({ type: 'SELECT_BUILDING', buildingId: building.id })}
                  >
                    <strong>{building.nameEn}</strong>
                    <span>{building.nameKo} · exact map point unavailable</span>
                  </button>
                ))}
              </div>
            ) : <p className="explorer-empty">No verified parity buildings are available for this neighborhood.</p>
          ) : <p className="explorer-empty">Choose a neighborhood to reveal its verified building set.</p>}
        </section>
      </aside>

      <div className="explorer-map" data-interactive={state.map.interactive}>
        <div className="explorer-map__toolbar">
          <div>
            <span>Map scope</span>
            <strong>{selectedNeighborhood?.nameEn ?? district.label}</strong>
          </div>
          <div className="explorer-map__actions">
            <button
              type="button"
              aria-pressed={state.map.interactive}
              onClick={() => dispatch({ type: 'SET_MAP_INTERACTION', interactive: !state.map.interactive })}
            >
              {state.map.interactive ? 'Pause map' : 'Interact with map'}
            </button>
            <button
              className="is-primary"
              type="button"
              disabled={!state.map.pendingAreaKey}
              onClick={() => dispatch({ type: 'SEARCH_AREA' })}
            >
              Search this area
            </button>
          </div>
        </div>

        <div
          className="explorer-map__canvas"
          role="region"
          aria-label={`Map preview of ${selectedNeighborhood?.nameEn ?? district.label}`}
        >
          <div
            className="explorer-map__sdk-surface"
            aria-hidden="true"
            onPointerUp={() => dispatch({
              type: 'MAP_MOVED',
              areaKey: `viewport:${Date.now()}`,
              movedAtMs: Date.now(),
            })}
          >
            <div className="explorer-map__grid" />
          </div>
          {locatedMarkerItems.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className="explorer-marker"
              style={markerPosition(item, markerItems) ?? undefined}
              aria-label={item.nameEn}
              onClick={(event) => {
                event.stopPropagation();
                if ('neighborhoodId' in item) {
                  dispatch({ type: 'SELECT_BUILDING', buildingId: item.id });
                } else {
                  dispatch({
                    type: 'SELECT_NEIGHBORHOOD',
                    neighborhoodId: item.id,
                    buildingIds: getExplorerBuildings(district.id, item.id).map((building) => building.id),
                  });
                }
              }}
            >
              <span>{index + 1}</span>
            </button>
          ))}
          {selectedNeighborhood && locatedMarkerItems.length === 0 ? (
            <p className="explorer-map__unavailable">
              Exact building map points are unavailable in this parity preview. Choose a building from the rail.
            </p>
          ) : null}
          {!state.map.interactive ? (
            <div className="explorer-map__shield">Use “Interact with map” to pan. Your choices stay fixed.</div>
          ) : null}
        </div>

        <footer className="explorer-map__footer">
          <p>Fixture {EXPLORER_PARITY_FIXTURE_VERSION}</p>
          <p aria-live="polite">
            {state.map.pendingAreaKey
              ? 'Map moved. Use Search this area to apply the viewport.'
              : `Applied map revision ${state.map.revision}. Interface parity data only — not current official contract values.`}
          </p>
        </footer>
      </div>

      {selectedBuilding ? (
        <BuildingDialog
          building={selectedBuilding}
          open
          rentCheckHref={rentCheckHref}
          onClose={() => dispatch({ type: 'CLOSE_BUILDING' })}
        />
      ) : null}
    </section>
  );
}
