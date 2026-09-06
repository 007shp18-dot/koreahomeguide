'use client';

import Script from 'next/script';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
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
  addListener?: (event: 'click', listener: () => void) => unknown;
}>;
export type GoogleMarketMapPoint = Readonly<{
  id: string;
  title: string;
  label: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  selected?: boolean;
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
  onSelectPoint?: (id: string) => void,
): readonly GoogleMarkerInstance[] {
  return Object.freeze(points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)).map((point) => {
    const marker = new sdk.Marker({
      map,
      position: { lat: point.latitude!, lng: point.longitude! },
      title: point.title,
      label: { text: point.label, className: point.selected ? 'spGoogleMarketMarker spGoogleMarketMarkerSelected' : 'spGoogleMarketMarker' },
    });
    marker.addListener?.('click', () => onSelectPoint?.(point.id));
    return marker;
  }));
}

export async function geocodeGoogleMarketPoints(
  sdk: GoogleMapsSdk,
  runtime: GooglePlaceMapRuntime,
  points: readonly GoogleMarketMapPoint[],
  onSelectPoint?: (id: string) => void,
  isActive: () => boolean = () => true,
): Promise<readonly GoogleMarkerInstance[]> {
  const markers: GoogleMarkerInstance[] = [];
  for (const point of points.filter((candidate) => candidate.address !== undefined)) {
    if (!isActive()) break;
    try {
      const { results } = await runtime.geocoder.geocode({
        address: point.address!,
        componentRestrictions: { country: 'SG' },
        region: 'SG',
      });
      if (!isActive()) break;
      const position = results.length === 1 ? results[0]?.geometry.location : undefined;
      if (position === undefined || !Number.isFinite(position.lat()) || !Number.isFinite(position.lng())
        || position.lat() < 1.15 || position.lat() > 1.5 || position.lng() < 103.55 || position.lng() > 104.15) continue;
      const marker = new sdk.Marker({
        map: runtime.map,
        position: { lat: position.lat(), lng: position.lng() },
        title: point.title,
        label: { text: point.label, className: point.selected ? 'spGoogleMarketMarker spGoogleMarketMarkerSelected' : 'spGoogleMarketMarker' },
      });
      marker.addListener?.('click', () => onSelectPoint?.(point.id));
      markers.push(marker);
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
  onSelectPoint,
  showAddressSearch = true,
}: Readonly<{
  showAddressSearch?: boolean;
  browserKey: string | null;
  points?: readonly GoogleMarketMapPoint[];
  onSelectPoint?: (id: string) => void;
}>) {
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<GooglePlaceMapRuntime | null>(null);
  const generation = useRef(0);
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
      const currentGeneration = ++generation.current;
      runtime.current ??= mountGooglePlaceMap({ sdk, element: container.current });
      for (const marker of marketMarkers.current) marker.setMap(null);
      marketMarkers.current = mountGoogleMarketPoints(sdk, runtime.current.map, points, onSelectPoint);
      void geocodeGoogleMarketPoints(sdk, runtime.current, points, onSelectPoint, () => generation.current === currentGeneration).then((markers) => {
        if (generation.current !== currentGeneration) {
          for (const marker of markers) marker.setMap(null);
          return;
        }
        marketMarkers.current = Object.freeze([...marketMarkers.current, ...markers]);
        const requestedLocations = points.filter((point) => point.address !== undefined).length;
        if (requestedLocations > 0) {
          setMessage(markers.length === requestedLocations
            ? `${markers.length} project locations matched on Google Maps.`
            : `${markers.length} of ${requestedLocations} project locations matched on Google Maps.`);
        }
      });
      setMapState('ready');
    } catch {
      setMapState('error');
    }
  }, [onSelectPoint, points]);

  useEffect(() => {
    const requestGeneration = generation;
    const scope = window as Window & GoogleMapsReadyScope;
    window.addEventListener(GOOGLE_MAPS_READY_EVENT, initialize);
    if (scope[GOOGLE_MAPS_READY_FLAG] === true) queueMicrotask(initialize);
    return () => {
      ++requestGeneration.current;
      window.removeEventListener(GOOGLE_MAPS_READY_EVENT, initialize);
      for (const marker of marketMarkers.current) marker.setMap(null);
      marketMarkers.current = [];
    };
  }, [initialize]);

  useEffect(() => {
    const scope = window as Window & { gm_authFailure?: () => void };
    const previous = scope.gm_authFailure;
    const failed = () => {
      ++generation.current;
      setMapState('error');
      for (const marker of marketMarkers.current) marker.setMap(null);
      marketMarkers.current = [];
    };
    scope.gm_authFailure = failed;
    return () => {
      if (scope.gm_authFailure === failed) scope.gm_authFailure = previous;
    };
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
      Interactive Google map unavailable. You can still search projects and open their details in the list.
    </div>
  );

  return (
    <div className={styles.placeWorkspace} data-map-provider="google" data-map-state={mapState}>
      {showAddressSearch ? <form className={styles.toolbar} onSubmit={submit}>
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
      </form> : <p aria-live="polite">{message}</p>}
      {mapState === 'error' ? <p role="status">The map could not load. Search results and project details remain available in the list.</p> : null}
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
