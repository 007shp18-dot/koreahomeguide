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
  isNaverMapsSdkReady,
  mountNaverDistrictMap,
  reconcileNaverDistrictMap,
} from '../components/maps/naver-district-map';
import type { ExploreBuildingModel } from '../lib/public-market/area-route-types';
import * as explorerState from '../lib/public-market/area-explorer-state';

const districts = [{
  slug: 'jongno-gu',
  nameEn: 'Jongno-gu',
  href: '/kr/seoul/explore/jongno-gu/',
  latitude: 37.573,
  longitude: 126.9794,
}] as const;

describe('NAVER district map', () => {
  it('loads the official Maps v3 endpoint without geocoding by default', () => {
    expect(buildNaverMapsScriptUrl('client/id + value')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=client%2Fid+%2B+value',
    );
    expect(buildNaverMapsScriptUrl('client/id + value', true)).toBe(
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
    expect(html).not.toContain('submodules=geocoder');
    expect(html).toContain('aria-label="Interactive NAVER map of Seoul districts"');
  });

  it('loads the geocoder submodule only for explicitly permitted address lookup', () => {
    const html = renderToStaticMarkup(createElement(NaverDistrictMap, {
      clientId: 'test-client-id',
      districts,
      selectedDistrict: districts[0],
      buildings: [{
        id: 'pending', title: 'Pending Tower', href: '/pending/',
        addressQuery: '서울특별시 종로구 Pending Tower', latitude: null, longitude: null,
        allowAddressGeocoding: true,
      }],
      fallback: createElement('p', null, 'Static Seoul district map'),
    }));

    expect(html).toContain('submodules=geocoder');
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

  it('does not request NAVER when every selected building coordinate is pending', () => {
    const html = renderToStaticMarkup(createElement(NaverDistrictMap, {
      clientId: 'test-client-id',
      districts,
      selectedDistrict: districts[0],
      buildings: [{
        id: 'pending', title: 'Pending Tower', href: '/pending/',
        addressQuery: '서울특별시 종로구 Pending Tower', latitude: null, longitude: null,
      }],
      fallback: createElement('p', null, 'Static Seoul district map'),
    }));

    expect(html).toContain('data-map-provider="static"');
    expect(html).toContain('data-map-state="coordinate-pending"');
    expect(html).toContain('Map marker unavailable for 1 building');
    expect(html).not.toContain('oapi.map.naver.com');
  });

  it('rejects a partially initialized SDK after domain authentication fails', () => {
    expect(isNaverMapsSdkReady({
      Map: class {},
      LatLng: null,
      Marker: class {},
      Event: { addListener: () => undefined, removeListener: () => undefined },
    })).toBe(false);
  });

  it('fails closed instead of throwing when the NAVER SDK breaks during mount', () => {
    class LatLng {
      constructor() {
        throw new TypeError('NAVER authentication failed.');
      }
    }
    class Map {
      constructor(element: HTMLElement, options: unknown) { void element; void options; }
      setCenter(center: unknown) { void center; }
      setZoom(zoom: number) { void zoom; }
    }
    class Marker {
      constructor(options: unknown) { void options; }
      setMap(map: unknown) { void map; }
    }
    const sdk = {
      Map,
      LatLng,
      Marker,
      Event: { addListener: () => undefined, removeListener: () => undefined },
    };

    expect(reconcileNaverDistrictMap(null, {
      sdk,
      element: {} as HTMLElement,
      districts,
      onSelect: () => undefined,
    })).toBeNull();
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
      setCenter(center: unknown) { void center; }
      setZoom(zoom: number) { void zoom; }
    }
    class Marker {
      constructor(readonly options: unknown) {
        markers.push(this);
      }
      setMap(map: unknown) { void map; }
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
        removeListener: (listener: unknown) => { void listener; },
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
      setCenter(center: unknown) { void center; }
      setZoom(zoom: number) { void zoom; }
    }
    class Marker {
      constructor(readonly options: unknown) { markers.push(this); }
      setMap(map: unknown) { void map; }
    }
    const sdk = {
      Map, LatLng, Marker,
      Event: {
        addListener: (_target: unknown, _event: 'click', listener: () => void) => listeners.push(listener),
        removeListener: (listener: unknown) => { void listener; },
      },
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

  it('geocodes a null-coordinate building before creating its selectable marker', () => {
    const markers: Array<{ options: unknown }> = [];
    const queries: string[] = [];
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Map {
      constructor(element: HTMLElement, options: unknown) { void element; void options; }
      setCenter(center: unknown) { void center; }
      setZoom(zoom: number) { void zoom; }
    }
    class Marker {
      constructor(readonly options: unknown) { markers.push(this); }
      setMap(map: unknown) { void map; }
    }
    const sdk = {
      Map, LatLng, Marker,
      Event: { addListener: () => undefined, removeListener: () => undefined },
      Service: {
        Status: { OK: 'OK' },
        geocode: (
          input: Readonly<{ query: string }>,
          callback: (status: string, response: { v2: { addresses: { x: string; y: string }[] } }) => void,
        ) => {
          queries.push(input.query);
          callback('OK', { v2: { addresses: [{ x: '127.031', y: '37.501' }] } });
        },
      },
    };

    const mounted = mountNaverDistrictMap({
      sdk, element: {} as HTMLElement, districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      buildings: [{
        id: 'tower', title: 'Evidence Tower', href: '/kr/seoul/explore/gangnam-gu/tower/',
        addressQuery: '서울특별시 강남구 역삼동 Evidence Tower', latitude: null, longitude: null,
        allowAddressGeocoding: true,
      }],
      onSelect: () => undefined,
    });

    expect(queries).toEqual(['서울특별시 강남구 역삼동 Evidence Tower']);
    expect(markers[0]?.options).toEqual({
      map: mounted.map,
      position: new LatLng(37.501, 127.031),
      title: 'Evidence Tower',
    });
    expect(mounted.unavailableBuildingIds).toEqual([]);
  });

  it('keeps coordinate-pending buildings out of address geocoding by default', () => {
    const unavailable: string[] = [];
    const queries: string[] = [];
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Map {
      constructor(element: HTMLElement, options: unknown) { void element; void options; }
      setCenter(center: unknown) { void center; }
      setZoom(zoom: number) { void zoom; }
    }
    class Marker {
      constructor(options: unknown) { void options; }
      setMap(map: unknown) { void map; }
    }
    const mounted = mountNaverDistrictMap({
      sdk: {
        Map, LatLng, Marker,
        Event: { addListener: () => undefined, removeListener: () => undefined },
        Service: {
          Status: { OK: 'OK' },
          geocode: (input: Readonly<{ query: string }>) => { queries.push(input.query); },
        },
      },
      element: {} as HTMLElement,
      districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      buildings: [{
        id: 'pending', title: 'Pending Tower', href: '/pending/',
        addressQuery: '서울특별시 강남구 역삼동 Pending Tower', latitude: null, longitude: null,
      }],
      onSelect: () => undefined,
      onBuildingMarkerUnavailable: (id) => unavailable.push(id),
    });

    expect(queries).toEqual([]);
    expect(mounted.unavailableBuildingIds).toEqual(['pending']);
    expect(unavailable).toEqual(['pending']);
  });

  it('reports marker absence after null-coordinate geocoding fails without blocking the rail', () => {
    const unavailable: string[] = [];
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Map {
      constructor(element: HTMLElement, options: unknown) { void element; void options; }
      setCenter(center: unknown) { void center; }
      setZoom(zoom: number) { void zoom; }
    }
    class Marker {
      constructor(options: unknown) { void options; }
      setMap(map: unknown) { void map; }
    }
    const sdk = {
      Map, LatLng, Marker,
      Event: { addListener: () => undefined, removeListener: () => undefined },
      Service: {
        Status: { OK: 'OK' },
        geocode: (
          _input: Readonly<{ query: string }>,
          callback: (status: string, response: { v2: { addresses: never[] } }) => void,
        ) => callback('ERROR', { v2: { addresses: [] } }),
      },
    };

    const mounted = mountNaverDistrictMap({
      sdk, element: {} as HTMLElement, districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      buildings: [{
        id: 'unmapped', title: 'Unmapped Tower', href: '/kr/seoul/explore/gangnam-gu/unmapped/',
        addressQuery: '서울특별시 강남구 역삼동 Unmapped Tower', latitude: null, longitude: null,
        allowAddressGeocoding: true,
      }],
      onSelect: () => undefined,
      onBuildingMarkerUnavailable: (id) => unavailable.push(id),
    });

    expect(mounted.markers).toEqual([]);
    expect(mounted.unavailableBuildingIds).toEqual(['unmapped']);
    expect(unavailable).toEqual(['unmapped']);
  });

  it('updates A to B, cleans old markers and listeners, and ignores late A geocodes', () => {
    type GeocodeCallback = Parameters<NonNullable<Parameters<
      typeof mountNaverDistrictMap
    >[0]['sdk']['Service']>['geocode']>[1];
    type Listener = Readonly<{ callback: () => void }>;
    const pending = new globalThis.Map<string, GeocodeCallback>();
    const removedListeners: Listener[] = [];
    const markers: Marker[] = [];
    const maps: Map[] = [];
    const selected: string[] = [];
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Map {
      readonly centers: unknown[] = [];
      readonly zooms: number[] = [];
      constructor(
        _element: HTMLElement,
        readonly options: Readonly<{ center: unknown; zoom: number; minZoom: number }>,
      ) { maps.push(this); }
      setCenter(center: unknown) { this.centers.push(center); }
      setZoom(zoom: number) { this.zooms.push(zoom); }
    }
    class Marker {
      readonly mapHistory: unknown[] = [];
      constructor(readonly options: Readonly<{ title: string }>) { markers.push(this); }
      setMap(map: unknown) { this.mapHistory.push(map); }
    }
    const sdk = {
      Map, LatLng, Marker,
      Event: {
        addListener: (target: unknown, _event: 'click', callback: () => void) => {
          const listener = { callback };
          (target as Marker & { listener?: Listener }).listener = listener;
          return listener;
        },
        removeListener: (listener: Listener) => removedListeners.push(listener),
      },
      Service: {
        Status: { OK: 'OK' },
        geocode: (input: Readonly<{ query: string }>, callback: GeocodeCallback) => {
          if (input.query === 'A missing now') {
            callback('ERROR', { v2: { addresses: [] } });
          } else {
            pending.set(input.query, callback);
          }
        },
      },
    };
    const mounted = mountNaverDistrictMap({
      sdk,
      element: {} as HTMLElement,
      districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      buildings: [
        {
          id: 'a-sync', title: 'A Sync', href: '/a-sync/', addressQuery: 'A sync',
          latitude: 37.501, longitude: 127.031,
        },
        {
          id: 'a-missing', title: 'A Missing', href: '/a-missing/', addressQuery: 'A missing now',
          latitude: null, longitude: null, allowAddressGeocoding: true,
        },
        {
          id: 'a-late-success', title: 'A Late Success', href: '/a-late-success/',
          addressQuery: 'A late success', latitude: null, longitude: null,
          allowAddressGeocoding: true,
        },
        {
          id: 'a-late-fail', title: 'A Late Fail', href: '/a-late-fail/',
          addressQuery: 'A late fail', latitude: null, longitude: null,
          allowAddressGeocoding: true,
        },
      ],
      onSelect: () => undefined,
      onSelectBuilding: (id) => selected.push(`A:${id}`),
    });
    const lifecycle = mounted;

    expect(lifecycle.unavailableBuildingIds).toEqual(['a-missing']);
    const aMarker = markers[0]!;
    const firstListener = (aMarker as Marker & { listener?: Listener }).listener;

    lifecycle.update({
      districts,
      selectedDistrict: { latitude: 37.6, longitude: 127.1 },
      buildings: [{
        id: 'b-async', title: 'B Async', href: '/b-async/', addressQuery: 'B current',
        latitude: null, longitude: null, allowAddressGeocoding: true,
      }],
      onSelect: () => undefined,
      onSelectBuilding: (id) => selected.push(`B:${id}`),
    });

    expect(aMarker.mapHistory).toEqual([null]);
    expect(removedListeners).toHaveLength(1);
    expect(maps).toHaveLength(1);
    expect(maps[0]?.centers).toEqual([new LatLng(37.6, 127.1)]);
    expect(maps[0]?.zooms).toEqual([14]);
    expect(lifecycle.unavailableBuildingIds).toEqual([]);
    expect(markers.map(({ options }) => options.title)).toEqual(['A Sync']);

    pending.get('B current')?.('OK', {
      v2: { addresses: [{ x: '127.101', y: '37.601' }] },
    });
    expect(markers.map(({ options }) => options.title)).toEqual(['A Sync', 'B Async']);

    pending.get('A late success')?.('OK', {
      v2: { addresses: [{ x: '127.04', y: '37.51' }] },
    });
    pending.get('A late fail')?.('ERROR', { v2: { addresses: [] } });

    expect(markers.map(({ options }) => options.title)).toEqual(['A Sync', 'B Async']);
    expect(lifecycle.unavailableBuildingIds).toEqual([]);
    firstListener?.callback();
    expect(selected).toEqual([]);

    const bMarker = markers[1] as Marker & { listener?: Listener };
    bMarker.listener?.callback();
    expect(selected).toEqual(['B:b-async']);

    lifecycle.dispose();
    expect(bMarker.mapHistory).toEqual([null]);
    expect(removedListeners).toHaveLength(2);
  });

  it('resolves a real marker click and rail selection to the same panel and canonical CTA', () => {
    const listeners: Array<() => void> = [];
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Map {
      constructor(element: HTMLElement, options: unknown) { void element; void options; }
      setCenter(center: unknown) { void center; }
      setZoom(zoom: number) { void zoom; }
    }
    class Marker {
      constructor(options: unknown) { void options; }
      setMap(map: unknown) { void map; }
    }
    const sdk = {
      Map, LatLng, Marker,
      Event: {
        addListener: (_target: unknown, _event: 'click', listener: () => void) => {
          listeners.push(listener);
        },
        removeListener: (listener: unknown) => { void listener; },
      },
    };
    const building = {
      id: 'evidence-tower', districtSlug: 'gangnam-gu', neighborhoodId: 'yeoksam-dong',
      neighborhoodName: '역삼동', name: 'Evidence Tower', housingType: 'apartment',
      evidenceStatus: 'published', observationCount: 6, jeonseObservationCount: 6,
      monthlyObservationCount: 0, firstObservedMonth: '2026-01', lastObservedMonth: '2026-07',
      latitude: 37.501, longitude: 127.031, sampleLabel: '6 reported contracts',
      medianLabel: '₩320,000,000', newSampleLabel: '3 reported contracts',
      newMedianLabel: null, renewalSampleLabel: '2 reported contracts',
      renewalMedianLabel: null, unknownContractCount: 1,
      href: '/kr/seoul/explore/gangnam-gu/evidence-tower/',
    } as const satisfies ExploreBuildingModel;
    let selection: explorerState.BuildingExplorerSelectionState = Object.freeze({
      selectedBuildingId: null,
    });
    mountNaverDistrictMap({
      sdk,
      element: {} as HTMLElement,
      districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      buildings: [{
        id: building.id, title: building.name, href: building.href,
        addressQuery: '서울특별시 강남구 역삼동 Evidence Tower',
        latitude: building.latitude, longitude: building.longitude,
      }],
      onSelect: () => undefined,
      onSelectBuilding: (buildingId) => {
        selection = explorerState.buildingExplorerSelectionReducer(selection, {
          type: 'select_building', source: 'marker', buildingId,
        });
      },
    });

    listeners[0]?.();
    const resolver = (explorerState as typeof explorerState & Readonly<{
      resolveSelectedExploreBuilding?: (
        buildings: readonly ExploreBuildingModel[],
        selectedBuildingId: string | null,
      ) => ExploreBuildingModel | null;
    }>).resolveSelectedExploreBuilding;
    expect(typeof resolver).toBe('function');
    if (resolver === undefined) return;
    const markerPanel = resolver([building], selection.selectedBuildingId);

    selection = Object.freeze({ selectedBuildingId: null });
    selection = explorerState.buildingExplorerSelectionReducer(selection, {
      type: 'select_building', source: 'rail', buildingId: building.id,
    });
    const railPanel = resolver([building], selection.selectedBuildingId);

    expect(markerPanel).toEqual(railPanel);
    expect(markerPanel).toMatchObject({
      id: 'evidence-tower',
      href: '/kr/seoul/explore/gangnam-gu/evidence-tower/',
    });
  });
});
