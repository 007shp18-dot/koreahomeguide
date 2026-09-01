'use client';

import Script from 'next/script';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
}>;

type NaverDistrictMapProps = Readonly<{
  clientId: string | null;
  districts: readonly NaverDistrictMapPoint[];
  selectedDistrict?: Readonly<{ latitude: number; longitude: number }>;
  buildings?: readonly NaverBuildingMapPoint[];
  onSelectDistrict?: (slug: string) => void;
  onSelectBuilding?: (id: string) => void;
  fallback: ReactNode;
}>;

export type NaverMapsSdk = Readonly<{
  Map: new (
    element: HTMLElement,
    options: Readonly<{ center: unknown; zoom: number; minZoom: number }>,
  ) => unknown;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Marker: new (options: Readonly<{
    map: unknown;
    position: unknown;
    title: string;
  }>) => unknown;
  Event: Readonly<{
    addListener: (target: unknown, event: 'click', listener: () => void) => void;
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

type MountNaverDistrictMapOptions = Readonly<{
  sdk: NaverMapsSdk;
  element: HTMLElement;
  districts: readonly NaverDistrictMapPoint[];
  selectedDistrict?: Readonly<{ latitude: number; longitude: number }>;
  buildings?: readonly NaverBuildingMapPoint[];
  onSelect: (href: string) => void;
  onSelectBuilding?: (id: string) => void;
}>;

export function buildNaverMapsScriptUrl(clientId: string): string {
  const url = new URL('https://oapi.map.naver.com/openapi/v3/maps.js');
  url.searchParams.set('ncpKeyId', clientId);
  url.searchParams.set('submodules', 'geocoder');
  return url.toString();
}

export function mountNaverDistrictMap({
  sdk,
  element,
  districts,
  selectedDistrict,
  buildings = [],
  onSelect,
  onSelectBuilding,
}: MountNaverDistrictMapOptions) {
  const showingBuildings = selectedDistrict !== undefined && buildings.length > 0;
  const map = new sdk.Map(element, {
    center: new sdk.LatLng(
      selectedDistrict?.latitude ?? 37.5665,
      selectedDistrict?.longitude ?? 126.978,
    ),
    zoom: showingBuildings ? 14 : 11,
    minZoom: 10,
  });
  const createBuildingMarker = (
    building: NaverBuildingMapPoint,
    latitude: number,
    longitude: number,
  ) => {
    const marker = new sdk.Marker({
      map,
      position: new sdk.LatLng(latitude, longitude),
      title: building.title,
    });
    sdk.Event.addListener(marker, 'click', () => onSelectBuilding?.(building.id));
    return marker;
  };
  const markers: unknown[] = [];
  if (showingBuildings) {
    for (const building of buildings) {
      if (building.latitude !== null && building.longitude !== null) {
        markers.push(createBuildingMarker(building, building.latitude, building.longitude));
      } else if (sdk.Service !== undefined) {
        sdk.Service.geocode({ query: building.addressQuery }, (status, response) => {
          const address = response.v2?.addresses?.[0];
          if (status !== sdk.Service!.Status.OK || address === undefined) return;
          const latitude = Number(address.y);
          const longitude = Number(address.x);
          if (
            latitude < 37.4 || latitude > 37.72
            || longitude < 126.75 || longitude > 127.25
          ) return;
          markers.push(createBuildingMarker(building, latitude, longitude));
        });
      }
    }
  } else {
    markers.push(...districts.map((district) => {
      const marker = new sdk.Marker({
        map,
        position: new sdk.LatLng(district.latitude, district.longitude),
        title: district.nameEn,
      });
      sdk.Event.addListener(marker, 'click', () => onSelect(district.href));
      return marker;
    }));
  }
  return { map, markers } as const;
}

export function NaverDistrictMap({
  clientId,
  districts,
  selectedDistrict,
  buildings,
  onSelectDistrict,
  onSelectBuilding,
  fallback,
}: NaverDistrictMapProps) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const initialize = useCallback(() => {
    const sdk = (globalThis as typeof globalThis & {
      naver?: Readonly<{ maps: NaverMapsSdk }>;
    }).naver?.maps;
    if (sdk === undefined || container.current === null) {
      setState('error');
      return;
    }
    mountNaverDistrictMap({
      sdk,
      element: container.current,
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
    });
    setState('ready');
  }, [buildings, districts, onSelectBuilding, onSelectDistrict, router, selectedDistrict]);

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
        aria-label={buildings?.length ? 'Interactive NAVER map of Seoul buildings' : 'Interactive NAVER map of Seoul districts'}
      />
      <div className={state === 'ready' ? styles.fallbackHidden : styles.fallback}>
        {fallback}
      </div>
      <Script
        src={buildNaverMapsScriptUrl(clientId)}
        strategy="afterInteractive"
        onReady={initialize}
        onError={() => setState('error')}
      />
    </div>
  );
}
