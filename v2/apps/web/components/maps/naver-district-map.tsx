'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import type { ProductLocale } from '../../lib/locale/product-copy';
import { isTrustedGooglePlaceMatch } from './google-place-photo';
import { buildGoogleMapsScriptUrl } from './google-place-map';
export { buildNaverBuildingAddressQuery } from '../../lib/public-market/naver-building-address';
import styles from './interactive-map.module.css';

export type NaverDistrictMapPoint = Readonly<{
  slug: string;
  nameEn: string;
  href: string;
  latitude: number;
  longitude: number;
  metricLabel?: string;
  sampleLabel?: string;
  selected?: boolean;
}>;

export type NaverBuildingMapPoint = Readonly<{
  id: string;
  storedLocationKey?: string;
  districtSlug?: string;
  /** Original lookup identity; a translated title is display-only. */
  sourceName?: string;
  title: string;
  href: string;
  addressQuery: string;
  latitude: number | null;
  longitude: number | null;
  allowAddressGeocoding?: boolean;
  metricLabel?: string | null;
  sampleLabel?: string;
  selected?: boolean;
  areaReference?: Readonly<{
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    neighborhoodId?: string;
    addressQuery?: string;
  }>;
}>;

export function buildGoogleBuildingLookup(building: Pick<NaverBuildingMapPoint, 'title' | 'sourceName' | 'addressQuery'>) {
  const sourceName = building.sourceName ?? building.title;
  return { sourceName, textQuery: `${sourceName}, ${building.addressQuery}` };
}

/** Names repeat across Seoul: require both district and local address context. */
export function isGoogleBuildingAddressMatch(query: string, address: string | undefined): boolean {
  if (!address) return false;
  const parts = query.trim().split(/\s+/);
  if (parts[0] !== '서울특별시' || parts.length < 4) return false;
  const tokens = address.replace(/[(),]/g, ' ').split(/\s+/);
  return tokens.includes('서울특별시') && tokens.includes(parts[1]!) && tokens.includes(parts[2]!);
}

export type NaverNeighborhoodMapPoint = Readonly<{
  id: string;
  title: string;
  addressQuery: string;
  latitude: number | null;
  longitude: number | null;
  buildingCount: number;
  selected?: boolean;
}>;

type NaverMapInstance = Readonly<{
  setCenter: (center: unknown) => void;
  setZoom: (zoom: number) => void;
  getZoom?: () => number;
}>;

type NaverMarkerInstance = Readonly<{
  setMap: (map: unknown | null) => void;
}>;

type NaverDistrictMapProps = Readonly<{
  areaGroups?: readonly NaverAreaMapGroup[];
  onOpenAreaBuildings?: () => void;
  clientId: string | null;
  googleMapsBrowserKey?: string | null;
  districts: readonly NaverDistrictMapPoint[];
  selectedDistrict?: Readonly<{ latitude: number; longitude: number }>;
  focusAddressQuery?: string;
  neighborhoods?: readonly NaverNeighborhoodMapPoint[];
  buildings?: readonly NaverBuildingMapPoint[];
  onSelectDistrict?: (slug: string) => void;
  onSelectNeighborhood?: (id: string) => void;
  onSelectBuilding?: (id: string) => void;
  onResolveBuildingLocation?: (id: string, latitude: number, longitude: number) => void;
  fallback: ReactNode;
  locale?: ProductLocale;
}>;

export type NaverGeocodeAddress = Readonly<{
  x: string;
  y: string;
  roadAddress?: string;
  jibunAddress?: string;
}>;

export type NaverMapsSdk = Readonly<{
  Map: new (
    element: HTMLElement,
    options: Readonly<{ center: unknown; zoom: number; minZoom: number }>,
  ) => NaverMapInstance;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Marker: new (options: Readonly<{
    map: unknown;
    position: unknown;
    title: string;
    icon?: Readonly<{ content: string }>;
  }>) => NaverMarkerInstance;
  Event: Readonly<{
    addListener(target: unknown, event: 'click' | 'zoom_changed', listener: () => void): unknown;
    removeListener(listener: unknown): void;
  }>;
  Service?: Readonly<{
    Status: Readonly<{ OK: string }>;
    geocode: (
      input: Readonly<{ query: string }>,
      callback: (status: string, response: Readonly<{
        v2?: Readonly<{ addresses?: readonly NaverGeocodeAddress[] }>;
      }>) => void,
    ) => void;
  }>;
}>;

export function isNaverMapsSdkReady(value: unknown): value is NaverMapsSdk {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Readonly<Record<string, unknown>>;
  const event = candidate.Event;
  return typeof candidate.Map === 'function'
    && typeof candidate.LatLng === 'function'
    && typeof candidate.Marker === 'function'
    && typeof event === 'object'
    && event !== null
    && typeof (event as Readonly<Record<string, unknown>>).addListener === 'function'
    && typeof (event as Readonly<Record<string, unknown>>).removeListener === 'function';
}

type NaverMapsSubmoduleNamespace = NaverMapsSdk & {
  onJSContentLoaded?: () => void;
};

type GooglePlaceCoordinate = Readonly<{ lat: () => number; lng: () => number }>;
type GooglePlaceCoordinateSdk = Readonly<{
  importLibrary: (library: 'places') => Promise<Readonly<{
    Place: Readonly<{
      searchByText: (request: Readonly<{
        textQuery: string;
        fields: readonly string[];
        maxResultCount: number;
        language: string;
      }>) => Promise<Readonly<{ places: readonly Readonly<{
        displayName?: string;
        formattedAddress?: string;
        location?: GooglePlaceCoordinate;
      }>[] }>>;
    }>;
  }>>;
}>;

export function waitForNaverMapsSubmodules(
  value: unknown,
  requireGeocoder: boolean,
  onReady: (sdk: NaverMapsSdk) => void,
): () => void {
  if (!isNaverMapsSdkReady(value)) {
    throw new TypeError('NAVER Maps SDK is unavailable.');
  }
  if (!requireGeocoder || value.Service !== undefined) {
    onReady(value);
    return () => undefined;
  }

  const namespace = value as NaverMapsSubmoduleNamespace;
  const previous = namespace.onJSContentLoaded;
  let active = true;
  const handleContentLoaded = () => {
    if (!active) return;
    active = false;
    if (namespace.onJSContentLoaded === handleContentLoaded) {
      namespace.onJSContentLoaded = previous;
    }
    previous?.();
    if (namespace.Service !== undefined) onReady(namespace);
  };
  namespace.onJSContentLoaded = handleContentLoaded;

  return () => {
    active = false;
    if (namespace.onJSContentLoaded === handleContentLoaded) {
      namespace.onJSContentLoaded = previous;
    }
  };
}

export type NaverAreaMapGroup = Readonly<{
  reference: NonNullable<NaverBuildingMapPoint['areaReference']>;
  count: number;
}>;

type NaverDistrictMapUpdate = Readonly<{
  areaGroups?: readonly NaverAreaMapGroup[];
  onOpenAreaBuildings?: () => void;
  buildingCountLabel?: string;
  areaOnlyLabel?: string;
  districts: readonly NaverDistrictMapPoint[];
  selectedDistrict?: Readonly<{ latitude: number; longitude: number }>;
  focusAddressQuery?: string;
  neighborhoods?: readonly NaverNeighborhoodMapPoint[];
  buildings?: readonly NaverBuildingMapPoint[];
  onSelect: (href: string) => void;
  onSelectNeighborhood?: (id: string) => void;
  onSelectBuilding?: (id: string) => void;
  onResolveBuildingLocation?: (id: string, latitude: number, longitude: number) => void;
  onBuildingMarkerUnavailable?: (id: string) => void;
  onCoverageChange?: (coverage: Readonly<{ total: number; located: number; grouped: number; unplaced: number }>) => void;
}>;

type MountNaverDistrictMapOptions = NaverDistrictMapUpdate & Readonly<{
  sdk: NaverMapsSdk;
  element: HTMLElement;
}>;

function escapeMarkerText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** HTML label rendered by NAVER Maps for the citywide district layer. */
export function buildNaverDistrictMarkerContent(district: NaverDistrictMapPoint): string | undefined {
  if (district.metricLabel === undefined) return undefined;
  const selectedClass = district.selected === true ? ' spMapDistrictBubbleSelected' : '';
  return `<div class="spMapDistrictBubble${selectedClass}"><span>${escapeMarkerText(district.nameEn)}</span></div>`;
}

/** Count label rendered between district selection and individual buildings. */
export function buildNaverNeighborhoodMarkerContent(neighborhood: NaverNeighborhoodMapPoint): string {
  const selectedClass = neighborhood.selected === true ? ' spMapNeighborhoodBubbleSelected' : '';
  return `<div class="spMapNeighborhoodBubble${selectedClass}"><span>${escapeMarkerText(neighborhood.title)}</span><strong>${neighborhood.buildingCount}</strong></div>`;
}

/** Price-free location marker; price evidence stays in the list and detail. */
export function buildNaverBuildingMarkerContent(building: NaverBuildingMapPoint): string {
  const selectedClass = building.selected === true ? ' spMapBuildingBubbleSelected' : '';
  return `<div class="spMapBuildingBubble${selectedClass}" role="img" aria-label="${escapeMarkerText(building.title)}"><span aria-hidden="true"></span></div>`;
}

export function buildNaverMapsScriptUrl(
  clientId: string,
  includeGeocoder = false,
  includePanorama = false,
  callback?: string,
): string {
  const url = new URL('https://oapi.map.naver.com/openapi/v3/maps.js');
  url.searchParams.set('ncpKeyId', clientId);
  const submodules = [
    includePanorama ? 'panorama' : null,
    includeGeocoder ? 'geocoder' : null,
  ].filter((value): value is string => value !== null);
  if (submodules.length > 0) url.searchParams.set('submodules', submodules.join(','));
  if (callback !== undefined) url.searchParams.set('callback', callback);
  // NAVER treats an encoded comma as part of a single submodule name
  // (`maps-panorama%2Cgeocoder.js`) instead of loading both modules.
  // URLSearchParams encodes commas, so restore the delimiter expected by the SDK.
  return url.toString().replace(/%2C/gi, ',');
}

export function resolveUnambiguousNaverGeocode(
  addressQuery: string,
  addresses: readonly NaverGeocodeAddress[] | undefined,
): NaverGeocodeAddress | null {
  if (addresses === undefined || addresses.length === 0) return null;
  const queryParts = addressQuery.trim().split(/\s+/);
  if (queryParts[0] !== '서울특별시' || queryParts.length < 4) {
    return addresses.length === 1 ? addresses[0]! : null;
  }
  const district = queryParts[1]!;
  const neighborhood = queryParts[2]!;
  const lot = queryParts.slice(3).find((part) => /^\d+(?:-\d+)?$/.test(part));
  const localityMatches = addresses.filter((address) => {
    const resolvedLocality = `${address.roadAddress ?? ''} ${address.jibunAddress ?? ''}`;
    return resolvedLocality.includes(district) && resolvedLocality.includes(neighborhood)
      && (lot === undefined || (address.jibunAddress ?? '').split(/\s+/).includes(lot));
  });
  return localityMatches.length === 1 ? localityMatches[0]! : null;
}

/** Clusters only real Seoul coordinates; a cluster is never an inferred building location. */
export function clusterNaverBuildings(buildings: readonly NaverBuildingMapPoint[], zoom: number) {
  const groups = new Map<string, NaverBuildingMapPoint[]>();
  const cell = 0.004 / (2 ** Math.max(0, zoom - 14));
  for (const building of buildings) {
    const { latitude, longitude } = building;
    if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < 37.4 || latitude > 37.72 || longitude < 126.75 || longitude > 127.25) continue;
    const key = zoom >= 17 || building.selected
      ? building.id : `${Math.floor(latitude / cell)}:${Math.floor(longitude / cell)}`;
    const group = groups.get(key) ?? [];
    group.push(building);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    buildings: group,
    latitude: group.reduce((sum, item) => sum + item.latitude!, 0) / group.length,
    longitude: group.reduce((sum, item) => sum + item.longitude!, 0) / group.length,
  }));
}

export function mountNaverDistrictMap({
  sdk,
  element,
  ...initial
}: MountNaverDistrictMapOptions) {
  let map: NaverMapInstance | null = null;
  let activeScope: string | null = null;
  let activeSelectedBuildingId: string | null = null;
  let markers: NaverMarkerInstance[] = [];
  let listeners: unknown[] = [];
  let unavailableBuildingIds: string[] = [];
  const locationCache = new Map<string, { latitude: number; longitude: number }>();
  let zoomListener: unknown;
  let generation = 0;
  let disposed = false;

  const clearActiveGeneration = (sdkAvailable = true) => {
    generation += 1;
    if (sdkAvailable) {
      if (zoomListener !== undefined) sdk.Event.removeListener(zoomListener);
      for (const listener of listeners) sdk.Event.removeListener(listener);
      for (const marker of markers) marker.setMap(null);
    }
    zoomListener = undefined;
    listeners = [];
    markers = [];
    unavailableBuildingIds = [];
  };

  const update = ({
    districts,
    selectedDistrict,
    focusAddressQuery,
    buildingCountLabel = 'buildings',
    areaOnlyLabel = 'Area only',
    areaGroups = [],
    onOpenAreaBuildings,
    neighborhoods,
    buildings,
    onSelect,
    onSelectNeighborhood,
    onSelectBuilding,
    onResolveBuildingLocation,
    onBuildingMarkerUnavailable,
    onCoverageChange,
  }: NaverDistrictMapUpdate) => {
    if (disposed) throw new TypeError('Disposed NAVER map cannot be updated.');
    clearActiveGeneration();
    const activeGeneration = generation;
    const buildingPoints = (buildings ?? []).map((building) => {
      const cached = locationCache.get(`${building.id}:${building.addressQuery}`);
      return cached === undefined ? building : { ...building, ...cached };
    });
    const showingNeighborhoods = selectedDistrict !== undefined && neighborhoods !== undefined;
    const showingBuildings = selectedDistrict !== undefined && buildings !== undefined;
    const selectedLocatedBuilding = buildingPoints.find((building) => (
      building.selected === true
      && building.latitude !== null
      && building.longitude !== null
      && Number.isFinite(building.latitude)
      && Number.isFinite(building.longitude)
      && building.latitude >= 37.4 && building.latitude <= 37.72
      && building.longitude >= 126.75 && building.longitude <= 127.25
    ));
    const center = new sdk.LatLng(
      selectedLocatedBuilding?.latitude ?? selectedDistrict?.latitude ?? 37.5665,
      selectedLocatedBuilding?.longitude ?? selectedDistrict?.longitude ?? 126.978,
    );
    const zoom = selectedLocatedBuilding !== undefined ? 17
      : showingNeighborhoods ? 13
        : showingBuildings ? (focusAddressQuery ? 17 : 14) : 11;
    const layer = showingNeighborhoods ? 'neighborhoods' : showingBuildings ? 'buildings' : 'districts';
    const scope = selectedDistrict === undefined ? `seoul:${layer}`
      : `${selectedDistrict.latitude}:${selectedDistrict.longitude}:${layer}:${focusAddressQuery ?? ""}`;
    const scopeChanged = activeScope !== scope;
    if (map === null) {
      map = new sdk.Map(element, { center, zoom, minZoom: 10 });
    } else if (activeScope !== scope) {
      map.setCenter(center);
      map.setZoom(zoom);
    } else if (
      selectedLocatedBuilding !== undefined
      && selectedLocatedBuilding.id !== activeSelectedBuildingId
    ) {
      map.setCenter(center);
      map.setZoom(17);
    }
    activeScope = scope;
    activeSelectedBuildingId = selectedLocatedBuilding?.id ?? null;
    const isActive = () => !disposed && generation === activeGeneration;
    if (scopeChanged && selectedLocatedBuilding === undefined && focusAddressQuery && sdk.Service) {
      sdk.Service.geocode({ query: focusAddressQuery }, (status, response) => {
        if (!isActive() || activeSelectedBuildingId !== null || status !== sdk.Service!.Status.OK) return;
        const address = resolveUnambiguousNaverGeocode(focusAddressQuery, response.v2?.addresses);
        const latitude = Number(address?.y);
        const longitude = Number(address?.x);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)
          && latitude >= 37.4 && latitude <= 37.72 && longitude >= 126.75 && longitude <= 127.25) {
          map?.setCenter(new sdk.LatLng(latitude, longitude));
          map?.setZoom(17);
        }
      });
    }

    const addMarker = (
      title: string,
      latitude: number,
      longitude: number,
      select: () => void,
      iconContent?: string,
    ) => {
      if (!isActive() || map === null) return;
      const position = new sdk.LatLng(latitude, longitude);
      const marker = new sdk.Marker(iconContent === undefined
        ? { map, position, title }
        : { map, position, title, icon: { content: iconContent } });
      markers.push(marker);
      const listener = sdk.Event.addListener(marker, 'click', () => {
        if (isActive()) select();
      });
      listeners.push(listener);
    };
    const markBuildingUnavailable = (buildingId: string) => {
      if (!isActive() || unavailableBuildingIds.includes(buildingId)) return;
      unavailableBuildingIds.push(buildingId);
      onBuildingMarkerUnavailable?.(buildingId);
    };

    if (showingNeighborhoods) {
      const pending = new Map(neighborhoods.map(point => [point.id, point]));
      let areaMarker: NaverMarkerInstance | undefined;
      let initialized = false;
      const renderUnlocatedNeighborhoods = () => {
        if (!isActive() || !initialized) return;
        areaMarker?.setMap(null);
        areaMarker = undefined;
        const count = [...pending.values()].reduce((sum, point) => sum + point.buildingCount, 0);
        if (count === 0 || !Number.isFinite(selectedDistrict.latitude) || !Number.isFinite(selectedDistrict.longitude)
          || selectedDistrict.latitude < 37.4 || selectedDistrict.latitude > 37.72
          || selectedDistrict.longitude < 126.75 || selectedDistrict.longitude > 127.25) return;
        const district = districts.find(point => point.latitude === selectedDistrict.latitude && point.longitude === selectedDistrict.longitude);
        const title = district?.nameEn ?? 'District';
        addMarker(`${title} · ${count} ${buildingCountLabel} · ${areaOnlyLabel}`,
          selectedDistrict.latitude, selectedDistrict.longitude, () => onOpenAreaBuildings?.(),
          `<div class="spMapNeighborhoodBubble spMapAreaGroup"><span>${escapeMarkerText(title)}</span><strong>${count}</strong><small>${escapeMarkerText(areaOnlyLabel)}</small></div>`);
        areaMarker = markers.at(-1);
      };
      for (const neighborhood of neighborhoods) {
        const cacheKey = `neighborhood:${neighborhood.id}:${neighborhood.addressQuery}`;
        const cached = locationCache.get(cacheKey);
        const point = cached === undefined ? neighborhood : { ...neighborhood, ...cached };
        const renderNeighborhood = (latitude: number, longitude: number) => {
          pending.delete(neighborhood.id);
          addMarker(
          neighborhood.title,
          latitude,
          longitude,
          () => onSelectNeighborhood?.(neighborhood.id),
          buildNaverNeighborhoodMarkerContent(neighborhood),
          );
          renderUnlocatedNeighborhoods();
        };
        if (
          point.latitude !== null && point.longitude !== null
          && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
          && point.latitude >= 37.4 && point.latitude <= 37.72
          && point.longitude >= 126.75 && point.longitude <= 127.25
        ) {
          renderNeighborhood(point.latitude, point.longitude);
        } else if (sdk.Service !== undefined) {
          sdk.Service.geocode({ query: neighborhood.addressQuery }, (status, response) => {
            if (!isActive() || status !== sdk.Service!.Status.OK) return;
            const address = resolveUnambiguousNaverGeocode(
              neighborhood.addressQuery,
              response.v2?.addresses,
            );
            if (address === null) return;
            const latitude = Number(address.y);
            const longitude = Number(address.x);
            if (
              !Number.isFinite(latitude) || !Number.isFinite(longitude)
              || latitude < 37.4 || latitude > 37.72
              || longitude < 126.75 || longitude > 127.25
            ) return;
            locationCache.set(cacheKey, { latitude, longitude });
            renderNeighborhood(latitude, longitude);
          });
        }
      }
      initialized = true;
      renderUnlocatedNeighborhoods();
    } else if (showingBuildings) {
      const located = new Map<string, NaverBuildingMapPoint>();
      const resolvedAreaReference = (
        reference: NonNullable<NaverBuildingMapPoint['areaReference']>,
      ): NonNullable<NaverBuildingMapPoint['areaReference']> => {
        if (reference.addressQuery === undefined) return reference;
        const cached = locationCache.get(`neighborhood:${reference.id}:${reference.addressQuery}`);
        return cached === undefined ? reference : { ...reference, ...cached };
      };
      const renderBuildings = () => {
        if (!isActive() || map === null) return;
        for (const listener of listeners) sdk.Event.removeListener(listener);
        for (const marker of markers) marker.setMap(null);
        listeners = [];
        markers = [];
        for (const cluster of clusterNaverBuildings([...located.values()], focusAddressQuery ? 17 : map.getZoom?.() ?? 18)) {
          const first = cluster.buildings[0]!;
          if (cluster.buildings.length === 1) {
            addMarker(first.title, cluster.latitude, cluster.longitude,
              () => onSelectBuilding?.(first.id), buildNaverBuildingMarkerContent(first));
          } else {
            const count = cluster.buildings.length;
            addMarker(`${count} ${buildingCountLabel}`, cluster.latitude, cluster.longitude, () => {
              map?.setCenter(new sdk.LatLng(cluster.latitude, cluster.longitude));
              map?.setZoom(Math.min(18, (map.getZoom?.() ?? 14) + 2));
            }, `<div class="spMapClusterBubble"><strong>${count}</strong></div>`);
          }
        }
        const groups = new Map<string, { reference: NonNullable<NaverBuildingMapPoint['areaReference']>; count: number }>();
        let unplaced = 0;
        for (const building of buildingPoints) {
          if (located.has(building.id)) continue;
          const reference = building.areaReference === undefined
            ? undefined
            : resolvedAreaReference(building.areaReference);
          if (reference === undefined || !Number.isFinite(reference.latitude) || !Number.isFinite(reference.longitude)
            || reference.latitude < 37.4 || reference.latitude > 37.72
            || reference.longitude < 126.75 || reference.longitude > 127.25) { unplaced += 1; continue; }
          const group = groups.get(reference.id) ?? { reference, count: 0 };
          group.count += 1;
          groups.set(reference.id, group);
        }
        let additionalCount = 0;
        for (const { reference: sourceReference, count } of areaGroups) {
          if (!Number.isSafeInteger(count) || count <= 0) continue;
          additionalCount += count;
          const reference = resolvedAreaReference(sourceReference);
          if (!Number.isFinite(reference.latitude) || !Number.isFinite(reference.longitude)
            || reference.latitude < 37.4 || reference.latitude > 37.72
            || reference.longitude < 126.75 || reference.longitude > 127.25) { unplaced += count; continue; }
          const group = groups.get(reference.id) ?? { reference, count: 0 };
          group.count += count;
          groups.set(reference.id, group);
        }
        for (const { reference, count } of groups.values()) {
          addMarker(`${reference.title} · ${count} ${buildingCountLabel} · ${areaOnlyLabel}`,
            reference.latitude, reference.longitude, () => {
              if (reference.neighborhoodId !== undefined) onSelectNeighborhood?.(reference.neighborhoodId);
              else {
                const district = districts.find((district) => district.slug === reference.id);
                if (district !== undefined) onSelect(district.href);
              }
            }, `<div class="spMapNeighborhoodBubble spMapAreaGroup"><span>${escapeMarkerText(reference.title)}</span><strong>${count}</strong><small>${escapeMarkerText(areaOnlyLabel)}</small></div>`);
        }
        onCoverageChange?.({ total: buildingPoints.length + additionalCount, located: located.size,
          grouped: buildingPoints.length + additionalCount - located.size - unplaced, unplaced });
      };
      if (map.getZoom !== undefined) zoomListener = sdk.Event.addListener(map, 'zoom_changed', renderBuildings);
      type GeocodeCallback = Parameters<NonNullable<NaverMapsSdk['Service']>['geocode']>[1];
      const geocodeQueue: { query: string; callback: GeocodeCallback }[] = [];
      let activeGeocodes = 0;
      const drainGeocodes = () => {
        if (!isActive() || sdk.Service === undefined) return;
        while (activeGeocodes < 4 && geocodeQueue.length > 0) {
          const job = geocodeQueue.shift()!;
          activeGeocodes += 1;
          sdk.Service.geocode({ query: job.query }, (status, response) => {
            activeGeocodes -= 1;
            if (!isActive()) return;
            job.callback(status, response);
            drainGeocodes();
          });
        }
      };
      const enqueueGeocode = (query: string, callback: GeocodeCallback) => {
        geocodeQueue.push({ query, callback });
        drainGeocodes();
      };
      for (const original of [...buildingPoints].sort((a, b) => Number(b.selected) - Number(a.selected))) {
        const cached = locationCache.get(`${original.id}:${original.addressQuery}`);
        const building = cached === undefined ? original : { ...original, ...cached };
        if (building.latitude !== null && building.longitude !== null
          && Number.isFinite(building.latitude) && Number.isFinite(building.longitude)
          && building.latitude >= 37.4 && building.latitude <= 37.72
          && building.longitude >= 126.75 && building.longitude <= 127.25) {
          located.set(building.id, building);
        } else if (building.allowAddressGeocoding === true && sdk.Service !== undefined) {
          enqueueGeocode(building.addressQuery, (status, response) => {
            if (!isActive()) return;
            const address = resolveUnambiguousNaverGeocode(
              building.addressQuery,
              response.v2?.addresses,
            );
            if (status !== sdk.Service!.Status.OK || address === null) {
              markBuildingUnavailable(building.id);
              return;
            }
            const latitude = Number(address.y);
            const longitude = Number(address.x);
            if (
              !Number.isFinite(latitude) || !Number.isFinite(longitude)
              || latitude < 37.4 || latitude > 37.72
              || longitude < 126.75 || longitude > 127.25
            ) {
              markBuildingUnavailable(building.id);
              return;
            }
            locationCache.set(`${building.id}:${building.addressQuery}`, { latitude, longitude });
            located.set(building.id, { ...building, latitude, longitude });
            renderBuildings();
            if (building.selected === true) {
              map?.setCenter(new sdk.LatLng(latitude, longitude));
              map?.setZoom(17);
              activeSelectedBuildingId = building.id;
            }
            onResolveBuildingLocation?.(building.id, latitude, longitude);
          });
        } else {
          markBuildingUnavailable(building.id);
        }
      }
      if (sdk.Service !== undefined) {
        const references = new Map<string, NonNullable<NaverBuildingMapPoint['areaReference']>>();
        for (const reference of [
          ...buildingPoints.flatMap((building) => building.areaReference === undefined ? [] : [building.areaReference]),
          ...areaGroups.map(({ reference }) => reference),
        ]) {
          if (reference.addressQuery !== undefined) references.set(reference.id, reference);
        }
        for (const reference of references.values()) {
          const cacheKey = `neighborhood:${reference.id}:${reference.addressQuery}`;
          if (locationCache.has(cacheKey)) continue;
          sdk.Service.geocode({ query: reference.addressQuery! }, (status, response) => {
            if (!isActive() || status !== sdk.Service!.Status.OK) return;
            const address = resolveUnambiguousNaverGeocode(reference.addressQuery!, response.v2?.addresses);
            const latitude = Number(address?.y);
            const longitude = Number(address?.x);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
              || latitude < 37.4 || latitude > 37.72
              || longitude < 126.75 || longitude > 127.25) return;
            locationCache.set(cacheKey, { latitude, longitude });
            renderBuildings();
          });
        }
      }
      renderBuildings();
    } else {
      for (const district of districts) {
        addMarker(
          district.nameEn,
          district.latitude,
          district.longitude,
          () => onSelect(district.href),
          buildNaverDistrictMarkerContent(district),
        );
      }
    }
  };

  const dispose = ({ sdkAvailable = true }: Readonly<{ sdkAvailable?: boolean }> = {}) => {
    if (disposed) return;
    clearActiveGeneration(sdkAvailable);
    disposed = true;
    map = null;
  };

  update(initial);
  return Object.freeze({
    get map() { return map; },
    get markers() { return markers; },
    get unavailableBuildingIds() { return unavailableBuildingIds; },
    update,
    invalidate: clearActiveGeneration,
    dispose,
  });
}

export function reconcileNaverDistrictMap(
  current: ReturnType<typeof mountNaverDistrictMap> | null,
  options: MountNaverDistrictMapOptions,
): ReturnType<typeof mountNaverDistrictMap> | null {
  try {
    if (current === null) return mountNaverDistrictMap(options);
    current.update(options);
    return current;
  } catch {
    current?.dispose();
    return null;
  }
}

function BuildingMarkerStatus({ coverage, locale }: Readonly<{
  coverage: Readonly<{ total: number; located: number; grouped: number; unplaced: number }> | null;
  locale: ProductLocale;
}>) {
  if (coverage === null || coverage.total === 0) return null;
  return (
    <p className={styles.markerStatus} role="status">
      {locale === 'ko' ? (
        <>검색 결과 {coverage.total.toLocaleString('ko')}개 · 개별 위치 {coverage.located.toLocaleString('ko')}개 · 지역 묶음 {coverage.grouped.toLocaleString('ko')}개 · 위치 미확인 {coverage.unplaced.toLocaleString('ko')}개. 점선 묶음은 해당 지역의 참고 위치이며 개별 건물 위치가 아닙니다.</>
      ) : (
        <>{coverage.total.toLocaleString('en')} matching buildings · {coverage.located.toLocaleString('en')} located · {coverage.grouped.toLocaleString('en')} area-only · {coverage.unplaced.toLocaleString('en')} unplaced. Dashed groups mark an approximate area reference, not individual building locations.</>
      )}
    </p>
  );
}

export function NaverDistrictMap({
  clientId,
  googleMapsBrowserKey = null,
  districts,
  selectedDistrict,
  focusAddressQuery,
  neighborhoods,
  buildings,
  areaGroups,
  onOpenAreaBuildings,
  onSelectDistrict,
  onSelectNeighborhood,
  onSelectBuilding,
  onResolveBuildingLocation,
  fallback,
  locale = 'en',
}: NaverDistrictMapProps) {
  // Keep one SDK URL across city/district transitions. Reloading NAVER to add
  // a submodule replaces its namespace and can strand an existing map.
  const requiresAddressGeocoding = true;
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const lifecycle = useRef<ReturnType<typeof mountNaverDistrictMap> | null>(null);
  const submoduleWait = useRef<(() => void) | null>(null);
  const authenticationFailed = useRef(false);
  const [sdk, setSdk] = useState<NaverMapsSdk | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [coverage, setCoverage] = useState<Readonly<{ total: number; located: number; grouped: number; unplaced: number }> | null>(null);
  const [googleCoordinates, setGoogleCoordinates] = useState<Readonly<Record<string, Readonly<{
    latitude: number;
    longitude: number;
  }>>>>(Object.freeze({}));
  const [storedLocations, setStoredLocations] = useState<Readonly<Record<string, Readonly<{
    address: string;
    latitude: number | null;
    longitude: number | null;
  }>>>>(Object.freeze({}));
  const selectedUnresolvedBuilding = buildings?.find((building) => (
    building.selected === true
    && building.latitude === null
    && building.longitude === null
  ));
  const resolvedBuildings = useMemo(() => buildings?.map((building) => {
    const stored = storedLocations[building.id];
    const coordinate = googleCoordinates[building.id];
    if (coordinate !== undefined) return Object.freeze({
      ...building,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
    if (stored === undefined) return building;
    return Object.freeze({
      ...building,
      addressQuery: stored.address,
      latitude: stored.latitude,
      longitude: stored.longitude,
      allowAddressGeocoding: building.selected === true && (stored.latitude === null || stored.longitude === null),
    });
  }), [buildings, googleCoordinates, storedLocations]);

  const locationRequest = JSON.stringify((buildings ?? [])
    .filter((building) => building.selected === true && building.storedLocationKey !== undefined && (building.latitude === null || building.longitude === null))
    .toSorted((a, b) => Number(b.selected === true) - Number(a.selected === true))
    .slice(0, 50).map((building) => ({ id: building.id, key: building.storedLocationKey!, district: building.districtSlug })));

  useEffect(() => {
    const requested = JSON.parse(locationRequest) as { id: string; key: string; district?: string }[];
    if (requested.length === 0) return;
    const controller = new AbortController();
    void fetch(`/api/building-location/?keys=${encodeURIComponent(requested.map(({ key }) => key).join(','))}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('location unavailable')))
      .then(async (value: unknown) => {
        if (controller.signal.aborted || typeof value !== 'object' || value === null || !('locations' in value) || !Array.isArray(value.locations)) return;
        const updates: Record<string, { address: string; latitude: number | null; longitude: number | null }> = {};
        for (const item of value.locations) {
          if (typeof item !== 'object' || item === null || typeof item.address !== 'string') continue;
          const match = requested.find(({ key }) => key === item.key);
          if (!match) continue;
          updates[match.id] = {
            address: item.address,
            latitude: typeof item.latitude === 'number' ? item.latitude : null,
            longitude: typeof item.longitude === 'number' ? item.longitude : null,
          };
        }
        // Ask the existing Vercel public-data route for an official address only on selection.
        // That route validates building identity and caches verified facts server-side.
        for (const target of requested) {
          if (updates[target.id]?.latitude != null && updates[target.id]?.longitude != null) continue;
          if (!target.key.startsWith('seoul:') || target.district === undefined) continue;
          try {
            const query = new URLSearchParams({ district: target.district, building: target.id });
            const response = await fetch(`/api/markets/kr-seoul/building-facts/?${query}`, { signal: controller.signal });
            if (!response.ok) continue;
            const result = await response.json();
            const address = result?.facts?.apartment?.legalAddress;
            if (result?.facts?.status === 'ready' && typeof address === 'string' && address.trim()) {
              updates[target.id] = { address, latitude: null, longitude: null };
            }
          } catch { /* Keep the existing area reference if the provider cannot verify this building. */ }
        }
        if (controller.signal.aborted) return;
        if (Object.keys(updates).length > 0) setStoredLocations((current) => Object.freeze({ ...current, ...updates }));
      }).catch(() => undefined);
    return () => controller.abort();
  }, [locationRequest]);

  const resolveSelectedGoogleCoordinate = useCallback(async () => {
    if (googleMapsBrowserKey === null || selectedUnresolvedBuilding === undefined) return;
    const googleSdk = (globalThis as typeof globalThis & {
      google?: Readonly<{ maps: GooglePlaceCoordinateSdk }>;
    }).google?.maps;
    if (googleSdk === undefined || typeof googleSdk.importLibrary !== 'function') return;
    try {
      const { Place } = await googleSdk.importLibrary('places');
      const lookup = buildGoogleBuildingLookup(selectedUnresolvedBuilding);
      const { places } = await Place.searchByText({
        textQuery: lookup.textQuery,
        fields: ['displayName', 'formattedAddress', 'location'],
        maxResultCount: 1,
        language: 'ko',
      });
      const place = places[0];
      const latitude = place?.location?.lat();
      const longitude = place?.location?.lng();
      if (
        !isTrustedGooglePlaceMatch(place?.displayName, lookup.sourceName)
        || !isGoogleBuildingAddressMatch(selectedUnresolvedBuilding.addressQuery, place?.formattedAddress)
        || latitude === undefined || longitude === undefined
        || !Number.isFinite(latitude) || !Number.isFinite(longitude)
        || latitude < 37.4 || latitude > 37.72
        || longitude < 126.75 || longitude > 127.25
      ) return;
      setGoogleCoordinates((current) => current[selectedUnresolvedBuilding.id] !== undefined
        ? current
        : Object.freeze({
            ...current,
            [selectedUnresolvedBuilding.id]: Object.freeze({ latitude, longitude }),
          }));
      onResolveBuildingLocation?.(selectedUnresolvedBuilding.id, latitude, longitude);
    } catch {
      // Fail closed: an unresolved or mismatched place never becomes a map marker.
    }
  }, [googleMapsBrowserKey, onResolveBuildingLocation, selectedUnresolvedBuilding]);

  useEffect(() => {
    if (googleMapsBrowserKey === null || selectedUnresolvedBuilding === undefined) return undefined;
    const handleReady = () => { void resolveSelectedGoogleCoordinate(); };
    window.addEventListener('signedprice:google-maps-ready', handleReady);
    queueMicrotask(handleReady);
    return () => window.removeEventListener('signedprice:google-maps-ready', handleReady);
  }, [googleMapsBrowserKey, resolveSelectedGoogleCoordinate, selectedUnresolvedBuilding]);
  const failClosed = useCallback(() => {
    authenticationFailed.current = true;
    // NAVER nulls its internal namespace before invoking navermap_authFailure.
    // Its old methods remain callable references, but can no longer clean up.
    const sdkAvailable = isNaverMapsSdkReady((globalThis as typeof globalThis & {
      naver?: { maps?: unknown };
    }).naver?.maps);
    lifecycle.current?.dispose({ sdkAvailable });
    lifecycle.current = null;
    setSdk(null);
    setState('error');
  }, []);
  const initialize = useCallback(() => {
    const readySdk = (globalThis as typeof globalThis & {
      naver?: Readonly<{ maps: NaverMapsSdk }>;
    }).naver?.maps;
    if (
      authenticationFailed.current
      || !isNaverMapsSdkReady(readySdk)
      || container.current === null
    ) {
      failClosed();
      return;
    }
    submoduleWait.current?.();
    // Known coordinates and area references do not depend on the geocoder.
    // Render those immediately; refresh once the optional submodule arrives.
    setSdk(readySdk);
    submoduleWait.current = waitForNaverMapsSubmodules(
      readySdk,
      requiresAddressGeocoding,
      (value) => setSdk(value.Service === undefined ? value : { ...value }),
    );
  }, [failClosed, requiresAddressGeocoding]);

  useEffect(() => {
    if (clientId === null || sdk !== null || authenticationFailed.current) return;
    const readySdk = (globalThis as typeof globalThis & {
      naver?: Readonly<{ maps: NaverMapsSdk }>;
    }).naver?.maps;
    if (!isNaverMapsSdkReady(readySdk) || container.current === null) return;
    initialize();
  }, [clientId, initialize, sdk]);

  useEffect(() => {
    if (clientId === null) return undefined;
    const scope = globalThis as typeof globalThis & {
      navermap_authFailure?: () => void;
    };
    const previous = scope.navermap_authFailure;
    const handleAuthenticationFailure = () => {
      try {
        previous?.();
      } finally {
        failClosed();
      }
    };
    scope.navermap_authFailure = handleAuthenticationFailure;
    return () => {
      if (scope.navermap_authFailure === handleAuthenticationFailure) {
        scope.navermap_authFailure = previous;
      }
    };
  }, [clientId, failClosed]);

  useEffect(() => {
    if (clientId === null || sdk === null || container.current === null) return undefined;
    setCoverage(null);
    const options: NaverDistrictMapUpdate = {
      buildingCountLabel: locale === 'ko' ? '개 건물' : 'buildings',
      areaOnlyLabel: locale === 'ko' ? '지역 참고 위치' : 'Area only',
      areaGroups,
      onOpenAreaBuildings,
      districts,
      selectedDistrict,
      focusAddressQuery,
      neighborhoods,
      buildings: resolvedBuildings,
      onSelect: (href) => {
        const district = districts.find((item) => item.href === href);
        if (onSelectDistrict !== undefined && district !== undefined) {
          onSelectDistrict(district.slug);
        } else router.push(href);
      },
      onSelectNeighborhood,
      onSelectBuilding,
      onResolveBuildingLocation,
      onCoverageChange: (next) => setCoverage(current => current?.total === next.total
        && current.located === next.located && current.grouped === next.grouped && current.unplaced === next.unplaced ? current : next),
    };
    const nextLifecycle = reconcileNaverDistrictMap(lifecycle.current, {
      sdk,
      element: container.current,
      ...options,
    });
    if (nextLifecycle === null) {
      failClosed();
      return undefined;
    }
    lifecycle.current = nextLifecycle;
    setState('ready');
    const active = lifecycle.current;
    return () => active.invalidate();
  }, [areaGroups, onOpenAreaBuildings, clientId, districts, failClosed, focusAddressQuery, locale, neighborhoods, onResolveBuildingLocation, onSelectBuilding, onSelectDistrict, onSelectNeighborhood, resolvedBuildings, router, sdk, selectedDistrict]);

  useEffect(() => () => {
    submoduleWait.current?.();
    submoduleWait.current = null;
    lifecycle.current?.dispose();
    lifecycle.current = null;
  }, []);

  const unavailableMessage = (
    <div className={styles.unavailable} role="status">
      <strong>{locale === 'ko' ? '지도를 표시할 수 없습니다' : 'Map unavailable'}</strong>
      <p>{locale === 'ko'
        ? '목록에서 지역과 건물을 계속 탐색할 수 있습니다.'
        : 'Continue browsing the list to select a district or building.'}</p>
    </div>
  );

  const mapTier = selectedDistrict === undefined ? 'districts'
    : neighborhoods !== undefined ? 'neighborhoods' : 'buildings';

  if (clientId === null) return (
    <div className={styles.frame} data-map-provider="static" data-map-state="fallback" data-map-tier={mapTier}>
      {unavailableMessage}
    </div>
  );

  return (
    <div className={styles.frame} data-map-provider="naver" data-map-state={state} data-map-tier={mapTier}>
      <div
        ref={container}
        className={styles.canvas}
        role="region"
        aria-label={locale === 'ko'
          ? mapTier === 'districts' ? '서울 구 네이버 지도'
            : mapTier === 'neighborhoods' ? '서울 동별 건물 수 네이버 지도'
              : '서울 건물 네이버 지도'
          : mapTier === 'districts' ? 'Interactive NAVER map of Seoul districts'
            : mapTier === 'neighborhoods' ? 'Interactive NAVER map of Seoul neighborhood building counts'
              : 'Interactive NAVER map of Seoul buildings'}
      />
      {state === 'ready' ? <BuildingMarkerStatus coverage={coverage} locale={locale} /> : null}
      <div className={state === 'ready' ? styles.fallbackHidden : styles.fallback}>
        {state === 'error' ? unavailableMessage : fallback}
      </div>
      <Script
        src={buildNaverMapsScriptUrl(clientId, requiresAddressGeocoding)}
        strategy="afterInteractive"
        onReady={initialize}
        onError={failClosed}
      />
      {googleMapsBrowserKey === null ? null : <Script
        src={buildGoogleMapsScriptUrl(googleMapsBrowserKey)}
        strategy="lazyOnload"
        onReady={() => { void resolveSelectedGoogleCoordinate(); }}
      />}
    </div>
  );
}
