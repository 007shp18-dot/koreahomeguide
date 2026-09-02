'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

import { buildNaverMapsScriptUrl } from './naver-district-map';
import styles from './building-street-view.module.css';

type NaverPanoramaInstance = Readonly<{
  getLocation: () => Readonly<{ panoId?: string }> | null;
  destroy?: () => void;
}>;

export type NaverBuildingStreetViewSdk = Readonly<{
  LatLng: new (latitude: number, longitude: number) => unknown;
  Panorama: new (
    element: HTMLElement,
    options: Readonly<{ position: unknown }>,
  ) => NaverPanoramaInstance;
  Map?: new (
    element: HTMLElement,
    options: Readonly<{ center: unknown; zoom: number; minZoom: number }>,
  ) => unknown;
  Marker?: new (options: Readonly<{ map: unknown; position: unknown; title: string }>) => unknown;
  Event: Readonly<{
    addListener: (target: unknown, event: 'pano_changed', listener: () => void) => unknown;
    removeListener: (listener: unknown) => void;
  }>;
  jsContentLoaded?: boolean;
  onJSContentLoaded?: () => void;
}>;

export type NaverBuildingMapSdk = Readonly<{
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (
    element: HTMLElement,
    options: Readonly<{ center: unknown; zoom: number; minZoom: number }>,
  ) => unknown;
  Marker: new (options: Readonly<{ map: unknown; position: unknown; title: string }>) => unknown;
}>;

export function mountNaverBuildingMap({
  sdk,
  element,
  buildingName,
  latitude,
  longitude,
}: Readonly<{
  sdk: NaverBuildingMapSdk;
  element: HTMLElement;
  buildingName: string;
  latitude: number;
  longitude: number;
}>) {
  const position = new sdk.LatLng(latitude, longitude);
  const map = new sdk.Map(element, { center: position, zoom: 17, minZoom: 10 });
  new sdk.Marker({ map, position, title: buildingName });
  return map;
}

export function mountNaverBuildingStreetView({
  sdk,
  element,
  latitude,
  longitude,
  onState,
}: Readonly<{
  sdk: NaverBuildingStreetViewSdk;
  element: HTMLElement;
  latitude: number;
  longitude: number;
  onState: (state: 'ready' | 'unavailable') => void;
}>) {
  const panorama = new sdk.Panorama(element, {
    position: new sdk.LatLng(latitude, longitude),
  });
  const listener = sdk.Event.addListener(panorama, 'pano_changed', () => {
    onState(panorama.getLocation()?.panoId ? 'ready' : 'unavailable');
  });
  return Object.freeze({
    dispose: () => {
      sdk.Event.removeListener(listener);
      panorama.destroy?.();
    },
  });
}

function StreetViewUnavailable({ mapHref }: Readonly<{ mapHref: string }>) {
  return (
    <section className={styles.unavailable} data-building-media="street-view-unavailable">
      <strong>Street view unavailable</strong>
      <p>NAVER could not verify a nearby street panorama. Building evidence remains available.</p>
      <Link href={mapHref}>View this building area on the map</Link>
    </section>
  );
}

export function NaverBuildingStreetView({
  clientId,
  buildingName,
  latitude,
  longitude,
  mapHref,
}: Readonly<{
  clientId: string | null;
  buildingName: string;
  latitude: number;
  longitude: number;
  mapHref: string;
}>) {
  const container = useRef<HTMLDivElement>(null);
  const mounted = useRef<ReturnType<typeof mountNaverBuildingStreetView> | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'map' | 'unavailable'>('loading');
  const initialize = useCallback(() => {
    const sdk = (globalThis as typeof globalThis & {
      naver?: Readonly<{ maps: NaverBuildingStreetViewSdk }>;
    }).naver?.maps;
    if (sdk === undefined || container.current === null || typeof sdk.Panorama !== 'function') {
      setState('unavailable');
      return;
    }
    try {
      mounted.current?.dispose();
      mounted.current = mountNaverBuildingStreetView({
        sdk,
        element: container.current,
        latitude,
        longitude,
        onState: (next) => {
          if (next === 'ready') {
            setState('ready');
            return;
          }
          if (container.current === null || typeof sdk.Map !== 'function'
            || typeof sdk.Marker !== 'function') {
            setState('unavailable');
            return;
          }
          try {
            mounted.current?.dispose();
            mountNaverBuildingMap({
              sdk: sdk as NaverBuildingStreetViewSdk & NaverBuildingMapSdk,
              element: container.current,
              buildingName,
              latitude,
              longitude,
            });
            setState('map');
          } catch {
            setState('unavailable');
          }
        },
      });
    } catch {
      setState('unavailable');
    }
  }, [buildingName, latitude, longitude]);

  useEffect(() => () => mounted.current?.dispose(), []);

  if (clientId === null || state === 'unavailable') return <StreetViewUnavailable mapHref={mapHref} />;
  return (
    <section className={styles.frame} data-building-media="naver-panorama" data-media-state={state}>
      <div ref={container} className={styles.canvas} role="region" aria-label={`Nearby NAVER street view for ${buildingName}`} />
      <p className={styles.label}>{state === 'map'
        ? 'Live area map · nearby street view unavailable · NAVER'
        : 'Nearby street view · not a listing photo · NAVER'}</p>
      <Script
        src={buildNaverMapsScriptUrl(clientId, false, true)}
        strategy="lazyOnload"
        onReady={initialize}
        onError={() => setState('unavailable')}
      />
    </section>
  );
}
