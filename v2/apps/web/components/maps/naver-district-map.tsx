'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import type { ProductLocale } from '../../lib/locale/product-copy';
import styles from './interactive-map.module.css';

export type NaverDistrictMapPoint = Readonly<{
  slug: string;
  nameEn: string;
  href: string;
  latitude: number;
  longitude: number;
}>;

export type NaverBuildingMapPoint = Readonly<{
  id: string;
  title: string;
  href: string;
  addressQuery: string;
  latitude: number | null;
  longitude: number | null;
  allowAddressGeocoding?: boolean;
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
  districts: readonly NaverDistrictMapPoint[];
  selectedDistrict?: Readonly<{ latitude: number; longitude: number }>;
  buildings?: readonly NaverBuildingMapPoint[];
  onSelectDistrict?: (slug: string) => void;
  onSelectBuilding?: (id: string) => void;
  fallback: ReactNode;
  locale?: ProductLocale;
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
        v2?: Readonly<{ addresses?: readonly Readonly<{ x: string; y: string }>[] }>;
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

export function buildNaverMapsScriptUrl(
  clientId: string,
  includeGeocoder = false,
): string {
  const url = new URL('https://oapi.map.naver.com/openapi/v3/maps.js');
  url.searchParams.set('ncpKeyId', clientId);
  if (includeGeocoder) url.searchParams.set('submodules', 'geocoder');
  return url.toString();
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
    const showingBuildings = selectedDistrict !== undefined && buildings.length > 0;
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
    ) => {
      if (!isActive() || map === null) return;
      const marker = new sdk.Marker({
        map,
        position: new sdk.LatLng(latitude, longitude),
        title,
      });
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
          );
        } else if (building.allowAddressGeocoding === true && sdk.Service !== undefined) {
          sdk.Service.geocode({ query: building.addressQuery }, (status, response) => {
            if (!isActive()) return;
            const address = response.v2?.addresses?.[0];
            if (status !== sdk.Service!.Status.OK || address === undefined) {
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

export function NaverDistrictMap({
  clientId,
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
  const authenticationFailed = useRef(false);
  const [sdk, setSdk] = useState<NaverMapsSdk | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [unavailableBuildingIds, setUnavailableBuildingIds] = useState<readonly string[]>([]);
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
    setSdk(readySdk);
  }, [failClosed]);

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
      buildings,
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
  }, [buildings, clientId, districts, failClosed, onSelectBuilding, onSelectDistrict, router, sdk, selectedDistrict]);

  useEffect(() => () => {
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
          ? buildings?.length ? '서울 건물 네이버 지도' : '서울 구 네이버 지도'
          : buildings?.length
            ? 'Interactive NAVER map of Seoul buildings'
            : 'Interactive NAVER map of Seoul districts'}
      />
      {unavailableBuildingIds.length === 0 ? null : (
        <p className={styles.markerStatus} role="status">
          {locale === 'ko' ? (
            <>네이버에서 위치를 확인하지 못해 건물 {unavailableBuildingIds.length}개의 지도 표식을 표시하지 못했습니다. 건물 목록에서 근거를 확인하세요.</>
          ) : (
            <>{unavailableBuildingIds.length === 1 ? 'Map marker' : 'Map markers'} unavailable for{' '}
              {unavailableBuildingIds.length} {unavailableBuildingIds.length === 1 ? 'building' : 'buildings'}
              {' '}because Naver could not verify the location. Use the building list to open evidence.</>
          )}
        </p>
      )}
      <div className={state === 'ready' ? styles.fallbackHidden : styles.fallback}>
        {fallback}
      </div>
      <Script
        src={buildNaverMapsScriptUrl(
          clientId,
          buildings?.some(({ allowAddressGeocoding }) => allowAddressGeocoding === true) ?? false,
        )}
        strategy="afterInteractive"
        onReady={initialize}
        onError={failClosed}
      />
    </div>
  );
}
