'use client';

import Script from 'next/script';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';

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
  setMap: (map: GoogleMapInstance | null) => void;
}>;
export type GoogleMarketMapPoint = Readonly<{
  id: string;
  title: string;
  label: string;
  latitude?: number;
  longitude?: number;
  address?: string;
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
  Marker: new (options?: Readonly<{
    map: GoogleMapInstance;
    position: Readonly<{ lat: number; lng: number }>;
    title: string;
    label: Readonly<{ text: string; className: string }>;
  }>) => GoogleMarkerInstance;
  Geocoder: new () => GoogleGeocoderInstance;
}>;

export type GooglePlaceMapRuntime = Readonly<{
  map: GoogleMapInstance;
  marker: GoogleMarkerInstance;
  geocoder: GoogleGeocoderInstance;
}>;

export const GOOGLE_MAPS_READY_CALLBACK = '__signedpriceGoogleMapsReady' as const;
const GOOGLE_MAPS_READY_EVENT = 'signedprice:google-maps-ready' as const;
const GOOGLE_MAPS_READY_FLAG = '__signedpriceGoogleMapsLoaded' as const;

type GoogleMapsReadyScope = {
  [GOOGLE_MAPS_READY_CALLBACK]?: () => void;
  [GOOGLE_MAPS_READY_FLAG]?: boolean;
};

export function installGoogleMapsReadyCallback(
  scope: GoogleMapsReadyScope,
  onReady: () => void,
): () => void {
  const previous = scope[GOOGLE_MAPS_READY_CALLBACK];
  scope[GOOGLE_MAPS_READY_CALLBACK] = onReady;
  return () => {
    if (scope[GOOGLE_MAPS_READY_CALLBACK] !== onReady) return;
    if (previous === undefined) delete scope[GOOGLE_MAPS_READY_CALLBACK];
    else scope[GOOGLE_MAPS_READY_CALLBACK] = previous;
  };
}

if (typeof window !== 'undefined') {
  const scope = window as Window & GoogleMapsReadyScope;
  installGoogleMapsReadyCallback(scope, () => {
    scope[GOOGLE_MAPS_READY_FLAG] = true;
    window.dispatchEvent(new Event(GOOGLE_MAPS_READY_EVENT));
  });
}

export function buildGoogleMapsScriptUrl(browserKey: string): string {
  const url = new URL('https://maps.googleapis.com/maps/api/js');
  url.searchParams.set('key', browserKey);
  url.searchParams.set('loading', 'async');
  url.searchParams.set('callback', GOOGLE_MAPS_READY_CALLBACK);
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

export function mountGoogleMarketPoints(
  sdk: GoogleMapsSdk,
  map: GoogleMapInstance,
  points: readonly GoogleMarketMapPoint[],
): readonly GoogleMarkerInstance[] {
  return Object.freeze(points.filter((point) => point.latitude !== undefined && point.longitude !== undefined).map((point) => new sdk.Marker({
    map,
    position: { lat: point.latitude!, lng: point.longitude! },
    title: point.title,
    label: { text: point.label, className: 'spGoogleMarketMarker' },
  })));
}

export async function geocodeGoogleMarketPoints(
  sdk: GoogleMapsSdk,
  runtime: GooglePlaceMapRuntime,
  points: readonly GoogleMarketMapPoint[],
): Promise<readonly GoogleMarkerInstance[]> {
  const markers: GoogleMarkerInstance[] = [];
  for (const point of points.filter((candidate) => candidate.address !== undefined)) {
    try {
      const { results } = await runtime.geocoder.geocode({
        address: point.address!,
        componentRestrictions: { country: 'SG' },
        region: 'SG',
      });
      const position = results[0]?.geometry.location;
      if (position === undefined) continue;
      markers.push(new sdk.Marker({
        map: runtime.map,
        position: { lat: position.lat(), lng: position.lng() },
        title: point.title,
        label: { text: point.label, className: 'spGoogleMarketMarker' },
      }));
    } catch {
      // Keep the rest of the verified project markers when one address cannot be resolved.
    }
  }
  return Object.freeze(markers);
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

export function GooglePlaceMap({
  browserKey,
  points = Object.freeze([]),
}: Readonly<{
  browserKey: string | null;
  points?: readonly GoogleMarketMapPoint[];
}>) {
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<GooglePlaceMapRuntime | null>(null);
  const marketMarkers = useRef<readonly GoogleMarkerInstance[]>([]);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('Search results will appear on this Google map.');
  const [searching, setSearching] = useState(false);

  const initialize = useCallback(() => {
    const sdk = (globalThis as typeof globalThis & {
      google?: Readonly<{ maps: GoogleMapsSdk }>;
    }).google?.maps;
    if (sdk === undefined || container.current === null) return;
    try {
      runtime.current = mountGooglePlaceMap({ sdk, element: container.current });
      for (const marker of marketMarkers.current) marker.setMap(null);
      marketMarkers.current = mountGoogleMarketPoints(sdk, runtime.current.map, points);
      void geocodeGoogleMarketPoints(sdk, runtime.current, points).then((markers) => {
        marketMarkers.current = Object.freeze([...marketMarkers.current, ...markers]);
        const requestedLocations = points.filter((point) => point.address !== undefined).length;
        if (requestedLocations > 0) {
          setMessage(markers.length === requestedLocations
            ? `${markers.length} verified project locations shown.`
            : `${markers.length} of ${requestedLocations} project locations could be verified on Google Maps.`);
        }
      });
      setMapState('ready');
    } catch {
      setMapState('error');
    }
  }, [points]);

  useEffect(() => {
    const scope = window as Window & GoogleMapsReadyScope;
    window.addEventListener(GOOGLE_MAPS_READY_EVENT, initialize);
    if (scope[GOOGLE_MAPS_READY_FLAG] === true) queueMicrotask(initialize);
    return () => {
      window.removeEventListener(GOOGLE_MAPS_READY_EVENT, initialize);
      for (const marker of marketMarkers.current) marker.setMap(null);
      marketMarkers.current = [];
    };
  }, [initialize]);

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

  if (browserKey === null) return points.length === 0 ? (
    <div className={styles.unavailable} data-map-provider="static" data-map-state="fallback">
      Interactive Google map unavailable in this environment.
    </div>
  ) : (
    <div
      className={styles.staticMarketMap}
      data-map-provider="static"
      data-map-state="market-fallback"
      role="img"
      aria-label="Static Singapore market map with segment prices"
    >
      {points.map((point) => {
        const longitude = point.longitude ?? 103.8198;
        const latitude = point.latitude ?? 1.3521;
        const left = 12 + ((longitude - 103.70) / 0.25) * 76;
        const top = 14 + ((1.43 - latitude) / 0.20) * 70;
        return <span
          key={point.id}
          className={styles.staticMarketMarker}
          style={{ '--marker-left': `${Math.max(8, Math.min(88, left))}%`, '--marker-top': `${Math.max(10, Math.min(84, top))}%` } as CSSProperties}
          title={point.title}
        >{point.label}</span>;
      })}
      <small>Singapore · sale evidence</small>
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
        onError={() => setMapState('error')}
      />
    </div>
  );
}
