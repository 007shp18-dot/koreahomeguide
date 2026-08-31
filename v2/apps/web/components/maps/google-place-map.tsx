'use client';

import Script from 'next/script';
import { useCallback, useRef, useState, type FormEvent } from 'react';

import styles from './interactive-map.module.css';

type GoogleLocation = Readonly<{ lat: () => number; lng: () => number }>;
type GoogleGeocoderResult = Readonly<{
  formatted_address: string;
  geometry: Readonly<{ location: GoogleLocation; viewport: unknown }>;
}>;

export type GoogleMapInstance = Readonly<{
  fitBounds: (viewport: unknown) => void;
}>;
export type GoogleMarkerInstance = Readonly<{
  setPosition: (location: GoogleLocation) => void;
  setMap: (map: GoogleMapInstance) => void;
}>;
export type GoogleGeocoderInstance = Readonly<{
  geocode: (request: Readonly<{
    address: string;
    componentRestrictions: Readonly<{ country: 'SG' }>;
    region: 'SG';
  }>) => Promise<Readonly<{ results: readonly GoogleGeocoderResult[] }>>;
}>;
export type GoogleMapsSdk = Readonly<{
  Map: new (
    element: HTMLElement,
    options: Readonly<{
      center: Readonly<{ lat: number; lng: number }>;
      zoom: number;
      mapTypeControl: boolean;
      streetViewControl: boolean;
    }>,
  ) => GoogleMapInstance;
  Marker: new () => GoogleMarkerInstance;
  Geocoder: new () => GoogleGeocoderInstance;
}>;

export type GooglePlaceMapRuntime = Readonly<{
  map: GoogleMapInstance;
  marker: GoogleMarkerInstance;
  geocoder: GoogleGeocoderInstance;
}>;

export function buildGoogleMapsScriptUrl(browserKey: string): string {
  const url = new URL('https://maps.googleapis.com/maps/api/js');
  url.searchParams.set('key', browserKey);
  url.searchParams.set('loading', 'async');
  url.searchParams.set('v', 'weekly');
  url.searchParams.set('language', 'en');
  url.searchParams.set('region', 'SG');
  return url.toString();
}

export function mountGooglePlaceMap({
  sdk,
  element,
}: Readonly<{ sdk: GoogleMapsSdk; element: HTMLElement }>): GooglePlaceMapRuntime {
  const map = new sdk.Map(element, {
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 11,
    mapTypeControl: false,
    streetViewControl: false,
  });
  return Object.freeze({
    map,
    marker: new sdk.Marker(),
    geocoder: new sdk.Geocoder(),
  });
}

export async function geocodeGoogleAddress({
  map,
  marker,
  geocoder,
  address,
}: GooglePlaceMapRuntime & Readonly<{ address: string }>): Promise<string> {
  const { results } = await geocoder.geocode({
    address,
    componentRestrictions: { country: 'SG' },
    region: 'SG',
  });
  const result = results[0];
  if (result === undefined) throw new Error('No Singapore address found.');
  map.fitBounds(result.geometry.viewport);
  marker.setPosition(result.geometry.location);
  marker.setMap(map);
  return result.formatted_address;
}

export function GooglePlaceMap({ browserKey }: Readonly<{ browserKey: string | null }>) {
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<GooglePlaceMapRuntime | null>(null);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('Search results will appear on this Google map.');
  const [searching, setSearching] = useState(false);

  const initialize = useCallback(() => {
    const sdk = (globalThis as typeof globalThis & {
      google?: Readonly<{ maps: GoogleMapsSdk }>;
    }).google?.maps;
    if (sdk === undefined || container.current === null) {
      setMapState('error');
      return;
    }
    runtime.current = mountGooglePlaceMap({ sdk, element: container.current });
    setMapState('ready');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = query.trim();
    if (address === '' || runtime.current === null) {
      setMessage(address === '' ? 'Enter a Singapore address.' : 'Google map is not ready.');
      return;
    }
    setSearching(true);
    try {
      setMessage(await geocodeGoogleAddress({ ...runtime.current, address }));
    } catch {
      setMessage('No Singapore address found. Check the address and try again.');
    } finally {
      setSearching(false);
    }
  }

  if (browserKey === null) return (
    <div className={styles.unavailable} data-map-provider="static" data-map-state="fallback">
      Interactive Google map unavailable in this environment.
    </div>
  );

  return (
    <div className={styles.placeWorkspace} data-map-provider="google" data-map-state={mapState}>
      <form className={styles.toolbar} onSubmit={submit}>
        <label htmlFor="singapore-map-address">Search a Singapore address</label>
        <div>
          <input
            id="singapore-map-address"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="street-address"
            placeholder="e.g. 10 Bayfront Avenue"
          />
          <button type="submit" disabled={searching || mapState !== 'ready'}>
            {searching ? 'Searching…' : 'Show on map'}
          </button>
        </div>
        <p aria-live="polite">{message}</p>
      </form>
      <div
        ref={container}
        className={styles.canvas}
        role="region"
        aria-label="Interactive Google map of Singapore"
      />
      <Script
        src={buildGoogleMapsScriptUrl(browserKey)}
        strategy="afterInteractive"
        onReady={initialize}
        onError={() => setMapState('error')}
      />
    </div>
  );
}
