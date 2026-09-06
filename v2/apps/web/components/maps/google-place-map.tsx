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
    componentRestrictions: Readonly<{ country: 'SG' | 'AE' }>;
    region: 'SG' | 'AE';
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
  LatLngBounds?: new () => Readonly<{
    extend: (location: GoogleLocation | Readonly<{ lat: number; lng: number }>) => void;
  }>;
}>;

export type GooglePlaceMapRuntime = Readonly<{
  map: GoogleMapInstance;
  marker: GoogleMarkerInstance;
  geocoder: GoogleGeocoderInstance;
}>;

export const GOOGLE_MAPS_READY_CALLBACK = '__signedpriceGoogleMapsReady' as const;
export type GoogleMarket = 'singapore' | 'dubai';
const marketConfig = { singapore: { country: 'SG', name: 'Singapore', center: { lat: 1.3521, lng: 103.8198 }, south: 1.15, north: 1.5, west: 103.55, east: 104.15 }, dubai: { country: 'AE', name: 'Dubai', center: { lat: 25.15, lng: 55.25 }, south: 24.7, north: 25.6, west: 54.8, east: 55.7 } } as const;
const geocodeCache = new WeakMap<GoogleGeocoderInstance, Map<string, GoogleGeocoderResult>>();

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

export function buildGoogleMapsScriptUrl(
  browserKey: string,
  market: GoogleMarket = 'singapore',
): string {
  const url = new URL('https://maps.googleapis.com/maps/api/js');
  url.searchParams.set('key', browserKey);
  url.searchParams.set('loading', 'async');
  url.searchParams.set('callback', GOOGLE_MAPS_READY_CALLBACK);
  url.searchParams.set('v', 'weekly');
  url.searchParams.set('language', 'en');
  url.searchParams.set('region', marketConfig[market].country);
  return url.toString();
}

export function mountGooglePlaceMap({
  sdk,
  element,
  market = 'singapore',
}: Readonly<{ sdk: GoogleMapsSdk; element: HTMLElement; market?: GoogleMarket }>): GooglePlaceMapRuntime {
  const map = new sdk.Map(element, {
    center: marketConfig[market].center,
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
  const located = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  const selected = located.find((point) => point.selected);
  if (selected) map.fitBounds({ south: selected.latitude! - .0015, north: selected.latitude! + .0015, west: selected.longitude! - .0015, east: selected.longitude! + .0015 });
  else if (located.length > 0 && sdk.LatLngBounds) {
    const bounds = new sdk.LatLngBounds();
    for (const point of located) bounds.extend({ lat: point.latitude!, lng: point.longitude! });
    map.fitBounds(bounds);
  }
  return Object.freeze(located.map((point) => {
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
  market: GoogleMarket = 'singapore',
): Promise<readonly GoogleMarkerInstance[]> {
  const config = marketConfig[market];
  const cached = geocodeCache.get(runtime.geocoder) ?? new Map<string, GoogleGeocoderResult>();
  geocodeCache.set(runtime.geocoder, cached);
  const markers: GoogleMarkerInstance[] = [];
  const locations: GoogleLocation[] = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .map((point) => ({ lat: () => point.latitude!, lng: () => point.longitude! }));
  const viewports: unknown[] = [];
  let selectedViewport: unknown = null;
  const selectedCoordinate = points.find((point) => point.selected && Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  if (selectedCoordinate) selectedViewport = { south: selectedCoordinate.latitude! - .0015, north: selectedCoordinate.latitude! + .0015, west: selectedCoordinate.longitude! - .0015, east: selectedCoordinate.longitude! + .0015 };
  for (const point of [...points].sort((a, b) => Number(Boolean(b.selected)) - Number(Boolean(a.selected))).filter((candidate) => candidate.address !== undefined && !(Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude)))) {
    if (!isActive()) break;
    try {
      const cacheKey = `${config.country}:${point.address}`;
      const existing = cached.get(cacheKey);
      const { results } = existing ? { results: [existing] } : await runtime.geocoder.geocode({ address: point.address!, componentRestrictions: { country: config.country }, region: config.country });
      if (!isActive()) break;
      const position = results.length === 1 ? results[0]?.geometry.location : undefined;
      if (position === undefined || !Number.isFinite(position.lat()) || !Number.isFinite(position.lng())
        || position.lat() < config.south || position.lat() > config.north || position.lng() < config.west || position.lng() > config.east) continue;
      cached.set(cacheKey, results[0]!);
      if (point.selected) runtime.map.fitBounds(results[0]!.geometry.viewport);
      const marker = new sdk.Marker({
        map: runtime.map,
        position: { lat: position.lat(), lng: position.lng() },
        title: point.title,
        label: { text: point.label, className: point.selected ? 'spGoogleMarketMarker spGoogleMarketMarkerSelected' : 'spGoogleMarketMarker' },
      });
      marker.addListener?.('click', () => onSelectPoint?.(point.id));
      markers.push(marker);
      locations.push(position);
      viewports.push(results[0]!.geometry.viewport);
      if (point.selected) selectedViewport = results[0]!.geometry.viewport;
    } catch {
      // Keep the rest of the verified project markers when one address cannot be resolved.
    }
  }
  if (selectedViewport !== null && isActive()) {
    runtime.map.fitBounds(selectedViewport);
  } else if (locations.length === 1 && viewports.length === 1 && isActive()) {
    runtime.map.fitBounds(viewports[0]);
  } else if (locations.length > 1 && sdk.LatLngBounds !== undefined && isActive()) {
    const bounds = new sdk.LatLngBounds();
    for (const location of locations) bounds.extend(location);
    runtime.map.fitBounds(bounds);
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
  market = 'singapore',
}: Readonly<{
  market?: GoogleMarket;
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
  const [message, setMessage] = useState(() => points.some((point) => point.address !== undefined)
    ? `Locating ${points.length} places on Google Maps…`
    : 'Market locations will appear on this Google map.');
  const [searching, setSearching] = useState(false);

  const initialize = useCallback(() => {
    const sdk = (globalThis as typeof globalThis & {
      google?: Readonly<{ maps: GoogleMapsSdk }>;
    }).google?.maps;
    if (sdk === undefined || container.current === null) return;
    try {
      const currentGeneration = ++generation.current;
      runtime.current ??= mountGooglePlaceMap({ sdk, element: container.current, market });
      for (const marker of marketMarkers.current) marker.setMap(null);
      marketMarkers.current = mountGoogleMarketPoints(sdk, runtime.current.map, points, onSelectPoint);
      const requestedLocations = points.filter((point) => point.address !== undefined).length;
      setMessage(requestedLocations > 0
        ? `Locating ${requestedLocations} places on Google Maps…`
        : `${marketMarkers.current.length} market locations shown.`);
      void geocodeGoogleMarketPoints(sdk, runtime.current, points, onSelectPoint, () => generation.current === currentGeneration, market).then((markers) => {
        if (generation.current !== currentGeneration) {
          for (const marker of markers) marker.setMap(null);
          return;
        }
        marketMarkers.current = Object.freeze([...marketMarkers.current, ...markers]);
        if (requestedLocations > 0) {
          setMessage(`${marketMarkers.current.length} of ${points.length} ${market === 'dubai' ? 'area' : 'project'} locations shown.`);
        }
      });
      setMapState('ready');
    } catch {
      setMapState('error');
    }
  }, [onSelectPoint, points, market]);

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
      Interactive Google map unavailable. {market === 'dubai' ? 'You can still select areas and read their guides in the list.' : 'You can still search projects and open their details in the list.'}
    </div>
  );

  return (
    <div className={styles.placeWorkspace} data-map-provider="google" data-map-state={mapState}>
      {showAddressSearch && market === 'singapore' ? <form className={styles.toolbar} onSubmit={submit}>
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
        aria-label={`Interactive Google map of ${marketConfig[market].name}`}
      />
      <Script
        src={buildGoogleMapsScriptUrl(browserKey, market)}
        strategy="afterInteractive"
        onError={() => setMapState('error')}
      />
    </div>
  );
}
