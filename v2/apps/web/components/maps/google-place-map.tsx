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
  partial_match?: boolean;
  types?: readonly string[];
  formatted_address: string;
  geometry: Readonly<{ location: GoogleLocation; viewport: unknown }>;
}>;

export type GoogleMapInstance = Readonly<{
  fitBounds: (viewport: unknown) => void;
  getZoom?: () => number | undefined;
  addListener?: (event: 'zoom_changed', listener: () => void) => Readonly<{ remove(): void }>;
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
  kind?: 'area' | 'cluster';
  level?: 'region' | 'district';
  count?: number;
  memberIds?: readonly string[];
  bounds?: Readonly<{ south: number; north: number; west: number; east: number }>;
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
      clickableIcons?: boolean;
    }>,
  ) => GoogleMapInstance;
  Marker: new (options?: Readonly<{
    map: GoogleMapInstance;
    position: Readonly<{ lat: number; lng: number }>;
    title: string;
    label?: Readonly<{ text: string; className: string }>;
    icon?: Readonly<{ path: number; scale: number; fillColor: string; fillOpacity: number; strokeColor: string; strokeWeight: number }>;
    zIndex?: number;
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
const geocodeCache = new WeakMap<GoogleGeocoderInstance, Map<string, Promise<GoogleGeocoderResult | null>>>();

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
  locale: 'en' | 'ko' = 'en',
): string {
  const url = new URL('https://maps.googleapis.com/maps/api/js');
  url.searchParams.set('key', browserKey);
  url.searchParams.set('loading', 'async');
  url.searchParams.set('callback', GOOGLE_MAPS_READY_CALLBACK);
  url.searchParams.set('v', 'weekly');
  url.searchParams.set('language', locale);
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
    clickableIcons: false,
  });
  return Object.freeze({
    map,
    marker: new sdk.Marker(),
    geocoder: new sdk.Geocoder(),
  });
}

export function clusterGoogleMarketPoints(points: readonly GoogleMarketMapPoint[], zoom: number, locale: 'en' | 'ko' = 'en'): readonly GoogleMarketMapPoint[] {
  const groups = new Map<string, GoogleMarketMapPoint[]>();
  const result: GoogleMarketMapPoint[] = [];
  const cell = .018 / (2 ** Math.max(0, zoom - 11));
  for (const point of points) {
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) continue;
    if (point.kind === 'area' || point.selected || zoom >= 17) { result.push(point); continue; }
    const key = `${Math.floor(point.latitude! / cell)}:${Math.floor(point.longitude! / cell)}`;
    const group = groups.get(key) ?? []; group.push(point); groups.set(key, group);
  }
  for (const [key, group] of groups) {
    if (group.length === 1) { result.push(group[0]!); continue; }
    result.push({ id: `cluster-${key}`, title: locale === 'ko' ? `단지 위치 ${group.length}곳` : `${group.length} project locations`, label: String(group.length),
      kind: 'cluster', count: group.length, memberIds: group.map(p => p.id),
      latitude: group.reduce((n,p) => n + p.latitude!, 0) / group.length,
      longitude: group.reduce((n,p) => n + p.longitude!, 0) / group.length,
      bounds: { south: Math.min(...group.map(p => p.latitude!)) - .0002, north: Math.max(...group.map(p => p.latitude!)) + .0002,
        west: Math.min(...group.map(p => p.longitude!)) - .0002, east: Math.max(...group.map(p => p.longitude!)) + .0002 } });
  }
  return result;
}

/** Only the selected property gets a name; overview groups keep their counts. */
export function googleMarketMarkerAppearance(point: GoogleMarketMapPoint) {
  const group = point.kind === 'area' || point.kind === 'cluster';
  const label = group ? (point.count === undefined ? point.label : point.count.toLocaleString('en-US')) : point.selected ? point.title : undefined;
  return {
    icon: { path: 0, scale: group ? 15 : point.selected ? 8 : 5,
      fillColor: '#245746', fillOpacity: 1,
      strokeColor: '#ffffff', strokeWeight: 2 },
    zIndex: point.selected ? 1000 : group ? 10 : 1,
    ...(label === undefined ? {} : { label: { text: label,
      className: point.kind === 'area' ? `spGoogleMarketMarker spGoogleAreaGroup${point.level === 'region' ? ' spGoogleRegionGroup' : point.level === 'district' ? ' spGoogleDistrictGroup' : ''}`
        : point.kind === 'cluster' ? 'spGoogleMarketMarker spGoogleCluster'
          : 'spGoogleMarketMarker spGoogleMarketMarkerSelected' } }),
  };
}

function selectedPointViewport(point: GoogleMarketMapPoint) {
  const padding = point.kind === 'area' ? .035 : .0015;
  return point.bounds ?? { south: point.latitude! - padding, north: point.latitude! + padding, west: point.longitude! - padding, east: point.longitude! + padding };
}

export function mountGoogleMarketPoints(
  sdk: GoogleMapsSdk,
  map: GoogleMapInstance,
  points: readonly GoogleMarketMapPoint[],
  onSelectPoint?: (id: string) => void,
  adjustView = true,
  clusterLocations = true,
  locale: 'en' | 'ko' = 'en',
): readonly GoogleMarkerInstance[] {
  const located = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  const selected = located.find((point) => point.selected);
  if (adjustView && selected) map.fitBounds(selectedPointViewport(selected));
  else if (adjustView && located.length > 0 && sdk.LatLngBounds) {
    const bounds = new sdk.LatLngBounds();
    for (const point of located) bounds.extend({ lat: point.latitude!, lng: point.longitude! });
    map.fitBounds(bounds);
  }
  return Object.freeze(clusterGoogleMarketPoints(located, clusterLocations ? map.getZoom?.() ?? 11 : 17, locale).map((point) => {
    const marker = new sdk.Marker({
      map,
      position: { lat: point.latitude!, lng: point.longitude! },
      title: point.title,
      ...googleMarketMarkerAppearance(point),
    });
    marker.addListener?.('click', () => {
      if (point.kind === 'cluster' && point.bounds !== undefined) map.fitBounds(point.bounds);
      else onSelectPoint?.(point.id);
    });
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
  const cached = geocodeCache.get(runtime.geocoder) ?? new Map<string, Promise<GoogleGeocoderResult | null>>();
  geocodeCache.set(runtime.geocoder, cached);
  const markers: GoogleMarkerInstance[] = [];
  const locations: GoogleLocation[] = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .map((point) => ({ lat: () => point.latitude!, lng: () => point.longitude! }));
  const viewports: unknown[] = [];
  let selectedViewport: unknown = null;
  const selectedCoordinate = points.find((point) => point.selected && Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  if (selectedCoordinate) selectedViewport = selectedPointViewport(selectedCoordinate);
  for (const point of [...points].sort((a, b) => Number(Boolean(b.selected)) - Number(Boolean(a.selected))).filter((candidate) => candidate.address !== undefined && !(Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude)))) {
    if (!isActive()) break;
    try {
      const cacheKey = `${config.country}:${point.address}`;
      let lookup = cached.get(cacheKey);
      if (lookup === undefined) {
        // Share in-flight requests even when the initiating selection is superseded.
        lookup = runtime.geocoder.geocode({ address: point.address!, componentRestrictions: { country: config.country }, region: config.country })
          .then(({ results }) => {
            const result = results.length === 1 ? results[0] : undefined;
            const position = result?.geometry.location;
            const broadTypes = new Set(['locality', 'political', 'country', 'administrative_area_level_1', 'administrative_area_level_2']);
            if (!result || result.partial_match || (result.types?.length && result.types.every(type => broadTypes.has(type)))
              || !position || !Number.isFinite(position.lat()) || !Number.isFinite(position.lng())
              || position.lat() < config.south || position.lat() > config.north || position.lng() < config.west || position.lng() > config.east) return null;
            return result;
          }).catch(error => { cached.delete(cacheKey); throw error; });
        cached.set(cacheKey, lookup);
      }
      const result = await lookup;
      if (!isActive()) break;
      if (result === null) continue;
      const position = result.geometry.location;
      if (point.selected) runtime.map.fitBounds(result.geometry.viewport);
      const marker = new sdk.Marker({
        map: runtime.map,
        position: { lat: position.lat(), lng: position.lng() },
        title: point.title,
        ...googleMarketMarkerAppearance(point),
      });
      marker.addListener?.('click', () => onSelectPoint?.(point.id));
      markers.push(marker);
      locations.push(position);
      viewports.push(result.geometry.viewport);
      if (point.selected) selectedViewport = result.geometry.viewport;
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
  clusterLocations = true,
  market = 'singapore',
  locale = 'en',
}: Readonly<{
  locale?: 'en' | 'ko';
  market?: GoogleMarket;
  showAddressSearch?: boolean;
  clusterLocations?: boolean;
  browserKey: string | null;
  points?: readonly GoogleMarketMapPoint[];
  onSelectPoint?: (id: string) => void;
}>) {
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<GooglePlaceMapRuntime | null>(null);
  const generation = useRef(0);
  const marketMarkers = useRef<readonly GoogleMarkerInstance[]>([]);
  const zoomListener = useRef<Readonly<{ remove(): void }> | null>(null);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState(() => points.some((point) => point.address !== undefined)
    ? (locale === 'ko' ? `Google 지도에서 장소 ${points.length}곳을 찾는 중…` : `Locating ${points.length} places on Google Maps…`)
    : (locale === 'ko' ? '이 Google 지도에 지역과 주택 위치가 표시됩니다.' : 'Market locations will appear on this Google map.'));
  const [searching, setSearching] = useState(false);

  const initialize = useCallback(() => {
    const sdk = (globalThis as typeof globalThis & {
      google?: Readonly<{ maps: GoogleMapsSdk }>;
    }).google?.maps;
    if (sdk === undefined || container.current === null) return;
    try {
      const currentGeneration = ++generation.current;
      runtime.current ??= mountGooglePlaceMap({ sdk, element: container.current, market });
      zoomListener.current?.remove();
      zoomListener.current = null;
      for (const marker of marketMarkers.current) marker.setMap(null);
      marketMarkers.current = mountGoogleMarketPoints(sdk, runtime.current.map, points, onSelectPoint, true, clusterLocations, locale);
      const requestedLocations = points.filter((point) => point.address !== undefined).length;
      setMessage(requestedLocations > 0
        ? (locale === 'ko' ? `Google 지도에서 장소 ${requestedLocations}곳을 찾는 중…` : `Locating ${requestedLocations} places on Google Maps…`)
        : locale === 'ko' ? `${points.reduce((n, point) => n + (point.count ?? 1), 0).toLocaleString('ko')}건 · 숫자는 묶인 결과 수입니다. 지역 단위 자료는 건물의 정확한 위치를 뜻하지 않습니다.` : `${points.reduce((n, point) => n + (point.count ?? 1), 0).toLocaleString('en')} results · Numbers show grouped results. Area-level evidence does not identify an exact building location.`);
      if (points.every(point => point.address === undefined) && runtime.current.map.addListener) {
        zoomListener.current = runtime.current.map.addListener('zoom_changed', () => {
          if (generation.current !== currentGeneration || runtime.current === null) return;
          for (const marker of marketMarkers.current) marker.setMap(null);
          marketMarkers.current = mountGoogleMarketPoints(sdk, runtime.current.map, points, onSelectPoint, false, clusterLocations, locale);
        });
      }
      if (requestedLocations > 0) void geocodeGoogleMarketPoints(sdk, runtime.current, points, onSelectPoint, () => generation.current === currentGeneration, market).then((markers) => {
        if (generation.current !== currentGeneration) {
          for (const marker of markers) marker.setMap(null);
          return;
        }
        marketMarkers.current = Object.freeze([...marketMarkers.current, ...markers]);
        if (requestedLocations > 0) {
          setMessage(locale === 'ko' ? `${points.length}곳 중 ${marketMarkers.current.length}곳의 ${market === 'dubai' ? '지역' : '단지'} 위치가 표시됩니다.` : `${marketMarkers.current.length} of ${points.length} ${market === 'dubai' ? 'area' : 'project'} locations shown.`);
        }
      });
      setMapState('ready');
    } catch {
      setMapState('error');
    }
  }, [onSelectPoint, points, market, clusterLocations, locale]);

  useEffect(() => {
    const requestGeneration = generation;
    const scope = window as Window & GoogleMapsReadyScope;
    window.addEventListener(GOOGLE_MAPS_READY_EVENT, initialize);
    if (scope[GOOGLE_MAPS_READY_FLAG] === true) queueMicrotask(initialize);
    return () => {
      ++requestGeneration.current;
      zoomListener.current?.remove();
      zoomListener.current = null;
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
      zoomListener.current?.remove();
      zoomListener.current = null;
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
      setMessage(locale === 'ko' ? (address === '' ? '싱가포르 주소를 입력하세요.' : 'Google 지도를 준비하고 있습니다.') : (address === '' ? 'Enter a Singapore address.' : 'Google map is not ready.'));
      return;
    }
    setSearching(true);
    try {
      setMessage(await geocodeGoogleAddress({ ...runtime.current, address }));
    } catch {
      setMessage(locale === 'ko' ? '싱가포르 주소를 찾지 못했습니다. 주소를 확인하고 다시 시도하세요.' : 'No Singapore address found. Check the address and try again.');
    } finally {
      setSearching(false);
    }
  }

  if (browserKey === null) return (
    <div className={styles.unavailable} data-map-provider="static" data-map-state="fallback">
      {locale === 'ko' ? `Google 지도를 사용할 수 없습니다. ${market === 'dubai' ? '목록에서 지역을 선택하고 가이드를 읽을 수 있습니다.' : '목록에서 단지를 검색하고 상세 정보를 확인할 수 있습니다.'}` : <>Interactive Google map unavailable. {market === 'dubai' ? 'You can still select areas and read their guides in the list.' : 'You can still search projects and open their details in the list.'}</>}
    </div>
  );

  return (
    <div className={styles.placeWorkspace} data-map-provider="google" data-map-state={mapState}>
      {showAddressSearch && market === 'singapore' ? <form className={styles.toolbar} onSubmit={submit}>
        <label htmlFor="singapore-map-address">{locale === 'ko' ? '싱가포르 주소 검색' : 'Search a Singapore address'}</label>
        <div>
          <input
            id="singapore-map-address"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="street-address"
            placeholder={locale === 'ko' ? '예: 10 Bayfront Avenue' : 'e.g. 10 Bayfront Avenue'}
          />
          <button type="submit" disabled={searching || mapState !== 'ready'}>
            {locale === 'ko' ? (searching ? '검색 중…' : '지도에서 보기') : (searching ? 'Searching…' : 'Show on map')}
          </button>
        </div>
        <p aria-live="polite">{message}</p>
      </form> : <p aria-live="polite">{message}</p>}
      {mapState === 'error' ? <p role="status">{locale === 'ko' ? '지도를 불러오지 못했습니다. 목록에서 검색 결과와 상세 정보를 확인할 수 있습니다.' : 'The map could not load. Search results and project details remain available in the list.'}</p> : null}
      <div
        ref={container}
        className={styles.canvas}
        role="region"
        aria-label={locale === 'ko' ? `${market === 'dubai' ? '두바이' : '싱가포르'} Google 지도` : `Interactive Google map of ${marketConfig[market].name}`}
      />
      <Script
        src={buildGoogleMapsScriptUrl(browserKey, market, locale)}
        strategy="afterInteractive"
        onError={() => setMapState('error')}
      />
    </div>
  );
}
