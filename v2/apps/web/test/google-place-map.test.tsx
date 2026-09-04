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
} from '../components/maps/google-place-map';

describe('Google place map', () => {
  it('loads the async weekly Maps JavaScript API for Singapore', () => {
    expect(buildGoogleMapsScriptUrl('key/value + test')).toBe(
      'https://maps.googleapis.com/maps/api/js?key=key%2Fvalue+%2B+test&loading=async&callback=__signedpriceGoogleMapsReady&v=weekly&language=en&region=SG',
    );
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
    expect(html).toContain('Interactive Google map unavailable in this environment.');
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

  it('places Singapore market prices directly on the map', () => {
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
      label: { text: 'CCR · S$2.1M', className: 'spGoogleMarketMarker' },
    }]);
  });

  it('turns verified Singapore project addresses into price markers', async () => {
    const options: unknown[] = [];
    const location = { lat: () => 1.3039, lng: () => 103.8322 };
    class Marker {
      constructor(input?: unknown) { options.push(input); }
      setPosition() {}
      setMap() {}
    }
    const map = { fitBounds() {} };
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
            geometry: { location, viewport: {} },
          }] };
        },
      },
    };
    options.length = 0;
    const sdk = {
      Map: class { fitBounds() {} },
      Marker,
      Geocoder: class { async geocode() { return { results: [] }; } },
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
      label: { text: 'SGD 2,094,000', className: 'spGoogleMarketMarker' },
    }]);
  });
});
