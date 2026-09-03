import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/script', () => ({
  default: ({ src }: Readonly<{ src: string }>) => createElement('script', { src }),
}));

import {
  GoogleBuildingStreetView,
  mountGoogleBuildingMap,
  mountGoogleBuildingStreetView,
  resolveGoogleBuildingLocation,
} from '../components/maps/google-building-street-view';
import {
  NaverBuildingStreetView,
  mountNaverBuildingMap,
  mountNaverBuildingStreetView,
  resolveNaverBuildingLocation,
} from '../components/maps/naver-building-street-view';

describe('provider building street view', () => {
  it('mounts NAVER Panorama at the verified coordinate and reports a nearby pano', () => {
    const events: Array<() => void> = [];
    const panoramas: unknown[] = [];
    class LatLng {
      constructor(readonly latitude: number, readonly longitude: number) {}
    }
    class Panorama {
      constructor(readonly element: HTMLElement, readonly options: unknown) {
        panoramas.push(this);
      }
      getLocation() { return { panoId: 'verified-nearby-pano' }; }
      destroy() { return undefined; }
    }
    const states: string[] = [];
    const mounted = mountNaverBuildingStreetView({
      sdk: {
        LatLng,
        Panorama,
        Event: {
          addListener: (_target, event, listener) => {
            expect(event).toBe('pano_changed');
            events.push(listener);
            return listener;
          },
          removeListener: () => undefined,
        },
      },
      element: {} as HTMLElement,
      latitude: 37.501,
      longitude: 127.031,
      onState: (state) => states.push(state),
    });

    expect((panoramas[0] as Panorama).options).toEqual({
      position: new LatLng(37.501, 127.031),
    });
    events[0]?.();
    expect(states).toEqual(['ready']);
    mounted.dispose();
  });

  it('checks Google outdoor imagery within 50 metres before constructing a panorama', async () => {
    const panoramaCalls: unknown[] = [];
    class StreetViewService {
      async getPanorama(request: unknown) {
        expect(request).toEqual({
          location: { lat: 1.2834, lng: 103.8607 },
          radius: 50,
          source: 'OUTDOOR',
        });
        return { data: { location: { pano: 'nearby-pano-id' } } };
      }
    }
    class StreetViewPanorama {
      constructor(element: HTMLElement, options: unknown) {
        panoramaCalls.push({ element, options });
      }
    }
    const element = {} as HTMLElement;

    await expect(mountGoogleBuildingStreetView({
      sdk: {
        StreetViewService,
        StreetViewPanorama,
        StreetViewSource: { OUTDOOR: 'OUTDOOR' },
      },
      element,
      latitude: 1.2834,
      longitude: 103.8607,
    })).resolves.toBe('ready');
    expect(panoramaCalls).toEqual([{
      element,
      options: {
        pano: 'nearby-pano-id',
        addressControl: false,
        fullscreenControl: true,
      },
    }]);
  });

  it('mounts same-provider live maps when nearby imagery is unavailable', () => {
    const naverMaps: unknown[] = [];
    class NaverLatLng { constructor(readonly lat: number, readonly lng: number) {} }
    class NaverMap {
      constructor(readonly element: HTMLElement, readonly options: unknown) { naverMaps.push(this); }
    }
    class NaverMarker { constructor(readonly options: unknown) { naverMaps.push(this); } }
    mountNaverBuildingMap({
      sdk: { LatLng: NaverLatLng, Map: NaverMap, Marker: NaverMarker },
      element: {} as HTMLElement,
      buildingName: 'Evidence Tower', latitude: 37.501, longitude: 127.031,
    });
    expect((naverMaps[0] as NaverMap).options).toEqual({
      center: new NaverLatLng(37.501, 127.031), zoom: 17, minZoom: 10,
    });

    const googleMaps: unknown[] = [];
    class GoogleMap {
      constructor(readonly element: HTMLElement, readonly options: unknown) { googleMaps.push(this); }
    }
    mountGoogleBuildingMap({
      sdk: { Map: GoogleMap }, element: {} as HTMLElement,
      latitude: 1.2834, longitude: 103.8607,
    });
    expect((googleMaps[0] as GoogleMap).options).toEqual({
      center: { lat: 1.2834, lng: 103.8607 }, zoom: 17,
      mapTypeControl: false, streetViewControl: false,
    });
  });

  it('renders honest nearby-view labels and never requests a provider without a key', () => {
    const naver = renderToStaticMarkup(<NaverBuildingStreetView
      clientId="naver-client"
      buildingName="Evidence Tower"
      latitude={37.501}
      longitude={127.031}
      addressQuery="서울특별시 강남구 역삼동 Evidence Tower"
      mapHref="/kr/seoul/explore/?district=gangnam-gu"
    />);
    expect(naver).toContain('Nearby street view · not a listing photo');
    expect(naver).toContain('submodules=panorama,geocoder');
    expect(naver).not.toContain('panorama%2Cgeocoder');
    expect(naver).toContain('data-building-media="naver-panorama"');

    const google = renderToStaticMarkup(<GoogleBuildingStreetView
      browserKey={null}
      buildingName="Evidence Residence"
      latitude={1.2834}
      longitude={103.8607}
      mapHref="/sg/singapore/explore/"
    />);
    expect(google).toContain('Street view unavailable');
    expect(google).toContain('View this building area on the map');
    expect(google).not.toContain('maps.googleapis.com');
  });

  it('geocodes a Singapore building address before requesting nearby imagery', async () => {
    const geocode = vi.fn(async () => ({ results: [{ geometry: { location: {
      lat: () => 1.334, lng: () => 103.912,
    } } }] }));
    await expect(resolveGoogleBuildingLocation({
      sdk: { Geocoder: class { geocode = geocode; } },
      address: '10 BEDOK STREET, Singapore',
    })).resolves.toEqual({ latitude: 1.334, longitude: 103.912 });
    expect(geocode).toHaveBeenCalledWith({
      address: '10 BEDOK STREET, Singapore',
      componentRestrictions: { country: 'SG' },
      region: 'SG',
    });
  });

  it('geocodes one unambiguous Seoul building identity before requesting nearby imagery', async () => {
    const geocode = vi.fn((
      _input: Readonly<{ query: string }>,
      callback: (status: string, response: Readonly<{
        v2: Readonly<{ addresses: readonly Readonly<{
          x: string; y: string; roadAddress: string; jibunAddress: string;
        }>[] }>;
      }>) => void,
    ) => callback('OK', { v2: { addresses: [{
      x: '127.1598', y: '37.4976',
      roadAddress: '서울특별시 송파구 송파대로 345',
      jibunAddress: '서울특별시 송파구 가락동 913',
    }] } }));
    const addressQuery = '서울특별시 송파구 가락동 헬리오시티';

    await expect(resolveNaverBuildingLocation({
      sdk: { Service: { Status: { OK: 'OK' }, geocode } },
      addressQuery,
    })).resolves.toEqual({ latitude: 37.4976, longitude: 127.1598 });
    expect(geocode).toHaveBeenCalledWith({ query: addressQuery }, expect.any(Function));
  });
});
