import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('next/script', () => ({
  default: ({ src }: Readonly<{ src: string }>) => createElement('script', { src }),
}));

import {
  NaverDistrictMap,
  buildNaverMapsScriptUrl,
  mountNaverDistrictMap,
} from '../components/maps/naver-district-map';

const districts = [{
  slug: 'jongno-gu',
  nameEn: 'Jongno-gu',
  href: '/kr/seoul/explore/jongno-gu/',
  latitude: 37.573,
  longitude: 126.9794,
}] as const;

describe('NAVER district map', () => {
  it('loads the official Maps v3 endpoint with an encoded ncpKeyId', () => {
    expect(buildNaverMapsScriptUrl('client/id + value')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=client%2Fid+%2B+value&submodules=geocoder',
    );
  });

  it('keeps a labelled static fallback while the interactive map loads', () => {
    const html = renderToStaticMarkup(createElement(NaverDistrictMap, {
      clientId: 'test-client-id',
      districts,
      fallback: createElement('p', null, 'Static Seoul district map'),
    }));

    expect(html).toContain('data-map-provider="naver"');
    expect(html).toContain('data-map-state="loading"');
    expect(html).toContain('Static Seoul district map');
    expect(html).toContain('ncpKeyId=test-client-id');
    expect(html).toContain('aria-label="Interactive NAVER map of Seoul districts"');
  });

  it('does not request NAVER when a client ID is unavailable', () => {
    const html = renderToStaticMarkup(createElement(NaverDistrictMap, {
      clientId: null,
      districts,
      fallback: createElement('p', null, 'Static Seoul district map'),
    }));

    expect(html).toContain('data-map-provider="static"');
    expect(html).toContain('data-map-state="fallback"');
    expect(html).toContain('Static Seoul district map');
    expect(html).not.toContain('oapi.map.naver.com');
  });

  it('mounts one clickable marker per district on a Seoul map', () => {
    const maps: unknown[] = [];
    const markers: unknown[] = [];
    const listeners: Array<() => void> = [];
    const selected: string[] = [];
    class LatLng {
      constructor(readonly latitude: number, readonly longitude: number) {}
    }
    class Map {
      constructor(readonly element: HTMLElement, readonly options: unknown) {
        maps.push(this);
      }
    }
    class Marker {
      constructor(readonly options: unknown) {
        markers.push(this);
      }
    }
    const sdk = {
      Map,
      LatLng,
      Marker,
      Event: {
        addListener: (_target: unknown, event: string, listener: () => void) => {
          expect(event).toBe('click');
          listeners.push(listener);
        },
      },
    };
    const element = {} as HTMLElement;

    const mounted = mountNaverDistrictMap({
      sdk,
      element,
      districts,
      onSelect: (href) => selected.push(href),
    });

    expect(maps).toHaveLength(1);
    expect(markers).toHaveLength(1);
    expect(mounted.markers).toHaveLength(1);
    expect((maps[0] as Map).element).toBe(element);
    expect((maps[0] as Map).options).toEqual({
      center: new LatLng(37.5665, 126.978),
      zoom: 11,
      minZoom: 10,
    });
    expect((markers[0] as Marker).options).toEqual({
      map: maps[0],
      position: new LatLng(37.573, 126.9794),
      title: 'Jongno-gu',
    });
    listeners[0]?.();
    expect(selected).toEqual(['/kr/seoul/explore/jongno-gu/']);
  });

  it('switches to verified building markers without navigating the district route', () => {
    const maps: Array<{ options: unknown }> = [];
    const markers: Array<{ options: unknown }> = [];
    const listeners: Array<() => void> = [];
    const selected: string[] = [];
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Map {
      constructor(_element: HTMLElement, readonly options: unknown) { maps.push(this); }
    }
    class Marker {
      constructor(readonly options: unknown) { markers.push(this); }
    }
    const sdk = {
      Map, LatLng, Marker,
      Event: { addListener: (_target: unknown, _event: 'click', listener: () => void) => listeners.push(listener) },
    };
    const mounted = mountNaverDistrictMap({
      sdk, element: {} as HTMLElement, districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      buildings: [{
        id: 'tower', title: 'Evidence Tower', href: '/kr/seoul/explore/gangnam-gu/tower/',
        addressQuery: '서울 강남구 역삼동 Evidence Tower', latitude: 37.501, longitude: 127.031,
      }],
      onSelect: () => undefined,
      onSelectBuilding: (id) => selected.push(id),
    });

    expect(maps[0]?.options).toEqual({ center: new LatLng(37.5, 127.03), zoom: 14, minZoom: 10 });
    expect((markers[0]?.options as { title: string }).title).toBe('Evidence Tower');
    expect(mounted.markers).toHaveLength(1);
    listeners[0]?.();
    expect(selected).toEqual(['tower']);
  });
});
