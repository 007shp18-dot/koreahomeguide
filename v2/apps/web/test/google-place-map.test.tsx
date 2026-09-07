import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/script', () => ({
  default: ({ src }: Readonly<{ src: string }>) => createElement('script', { src }),
}));

import {
  GOOGLE_MAPS_READY_CALLBACK,
  GooglePlaceMap,
  buildGoogleMapsScriptUrl,
  geocodeGoogleAddress,
  geocodeGoogleMarketPoints,
  installGoogleMapsReadyCallback,
  mountGoogleMarketPoints,
  mountGooglePlaceMap,
  clusterGoogleMarketPoints,
  googleMarketMarkerAppearance,
} from '../components/maps/google-place-map';

describe('Google place map', () => {
  it('clusters real locations with preserved membership and keeps area-only groups separate', () => {
    const points = [
      { id: 'a', title: 'A', label: 'A', latitude: 1.28001, longitude: 103.85001 },
      { id: 'b', title: 'B', label: 'B', latitude: 1.28002, longitude: 103.85002 },
      { id: 'area', title: 'District 01', label: 'Area only', latitude: 1.28001, longitude: 103.85001, kind: 'area' as const, count: 773 },
    ];
    const grouped = clusterGoogleMarketPoints(points, 11);
    expect(grouped).toHaveLength(2);
    expect(grouped.find(p => p.kind === 'cluster')?.memberIds).toEqual(['a', 'b']);
    expect(grouped.reduce((n,p) => n + (p.count ?? 1), 0)).toBe(775);
    expect(clusterGoogleMarketPoints(points, 18)).toHaveLength(3);
    expect(clusterGoogleMarketPoints([points[0]!, { ...points[1]!, selected: true }], 11)).toHaveLength(2);
  });

  it('keeps dense project maps readable and preserves every property across zoom levels', () => {
    const points = Array.from({ length: 1106 }, (_, i) => ({
      id: `project-${i}`, title: `Project ${i}`, label: `Project ${i}`,
      latitude: 1.28 + (i % 25) * 0.0001, longitude: 103.85 + Math.floor(i / 25) * 0.0001,
      selected: i === 0,
    }));
    const overview = clusterGoogleMarketPoints(points, 11);
    expect(overview.length).toBeLessThan(20);
    expect(overview.reduce((n, p) => n + (p.count ?? 1), 0)).toBe(1106);
    const detail = clusterGoogleMarketPoints(points, 18);
    expect(detail).toHaveLength(1106);
    const labeled = detail.filter(p => googleMarketMarkerAppearance(p).label !== undefined);
    expect(labeled.map(p => p.id)).toEqual(['project-0']);
    expect(googleMarketMarkerAppearance(labeled[0]!).label?.text).toBe('Project 0');
  });

  it('loads the async weekly Maps JavaScript API for Singapore', () => {
    expect(buildGoogleMapsScriptUrl('key/value + test')).toBe(
      'https://maps.googleapis.com/maps/api/js?key=key%2Fvalue+%2B+test&loading=async&callback=__signedpriceGoogleMapsReady&v=weekly&language=en&region=SG',
    );
    expect(buildGoogleMapsScriptUrl('test-key', 'dubai')).toContain('region=AE');
  });

  it('initializes only from the API completion callback and restores prior state', () => {
    const calls: string[] = [];
    const previous = () => calls.push('previous');
    const scope = { [GOOGLE_MAPS_READY_CALLBACK]: previous };
    const cleanup = installGoogleMapsReadyCallback(scope, () => calls.push('ready'));

    scope[GOOGLE_MAPS_READY_CALLBACK]();
    expect(calls).toEqual(['ready']);
    cleanup();
    scope[GOOGLE_MAPS_READY_CALLBACK]();
    expect(calls).toEqual(['ready', 'previous']);
  });

  it('renders a Singapore address search with a map fallback', () => {
    const html = renderToStaticMarkup(createElement(GooglePlaceMap, {
      browserKey: 'test-google-key',
    }));

    expect(html).toContain('data-map-provider="google"');
    expect(html).toContain('data-map-state="loading"');
    expect(html).toContain('Search a Singapore address');
    expect(html).toContain('aria-label="Interactive Google map of Singapore"');
    expect(html).toContain('key=test-google-key');
  });

  it('does not request Google when the key is unavailable', () => {
    const html = renderToStaticMarkup(createElement(GooglePlaceMap, { browserKey: null }));

    expect(html).toContain('data-map-provider="static"');
    expect(html).toContain('Interactive Google map unavailable.');
    expect(html).not.toContain('maps.googleapis.com');
  });

  it('restricts geocoding to Singapore and displays the first result on the same map', async () => {
    const mapCalls: unknown[] = [];
    const markerCalls: unknown[] = [];
    const location = { lat: () => 1.2834, lng: () => 103.8607 };
    const viewport = { south: 1.28, west: 103.85, north: 1.29, east: 103.87 };
    class Map {
      fitBounds(value: unknown) { mapCalls.push(value); }
    }
    class Marker {
      setPosition(value: unknown) { markerCalls.push(['position', value]); }
      setMap(value: unknown) { markerCalls.push(['map', value]); }
    }
    class Geocoder {
      async geocode(request: unknown) {
        expect(request).toEqual({
          address: 'Marina Bay Sands',
          componentRestrictions: { country: 'SG' },
          region: 'SG',
        });
        return {
          results: [{
            formatted_address: '10 Bayfront Avenue, Singapore',
            geometry: { location, viewport },
          }],
        };
      }
    }
    const sdk = {
      Map: class extends Map {
        constructor(_element: HTMLElement, options: unknown) {
          super();
          expect(options).toEqual({
            center: { lat: 1.3521, lng: 103.8198 },
            zoom: 11,
            mapTypeControl: false,
            streetViewControl: false,
            clickableIcons: false,
          });
        }
      },
      Marker,
      Geocoder,
    };
    const runtime = mountGooglePlaceMap({ sdk, element: {} as HTMLElement });

    await expect(geocodeGoogleAddress({
      ...runtime,
      address: 'Marina Bay Sands',
    })).resolves.toBe('10 Bayfront Avenue, Singapore');
    expect(mapCalls).toEqual([viewport]);
    expect(markerCalls).toEqual([
      ['position', location],
      ['map', runtime.map],
    ]);
  });

  it('uses an unlabeled dot for an unselected project', () => {
    const options: unknown[] = [];
    class Marker {
      constructor(input?: unknown) { options.push(input); }
      setPosition() {}
      setMap() {}
    }
    const sdk = {
      Map: class { fitBounds() {} },
      Marker,
      Geocoder: class { async geocode() { return { results: [] }; } },
    };
    const map = { fitBounds() {} };

    const markers = mountGoogleMarketPoints(sdk, map, [{
      id: 'ccr',
      title: 'CCR · 120 transactions',
      label: 'CCR · S$2.1M',
      latitude: 1.2897,
      longitude: 103.8501,
    }]);

    expect(markers).toHaveLength(1);
    expect(options).toEqual([{
      map,
      position: { lat: 1.2897, lng: 103.8501 },
      title: 'CCR · 120 transactions',
      icon: expect.objectContaining({ path: 0, scale: 5 }),
      zIndex: 1,
    }]);
  });

  it('keeps adjacent buildings separate in project mode even at district zoom', () => {
    const sdk = {
      Map: class { fitBounds() {} },
      Marker: class { setPosition() {} setMap() {} },
      Geocoder: class { async geocode() { return { results: [] }; } },
    };
    const map = { fitBounds() {}, getZoom() { return 11; } };
    const points = [
      { id: 'a', title: 'A', label: 'A', latitude: 1.28001, longitude: 103.85001 },
      { id: 'b', title: 'B', label: 'B', latitude: 1.28002, longitude: 103.85002 },
    ];
    expect(mountGoogleMarketPoints(sdk, map, points, undefined, false, true)).toHaveLength(1);
    expect(mountGoogleMarketPoints(sdk, map, points, undefined, false, false)).toHaveLength(2);
  });

  it('turns verified Singapore project addresses into price markers', async () => {
    const options: unknown[] = [];
    const mapCalls: unknown[] = [];
    const location = { lat: () => 1.3039, lng: () => 103.8322 };
    const viewport = { north: 1.31, south: 1.29, east: 103.84, west: 103.82 };
    class Marker {
      constructor(input?: unknown) { options.push(input); }
      setPosition() {}
      setMap() {}
    }
    const map = { fitBounds(value: unknown) { mapCalls.push(value); } };
    const runtime = {
      map,
      marker: new Marker(),
      geocoder: {
        async geocode(request: unknown) {
          expect(request).toEqual({
            address: 'SKYE AT HOLLAND, HOLLAND VILLAGE WAY, Singapore',
            componentRestrictions: { country: 'SG' },
            region: 'SG',
          });
          return { results: [{
            formatted_address: 'Holland Village Way, Singapore',
            geometry: { location, viewport },
          }] };
        },
      },
    };
    options.length = 0;
    const sdk = {
      Map: class { fitBounds() {} },
      Marker,
      Geocoder: class { async geocode() { return { results: [] }; } },
      LatLngBounds: class {
        readonly locations: unknown[] = [];
        extend(value: unknown) { this.locations.push(value); }
      },
    };

    const markers = await geocodeGoogleMarketPoints(sdk, runtime, [{
      id: 'skye-at-holland',
      title: 'SKYE AT HOLLAND',
      label: 'SGD 2,094,000',
      address: 'SKYE AT HOLLAND, HOLLAND VILLAGE WAY, Singapore',
    }]);

    expect(markers).toHaveLength(1);
    expect(options).toEqual([{
      map,
      position: { lat: 1.3039, lng: 103.8322 },
      title: 'SKYE AT HOLLAND',
      icon: expect.objectContaining({ path: 0, scale: 5 }),
      zIndex: 1,
    }]);
    expect(mapCalls).toEqual([viewport]);
  });
});


it('does not create markers after a project search is superseded', async () => {
  let active = true;
  let mounts = 0;
  const map = { fitBounds() {} };
  const sdk = {
    Map: class { fitBounds() {} },
    Marker: class {
      constructor() { mounts++; }
      setMap() {} setPosition() {}
    },
    Geocoder: class { async geocode() { return { results: [] }; } },
  };
  const markers = await geocodeGoogleMarketPoints(sdk, {
    map, marker: { setMap() {}, setPosition() {} },
    geocoder: { async geocode() {
      active = false;
      return { results: [{ formatted_address: 'Singapore', geometry: {
        location: { lat: () => 1.3, lng: () => 103.8 }, viewport: {},
      } }] };
    } },
  }, [{ id: 'old', title: 'Old result', label: 'Old result', address: 'Singapore' }], undefined, () => active);
  expect(markers).toHaveLength(0);
  expect(mounts).toBe(0);
});

it('locates Dubai with UAE restrictions, caches successful lookups and rejects overseas matches', async () => {
  const geocode = vi.fn(async () => ({ results: [{ formatted_address: 'Dubai Marina, Dubai', geometry: { location: { lat: () => 25.08, lng: () => 55.14 }, viewport: { name: 'marina' } } }] }));
  const fitBounds = vi.fn();
  const sdk = { Map: class { fitBounds() {} }, Marker: class { setMap() {} setPosition() {} }, Geocoder: class { geocode = geocode; } };
  const runtime = { map: { fitBounds }, marker: { setMap() {}, setPosition() {} }, geocoder: { geocode } };
  const points = [{ id: 'marina', title: 'Dubai Marina', label: 'Marina', address: 'Dubai Marina, UAE', selected: true }];
  expect(await geocodeGoogleMarketPoints(sdk, runtime, points, undefined, () => true, 'dubai')).toHaveLength(1);
  expect(geocode).toHaveBeenCalledWith({ address: 'Dubai Marina, UAE', componentRestrictions: { country: 'AE' }, region: 'AE' });
  await geocodeGoogleMarketPoints(sdk, runtime, points, undefined, () => true, 'dubai');
  expect(geocode).toHaveBeenCalledTimes(1);
  expect(fitBounds).toHaveBeenCalledWith({ name: 'marina' });
  expect(await geocodeGoogleMarketPoints(sdk, runtime, points)).toHaveLength(0);
});

it('shares overlapping geocoder requests and does not place a city fallback as an area', async () => {
  let finish!: (value: { results: never[] }) => void;
  const geocode = vi.fn(() => new Promise<{ results: never[] }>(resolve => { finish = resolve; }));
  const sdk = { Map: class { fitBounds() {} }, Marker: class { setMap() {} setPosition() {} }, Geocoder: class { geocode = geocode; } };
  const runtime = { map: { fitBounds() {} }, marker: { setMap() {}, setPosition() {} }, geocoder: { geocode } };
  const points = [{ id: 'marina', title: 'Dubai Marina', label: 'Marina', address: 'Dubai Marina, UAE' }];
  const first = geocodeGoogleMarketPoints(sdk, runtime, points, undefined, () => true, 'dubai');
  const second = geocodeGoogleMarketPoints(sdk, runtime, points, undefined, () => true, 'dubai');
  expect(geocode).toHaveBeenCalledTimes(1);
  finish({ results: [] });
  expect(await first).toHaveLength(0);
  expect(await second).toHaveLength(0);
  await geocodeGoogleMarketPoints(sdk, runtime, points, undefined, () => true, 'dubai');
  expect(geocode).toHaveBeenCalledTimes(1);
});

it('rejects partial or city-only Dubai geocodes', async () => {
  for (const extra of [{ partial_match: true }, { types: ['locality', 'political'] }]) {
    const geocode = vi.fn(async () => ({ results: [{ formatted_address: 'Dubai, United Arab Emirates', ...extra,
      geometry: { location: { lat: () => 25.2, lng: () => 55.3 }, viewport: {} } }] }));
    const sdk = { Map: class { fitBounds() {} }, Marker: class { setMap() {} setPosition() {} }, Geocoder: class { geocode = geocode; } };
    const runtime = { map: { fitBounds() {} }, marker: { setMap() {}, setPosition() {} }, geocoder: { geocode } };
    expect(await geocodeGoogleMarketPoints(sdk, runtime, [{ id: 'a', title: 'Area', label: 'Area', address: 'Al Example, Dubai' }], undefined, () => true, 'dubai')).toHaveLength(0);
  }
});

it('keeps selected approximate districts at area scale', () => {
  const fitBounds = vi.fn();
  const sdk = { Map: class { fitBounds() {} }, Marker: class { setMap() {} setPosition() {} }, Geocoder: class { async geocode() { return { results: [] }; } } };
  mountGoogleMarketPoints(sdk, { fitBounds }, [{ id: 'district-15', title: 'District 15 · approximate area', label: 'Area only', kind: 'area', selected: true, latitude: 1.3, longitude: 103.9 }]);
  const bounds = fitBounds.mock.calls[0]![0];
  expect(bounds.north - bounds.south).toBeCloseTo(.07);
  expect(bounds.east - bounds.west).toBeCloseTo(.07);
});

it('retries a transient geocoder failure instead of retaining it as a missing location', async () => {
  const geocode = vi.fn().mockRejectedValueOnce(new Error('temporary failure')).mockResolvedValueOnce({ results: [{ formatted_address: 'Dubai Marina, Dubai', types: ['neighborhood', 'political'], geometry: { location: { lat: () => 25.08, lng: () => 55.14 }, viewport: {} } }] });
  const sdk = { Map: class { fitBounds() {} }, Marker: class { setMap() {} setPosition() {} }, Geocoder: class { geocode = geocode; } };
  const runtime = { map: { fitBounds() {} }, marker: { setMap() {}, setPosition() {} }, geocoder: { geocode } };
  const points = [{ id: 'marina', title: 'Dubai Marina', label: 'Marina', address: 'Dubai Marina, UAE' }];
  expect(await geocodeGoogleMarketPoints(sdk, runtime, points, undefined, () => true, 'dubai')).toHaveLength(0);
  expect(await geocodeGoogleMarketPoints(sdk, runtime, points, undefined, () => true, 'dubai')).toHaveLength(1);
  expect(geocode).toHaveBeenCalledTimes(2);
});
