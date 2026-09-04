'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  buildNaverMapsScriptUrl,
  resolveUnambiguousNaverGeocode,
  type NaverGeocodeAddress,
} from './naver-district-map';
import styles from './building-street-view.module.css';

const NAVER_MAPS_READY_EVENT = 'signedprice:naver-maps-ready';
const NAVER_MAPS_READY_FLAG = '__signedpriceNaverMapsLoaded';
const NAVER_MAPS_READY_CALLBACK = '__signedpriceNaverMapsReady';

type NaverMapsWindow = Window & {
  readonly naver?: Readonly<{ maps: NaverBuildingStreetViewSdk & Partial<NaverBuildingGeocoderSdk> }>;
  [NAVER_MAPS_READY_FLAG]?: boolean;
  [NAVER_MAPS_READY_CALLBACK]?: () => void;
};

function notifyNaverMapsReady() {
  const scope = window as NaverMapsWindow;
  scope[NAVER_MAPS_READY_FLAG] = true;
  window.dispatchEvent(new Event(NAVER_MAPS_READY_EVENT));
}

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

export type NaverBuildingGeocoderSdk = Readonly<{
  Service: Readonly<{
    Status: Readonly<{ OK: string }>;
    geocode: (
      input: Readonly<{ query: string }>,
      callback: (status: string, response: Readonly<{
        v2?: Readonly<{ addresses?: readonly NaverGeocodeAddress[] }>;
      }>) => void,
    ) => void;
  }>;
}>;

export function resolveNaverBuildingLocation({
  sdk,
  addressQuery,
}: Readonly<{
  sdk: NaverBuildingGeocoderSdk;
  addressQuery: string;
}>): Promise<Readonly<{ latitude: number; longitude: number }>> {
  return new Promise((resolve, reject) => {
    sdk.Service.geocode({ query: addressQuery }, (status, response) => {
      if (status !== sdk.Service.Status.OK) {
        reject(new Error('NAVER building location unavailable.'));
        return;
      }
      const address = resolveUnambiguousNaverGeocode(addressQuery, response.v2?.addresses);
      const latitude = Number(address?.y);
      const longitude = Number(address?.x);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        reject(new Error('NAVER building location unavailable.'));
        return;
      }
      resolve(Object.freeze({ latitude, longitude }));
    });
  });
}

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
  addressQuery,
  mapHref,
  preferMap = false,
}: Readonly<{
  clientId: string | null;
  buildingName: string;
  latitude?: number;
  longitude?: number;
  addressQuery?: string;
  mapHref: string;
  preferMap?: boolean;
}>) {
  const container = useRef<HTMLDivElement>(null);
  const mounted = useRef<ReturnType<typeof mountNaverBuildingStreetView> | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'map' | 'unavailable'>('loading');
  const initialize = useCallback(async () => {
    const sdk = (window as NaverMapsWindow).naver?.maps;
    if (sdk === undefined || container.current === null || typeof sdk.Panorama !== 'function') {
      return;
    }
    let location: Readonly<{ latitude: number; longitude: number }>;
    try {
      if (latitude !== undefined && longitude !== undefined) {
        location = { latitude, longitude };
      } else if (addressQuery !== undefined && sdk.Service !== undefined) {
        location = await resolveNaverBuildingLocation({
          sdk: sdk as NaverBuildingStreetViewSdk & NaverBuildingGeocoderSdk,
          addressQuery,
        });
      } else {
        throw new Error('NAVER building location unavailable.');
      }
    } catch {
      setState('unavailable');
      return;
    }
    if (preferMap && typeof sdk.Map === 'function' && typeof sdk.Marker === 'function') {
      try {
        mounted.current?.dispose();
        mountNaverBuildingMap({
          sdk: sdk as NaverBuildingStreetViewSdk & NaverBuildingMapSdk,
          element: container.current,
          buildingName,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        setState('map');
        return;
      } catch {
        setState('unavailable');
        return;
      }
    }
    try {
      mounted.current?.dispose();
      mounted.current = mountNaverBuildingStreetView({
        sdk,
        element: container.current,
        latitude: location.latitude,
        longitude: location.longitude,
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
              latitude: location.latitude,
              longitude: location.longitude,
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
  }, [addressQuery, buildingName, latitude, longitude, preferMap]);

  useEffect(() => {
    const scope = window as NaverMapsWindow;
    const handleReady = () => { void initialize(); };
    scope[NAVER_MAPS_READY_CALLBACK] = notifyNaverMapsReady;
    window.addEventListener(NAVER_MAPS_READY_EVENT, handleReady);
    if (scope[NAVER_MAPS_READY_FLAG] === true || scope.naver?.maps !== undefined) {
      queueMicrotask(handleReady);
    }
    return () => {
      window.removeEventListener(NAVER_MAPS_READY_EVENT, handleReady);
      mounted.current?.dispose();
    };
  }, [initialize]);

  if (clientId === null || state === 'unavailable') return <StreetViewUnavailable mapHref={mapHref} />;
  return (
    <section className={styles.frame} data-building-media="naver-panorama" data-media-state={state}>
      <div ref={container} className={styles.canvas} role="region" aria-label={`Nearby NAVER street view for ${buildingName}`} />
      {state === 'loading' ? <div className={styles.loading} aria-live="polite"><span>Loading nearby view</span><strong>{buildingName}</strong></div> : null}
      <Script
        src={buildNaverMapsScriptUrl(
          clientId,
          addressQuery !== undefined,
          true,
          NAVER_MAPS_READY_CALLBACK,
        )}
        strategy="lazyOnload"
        onReady={() => {
          if ((window as NaverMapsWindow).naver?.maps !== undefined) notifyNaverMapsReady();
        }}
        onError={() => setState('unavailable')}
      />
    </section>
  );
}
