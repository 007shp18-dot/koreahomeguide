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

type NaverDistrictMapProps = Readonly<{
  clientId: string | null;
  districts: readonly NaverDistrictMapPoint[];
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
}>;

type MountNaverDistrictMapOptions = Readonly<{
  sdk: NaverMapsSdk;
  element: HTMLElement;
  districts: readonly NaverDistrictMapPoint[];
  onSelect: (href: string) => void;
}>;

export function buildNaverMapsScriptUrl(clientId: string): string {
  const url = new URL('https://oapi.map.naver.com/openapi/v3/maps.js');
  url.searchParams.set('ncpKeyId', clientId);
  return url.toString();
}

export function mountNaverDistrictMap({
  sdk,
  element,
  districts,
  onSelect,
}: MountNaverDistrictMapOptions) {
  const map = new sdk.Map(element, {
    center: new sdk.LatLng(37.5665, 126.978),
    zoom: 11,
    minZoom: 10,
  });
  const markers = districts.map((district) => {
    const marker = new sdk.Marker({
      map,
      position: new sdk.LatLng(district.latitude, district.longitude),
      title: district.nameEn,
    });
    sdk.Event.addListener(marker, 'click', () => onSelect(district.href));
    return marker;
  });
  return { map, markers } as const;
}

export function NaverDistrictMap({
  clientId,
  districts,
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
      onSelect: (href) => router.push(href),
    });
    setState('ready');
  }, [districts, router]);

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
        aria-label="Interactive NAVER map of Seoul districts"
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
