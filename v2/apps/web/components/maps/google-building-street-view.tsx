'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useRef, useState } from 'react';

import { buildGoogleMapsScriptUrl } from './google-place-map';
import styles from './building-street-view.module.css';

export type GoogleBuildingStreetViewSdk = Readonly<{
  StreetViewService: new () => Readonly<{
    getPanorama: (request: Readonly<{
      location: Readonly<{ lat: number; lng: number }>;
      radius: number;
      source: unknown;
    }>) => Promise<Readonly<{
      data: Readonly<{ location?: Readonly<{ pano?: string }> }>;
    }>>;
  }>;
  StreetViewPanorama: new (
    element: HTMLElement,
    options: Readonly<{
      pano: string;
      addressControl: boolean;
      fullscreenControl: boolean;
    }>,
  ) => unknown;
  StreetViewSource: Readonly<{ OUTDOOR: unknown }>;
}>;

export type GoogleBuildingMapSdk = Readonly<{
  Map: new (
    element: HTMLElement,
    options: Readonly<{
      center: Readonly<{ lat: number; lng: number }>;
      zoom: number;
      mapTypeControl: boolean;
      streetViewControl: boolean;
    }>,
  ) => unknown;
  importLibrary?: (library: 'maps') => Promise<unknown>;
}>;

export type GoogleBuildingGeocoderSdk = Readonly<{
  Geocoder: new () => Readonly<{
    geocode: (request: Readonly<{
      address: string;
      componentRestrictions: Readonly<{ country: 'SG' }>;
      region: 'SG';
    }>) => Promise<Readonly<{ results: readonly Readonly<{
      geometry: Readonly<{ location: Readonly<{ lat: () => number; lng: () => number }> }>;
    }>[] }>>;
  }>;
}>;

export async function resolveGoogleBuildingLocation({
  sdk,
  address,
}: Readonly<{ sdk: GoogleBuildingGeocoderSdk; address: string }>): Promise<Readonly<{
  latitude: number;
  longitude: number;
}>> {
  const { results } = await new sdk.Geocoder().geocode({
    address,
    componentRestrictions: { country: 'SG' },
    region: 'SG',
  });
  const location = results[0]?.geometry.location;
  if (location === undefined) throw new Error('Singapore building location unavailable.');
  const latitude = location.lat();
  const longitude = location.lng();
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Singapore building location unavailable.');
  }
  return Object.freeze({ latitude, longitude });
}

export function mountGoogleBuildingMap({
  sdk,
  element,
  latitude,
  longitude,
}: Readonly<{
  sdk: GoogleBuildingMapSdk;
  element: HTMLElement;
  latitude: number;
  longitude: number;
}>) {
  return new sdk.Map(element, {
    center: { lat: latitude, lng: longitude },
    zoom: 17,
    mapTypeControl: false,
    streetViewControl: false,
  });
}

export async function mountGoogleBuildingStreetView({
  sdk,
  element,
  latitude,
  longitude,
}: Readonly<{
  sdk: GoogleBuildingStreetViewSdk;
  element: HTMLElement;
  latitude: number;
  longitude: number;
}>): Promise<'ready' | 'unavailable'> {
  try {
    const response = await new sdk.StreetViewService().getPanorama({
      location: { lat: latitude, lng: longitude },
      radius: 50,
      source: sdk.StreetViewSource.OUTDOOR,
    });
    const pano = response.data.location?.pano;
    if (pano === undefined || pano === '') return 'unavailable';
    new sdk.StreetViewPanorama(element, {
      pano,
      addressControl: false,
      fullscreenControl: true,
    });
    return 'ready';
  } catch {
    return 'unavailable';
  }
}

export function GoogleBuildingStreetView({
  browserKey,
  buildingName,
  latitude,
  longitude,
  address,
  mapHref,
}: Readonly<{
  browserKey: string | null;
  buildingName: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  mapHref: string;
}>) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'map' | 'unavailable'>('loading');
  const initialize = useCallback(async () => {
    const sdk = (globalThis as typeof globalThis & {
      google?: Readonly<{ maps: GoogleBuildingStreetViewSdk
        & Partial<GoogleBuildingMapSdk & GoogleBuildingGeocoderSdk> }>;
    }).google?.maps;
    if (sdk === undefined || container.current === null) {
      setState('unavailable');
      return;
    }
    let location: Readonly<{ latitude: number; longitude: number }>;
    try {
      if (latitude !== undefined && longitude !== undefined) location = { latitude, longitude };
      else if (address !== undefined && typeof sdk.Geocoder === 'function') {
        location = await resolveGoogleBuildingLocation({
          sdk: sdk as GoogleBuildingStreetViewSdk & GoogleBuildingGeocoderSdk,
          address,
        });
      } else throw new Error('Singapore building location unavailable.');
    } catch {
      setState('unavailable');
      return;
    }
    const next = await mountGoogleBuildingStreetView({
      sdk,
      element: container.current,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    if (next === 'ready') {
      setState('ready');
      return;
    }
    try {
      let mapSdk = sdk as GoogleBuildingStreetViewSdk & Partial<GoogleBuildingMapSdk>;
      if (typeof mapSdk.Map !== 'function' && typeof mapSdk.importLibrary === 'function') {
        await mapSdk.importLibrary('maps');
        mapSdk = (globalThis as typeof globalThis & {
          google?: Readonly<{ maps: GoogleBuildingStreetViewSdk & GoogleBuildingMapSdk }>;
        }).google?.maps ?? mapSdk;
      }
      if (typeof mapSdk.Map !== 'function') throw new Error('Google map library unavailable.');
      mountGoogleBuildingMap({
        sdk: mapSdk as GoogleBuildingStreetViewSdk & GoogleBuildingMapSdk,
        element: container.current,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setState('map');
    } catch {
      setState('unavailable');
    }
  }, [address, latitude, longitude]);

  if (browserKey === null || state === 'unavailable') return (
    <section className={styles.unavailable} data-building-media="street-view-unavailable">
      <strong>Street view unavailable</strong>
      <p>Google could not verify nearby outdoor imagery. Building evidence remains available.</p>
      <Link href={mapHref}>View this building area on the map</Link>
    </section>
  );
  return (
    <section className={styles.frame} data-building-media="google-street-view" data-media-state={state}>
      <div ref={container} className={styles.canvas} role="region" aria-label={`Nearby Google Street View for ${buildingName}`} />
      <p className={styles.label}>{state === 'map'
        ? 'Live area map · nearby street view unavailable · Google'
        : 'Nearby street view · not a listing photo · Google'}</p>
      <Script
        src={buildGoogleMapsScriptUrl(browserKey)}
        strategy="lazyOnload"
        onReady={() => { void initialize(); }}
        onError={() => setState('unavailable')}
      />
    </section>
  );
}
