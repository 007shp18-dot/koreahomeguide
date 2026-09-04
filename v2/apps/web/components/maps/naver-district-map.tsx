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
  title: string;
  href: string;
  addressQuery: string;
  latitude: number | null;
  longitude: number | null;
  allowAddressGeocoding?: boolean;
  metricLabel?: string | null;
  sampleLabel?: string;
  selected?: boolean;
}>;

type NaverMapInstance = Readonly<{
  setCenter: (center: unknown) => void;
  setZoom: (zoom: number) => void;
}>;

type NaverMarkerInstance = Readonly<{
  setMap: (map: unknown | null) => void;
}>;

type NaverDistrictMapProps = Readonly<{
  clientId: string | null;
  googleMapsBrowserKey?: string | null;
  districts: readonly NaverDistrictMapPoint[];
  selectedDistrict?: Readonly<{ latitude: number; longitude: number }>;
  buildings?: readonly NaverBuildingMapPoint[];
  onSelectDistrict?: (slug: string) => void;
  onSelectBuilding?: (id: string) => void;
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
    addListener(target: unknown, event: 'click', listener: () => void): unknown;
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

type NaverDistrictMapUpdate = Readonly<{
  districts: readonly NaverDistrictMapPoint[];
  selectedDistrict?: Readonly<{ latitude: number; longitude: number }>;
  buildings?: readonly NaverBuildingMapPoint[];
  onSelect: (href: string) => void;
  onSelectBuilding?: (id: string) => void;
  onBuildingMarkerUnavailable?: (id: string) => void;
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
  const sample = district.sampleLabel === undefined
    ? ''
    : `<small>${escapeMarkerText(district.sampleLabel)}</small>`;
  return `<div class="spMapDistrictBubble${selectedClass}"><span>${escapeMarkerText(district.nameEn)}</span><strong>${escapeMarkerText(district.metricLabel)}</strong>${sample}</div>`;
}

/** Price-and-location label rendered for buildings after a district is opened. */
export function buildNaverBuildingMarkerContent(building: NaverBuildingMapPoint): string {
  const selectedClass = building.selected === true ? ' spMapBuildingBubbleSelected' : '';
  const metric = building.metricLabel ?? '—';
  const sample = building.sampleLabel === undefined
    ? ''
    : `<small>${escapeMarkerText(building.sampleLabel)}</small>`;
  return `<div class="spMapBuildingBubble${selectedClass}"><span>${escapeMarkerText(building.title)}</span><strong>${escapeMarkerText(metric)}</strong>${sample}</div>`;
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
  const localityMatches = addresses.filter((address) => {
    const resolvedLocality = `${address.roadAddress ?? ''} ${address.jibunAddress ?? ''}`;
    return resolvedLocality.includes(district) && resolvedLocality.includes(neighborhood);
  });
  return localityMatches.length === 1 ? localityMatches[0]! : null;
}

export function mountNaverDistrictMap({
  sdk,
  element,
  ...initial
}: MountNaverDistrictMapOptions) {
  let map: NaverMapInstance | null = null;
  let markers: NaverMarkerInstance[] = [];
  let listeners: unknown[] = [];
  let unavailableBuildingIds: string[] = [];
  let generation = 0;
  let disposed = false;

  const clearActiveGeneration = () => {
    generation += 1;
    for (const listener of listeners) {
      sdk.Event.removeListener(listener);
    }
    for (const marker of markers) marker.setMap(null);
    listeners = [];
    markers = [];
    unavailableBuildingIds = [];
  };

  const update = ({
    districts,
    selectedDistrict,
    buildings = [],
    onSelect,
    onSelectBuilding,
    onBuildingMarkerUnavailable,
  }: NaverDistrictMapUpdate) => {
    if (disposed) throw new TypeError('Disposed NAVER map cannot be updated.');
    clearActiveGeneration();
    const activeGeneration = generation;
    const showingBuildings = selectedDistrict !== undefined;
    const center = new sdk.LatLng(
      selectedDistrict?.latitude ?? 37.5665,
      selectedDistrict?.longitude ?? 126.978,
    );
    const zoom = showingBuildings ? 14 : 11;
    if (map === null) {
      map = new sdk.Map(element, { center, zoom, minZoom: 10 });
    } else {
      map.setCenter(center);
      map.setZoom(zoom);
    }
    const isActive = () => !disposed && generation === activeGeneration;
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

    if (showingBuildings) {
      for (const building of buildings) {
        if (building.latitude !== null && building.longitude !== null) {
          addMarker(
            building.title,
            building.latitude,
            building.longitude,
            () => onSelectBuilding?.(building.id),
            buildNaverBuildingMarkerContent(building),
          );
        } else if (building.allowAddressGeocoding === true && sdk.Service !== undefined) {
          sdk.Service.geocode({ query: building.addressQuery }, (status, response) => {
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
            addMarker(
              building.title,
              latitude,
              longitude,
              () => onSelectBuilding?.(building.id),
              buildNaverBuildingMarkerContent(building),
            );
          });
        } else {
          markBuildingUnavailable(building.id);
        }
      }
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

  const dispose = () => {
    if (disposed) return;
    clearActiveGeneration();
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

function BuildingMarkerStatus({
  count,
  locale,
}: Readonly<{ count: number; locale: ProductLocale }>) {
  if (count === 0) return null;
  return (
    <p className={styles.markerStatus} role="status">
      {locale === 'ko' ? (
        <>네이버에서 위치를 확인하지 못해 건물 {count}개의 지도 표식을 표시하지 못했습니다. 건물 목록에서 근거를 확인하세요.</>
      ) : (
        <>{count === 1 ? 'Map marker' : 'Map markers'} unavailable for{' '}
          {count} {count === 1 ? 'building' : 'buildings'}
          {' '}because Naver could not verify the location. Use the building list to open evidence.</>
      )}
    </p>
  );
}

export function NaverDistrictMap({
  clientId,
  googleMapsBrowserKey = null,
  districts,
  selectedDistrict,
  buildings,
  onSelectDistrict,
  onSelectBuilding,
  fallback,
  locale = 'en',
}: NaverDistrictMapProps) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const lifecycle = useRef<ReturnType<typeof mountNaverDistrictMap> | null>(null);
  const submoduleWait = useRef<(() => void) | null>(null);
  const authenticationFailed = useRef(false);
  const [sdk, setSdk] = useState<NaverMapsSdk | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [unavailableBuildingIds, setUnavailableBuildingIds] = useState<readonly string[]>([]);
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
      allowAddressGeocoding: stored.latitude === null || stored.longitude === null,
    });
  }), [buildings, googleCoordinates, storedLocations]);

  useEffect(() => {
    const selected = buildings?.find((building) => building.selected === true);
    if (selected?.storedLocationKey === undefined || storedLocations[selected.id] !== undefined) return undefined;
    const controller = new AbortController();
    void fetch(`/api/building-location/?key=${encodeURIComponent(selected.storedLocationKey)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('location unavailable')))
      .then((value: unknown) => {
        if (typeof value !== 'object' || value === null) return;
        const item = value as Record<string, unknown>;
        if (typeof item.address !== 'string') return;
        const address = item.address;
        setStoredLocations((current) => Object.freeze({
          ...current,
          [selected.id]: Object.freeze({
            address,
            latitude: typeof item.latitude === 'number' ? item.latitude : null,
            longitude: typeof item.longitude === 'number' ? item.longitude : null,
          }),
        }));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [buildings, storedLocations]);

  const resolveSelectedGoogleCoordinate = useCallback(async () => {
    if (googleMapsBrowserKey === null || selectedUnresolvedBuilding === undefined) return;
    const googleSdk = (globalThis as typeof globalThis & {
      google?: Readonly<{ maps: GooglePlaceCoordinateSdk }>;
    }).google?.maps;
    if (googleSdk === undefined || typeof googleSdk.importLibrary !== 'function') return;
    try {
      const { Place } = await googleSdk.importLibrary('places');
      const { places } = await Place.searchByText({
        textQuery: `${selectedUnresolvedBuilding.title}, ${selectedUnresolvedBuilding.addressQuery}`,
        fields: ['displayName', 'location'],
        maxResultCount: 1,
        language: 'ko',
      });
      const place = places[0];
      const latitude = place?.location?.lat();
      const longitude = place?.location?.lng();
      if (
        !isTrustedGooglePlaceMatch(place?.displayName, selectedUnresolvedBuilding.title)
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
    } catch {
      // Fail closed: an unresolved or mismatched place never becomes a map marker.
    }
  }, [googleMapsBrowserKey, selectedUnresolvedBuilding]);

  useEffect(() => {
    if (googleMapsBrowserKey === null || selectedUnresolvedBuilding === undefined) return undefined;
    const handleReady = () => { void resolveSelectedGoogleCoordinate(); };
    window.addEventListener('signedprice:google-maps-ready', handleReady);
    queueMicrotask(handleReady);
    return () => window.removeEventListener('signedprice:google-maps-ready', handleReady);
  }, [googleMapsBrowserKey, resolveSelectedGoogleCoordinate, selectedUnresolvedBuilding]);
  const failClosed = useCallback(() => {
    authenticationFailed.current = true;
    lifecycle.current?.dispose();
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
    submoduleWait.current = waitForNaverMapsSubmodules(
      readySdk,
      buildings?.some(({ allowAddressGeocoding }) => allowAddressGeocoding === true) ?? false,
      setSdk,
    );
  }, [buildings, failClosed]);

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
    setUnavailableBuildingIds((current) => current.length === 0 ? current : []);
    const options: NaverDistrictMapUpdate = {
      districts,
      selectedDistrict,
      buildings: resolvedBuildings,
      onSelect: (href) => {
        const district = districts.find((item) => item.href === href);
        if (onSelectDistrict !== undefined && district !== undefined) {
          onSelectDistrict(district.slug);
        } else router.push(href);
      },
      onSelectBuilding,
      onBuildingMarkerUnavailable: (buildingId) => {
        setUnavailableBuildingIds((current) => current.includes(buildingId)
          ? current
          : Object.freeze([...current, buildingId]));
      },
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
  }, [clientId, districts, failClosed, onSelectBuilding, onSelectDistrict, resolvedBuildings, router, sdk, selectedDistrict]);

  useEffect(() => () => {
    submoduleWait.current?.();
    submoduleWait.current = null;
    lifecycle.current?.dispose();
    lifecycle.current = null;
  }, []);

  if (clientId === null) return (
    <div className={styles.frame} data-map-provider="static" data-map-state="fallback">
      {fallback}
    </div>
  );

  return (
    <div className={styles.frame} data-map-provider="naver" data-map-state={state}>
      <div
        ref={container}
        className={styles.canvas}
        role="region"
        aria-label={locale === 'ko'
          ? selectedDistrict !== undefined ? '서울 건물 네이버 지도' : '서울 구 네이버 지도'
          : selectedDistrict !== undefined
            ? 'Interactive NAVER map of Seoul buildings'
            : 'Interactive NAVER map of Seoul districts'}
      />
      <BuildingMarkerStatus count={unavailableBuildingIds.length} locale={locale} />
      <div className={state === 'ready' ? styles.fallbackHidden : styles.fallback}>
        {fallback}
      </div>
      <Script
        src={buildNaverMapsScriptUrl(clientId, true)}
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
