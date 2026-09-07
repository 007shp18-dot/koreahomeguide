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
  buildGoogleBuildingLookup,
  clusterNaverBuildings,
  buildNaverBuildingMarkerContent,
  buildNaverDistrictMarkerContent,
  buildNaverNeighborhoodMarkerContent,
  buildNaverBuildingAddressQuery,
  buildNaverMapsScriptUrl,
  isNaverMapsSdkReady,
  mountNaverDistrictMap,
  reconcileNaverDistrictMap,
  waitForNaverMapsSubmodules,
  resolveUnambiguousNaverGeocode,
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
  it('retains unlocated neighborhood totals at an approximate district reference without a geocoder', () => {
    const icons: string[] = [];
    const clicks: (() => void)[] = [];
    const onOpenAreaBuildings = vi.fn();
    class Map { setCenter() {} setZoom() {} }
    class LatLng {}
    class Marker { constructor(options: { icon?: { content: string } }) { icons.push(options.icon?.content ?? ''); } setMap() {} }
    mountNaverDistrictMap({
      sdk: { Map, LatLng, Marker, Event: { addListener: (_target, event, callback) => { if (event === 'click') clicks.push(callback); }, removeListener() {} } },
      element: {} as HTMLElement, districts, selectedDistrict: districts[0],
      neighborhoods: [{ id: 'a', title: 'A', addressQuery: 'Seoul A', latitude: null, longitude: null, buildingCount: 774 },
        { id: 'b', title: 'B', addressQuery: 'Seoul B', latitude: 37.57, longitude: 126.98, buildingCount: 1 }],
      onSelect: vi.fn(), onOpenAreaBuildings,
    });
    expect(icons).toHaveLength(2);
    expect(icons.some(icon => icon.includes('spMapAreaGroup') && icon.includes('774'))).toBe(true);
    clicks.at(-1)!();
    expect(onOpenAreaBuildings).toHaveBeenCalledOnce();
  });

  it('represents every matching building as a real location or an explicitly approximate area group', () => {
    const active = new Set<{ title: string; content: string }>();
    class TestMap { setCenter() {} setZoom() {} getZoom() { return 18; } }
    class LatLng {}
    class Marker {
      value: { title: string; content: string };
      constructor(options: { title: string; icon?: { content: string } }) {
        this.value = { title: options.title, content: options.icon?.content ?? '' }; active.add(this.value);
      }
      setMap(value: unknown) { if (value === null) active.delete(this.value); }
    }
    const ref = { id: 'jongno-gu', title: 'Jongno-gu', latitude: 37.573, longitude: 126.9794 };
    const points = Array.from({ length: 775 }, (_, i) => ({ id: String(i), title: `Building ${i}`,
      href: `/building/${i}`, addressQuery: '', latitude: i < 3 ? 37.571 + i * .001 : null,
      longitude: i < 3 ? 126.98 : null, areaReference: ref }));
    const resolved = vi.fn();
    const coverage = vi.fn();
    const mounted = mountNaverDistrictMap({
      sdk: { Map: TestMap, LatLng, Marker, Event: { addListener: () => undefined, removeListener() {} } },
      element: {} as HTMLElement, districts, selectedDistrict: ref, buildings: points.slice(0, 50),
      areaGroups: [{ reference: ref, count: 725 }],
      onSelect: vi.fn(), onResolveBuildingLocation: resolved, onCoverageChange: coverage,
    });
    expect(active.size).toBe(4);
    expect([...active].find(({ content }) => content.includes('spMapAreaGroup'))?.content).toContain('772');
    expect([...active].find(({ content }) => content.includes('spMapAreaGroup'))?.content).toContain('Area only');
    expect(resolved).not.toHaveBeenCalled();
    expect(coverage).toHaveBeenLastCalledWith({ total: 775, located: 3, grouped: 772, unplaced: 0 });
    mounted.update({ districts, selectedDistrict: ref, buildings: points.slice(0, 3), onSelect: vi.fn() });
    expect(active.size).toBe(3);
  });

  it('moves an unlocated building group to its verified neighborhood reference', () => {
    const active = new Set<Marker>();
    class TestMap { setCenter() {} setZoom() {} getZoom() { return 18; } }
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Marker {
      constructor(readonly options: { map: unknown; position: unknown; title: string; icon?: { content: string } }) { active.add(this); }
      setMap(value: unknown) { if (value === null) active.delete(this); }
    }
    const reference = {
      id: 'hwayang-dong', title: '화양동', latitude: 37.54, longitude: 127.08,
      neighborhoodId: 'hwayang-dong', addressQuery: '서울특별시 광진구 화양동',
    };
    mountNaverDistrictMap({
      sdk: {
        Map: TestMap, LatLng, Marker,
        Event: { addListener: () => undefined, removeListener() {} },
        Service: {
          Status: { OK: 'OK' },
          geocode: (_input, callback) => callback('OK', { v2: { addresses: [{
            x: '127.0712', y: '37.5435', jibunAddress: '서울특별시 광진구 화양동',
          }] } }),
        },
      },
      element: {} as HTMLElement,
      districts,
      selectedDistrict: districts[0],
      buildings: [{
        id: 'unlocated', title: 'Unlocated', href: '/building/unlocated', addressQuery: '',
        latitude: null, longitude: null, areaReference: reference,
      }],
      onSelect: vi.fn(),
    });

    expect([...active]).toHaveLength(1);
    expect([...active][0]!.options.position).toEqual(new LatLng(37.5435, 127.0712));
  });

  it('preserves user zoom when the same district receives updated selection props', () => {
    const setCenter = vi.fn();
    const setZoom = vi.fn();
    class TestMap { setCenter = setCenter; setZoom = setZoom; }
    class LatLng { constructor(readonly lat: number, readonly lng: number) {} }
    class Marker { setMap() {} }
    const sdk = { Map: TestMap, LatLng, Marker, Event: { addListener: vi.fn(), removeListener: vi.fn() } };
    const selectedDistrict = { latitude: 37.5, longitude: 127.03 };
    const options = { districts, selectedDistrict, buildings: [], onSelect: vi.fn() };
    const mounted = mountNaverDistrictMap({ sdk, element: {} as HTMLElement, ...options });
    mounted.update({ ...options, selectedDistrict: { ...selectedDistrict } });
    expect(setZoom).not.toHaveBeenCalled();
    expect(setCenter).not.toHaveBeenCalled();
    mounted.update({ ...options, selectedDistrict: undefined });
    expect(setZoom).toHaveBeenCalledWith(11);
  });

  it('clusters verified coordinates and expands them at building zoom without inventing missing locations', () => {
    const point = { id: 'a', title: 'A', href: '/a/', addressQuery: 'Seoul', latitude: 37.5001, longitude: 127.0001 };
    const points = [point, { ...point, id: 'b', latitude: 37.5002 },
      { ...point, id: 'missing', latitude: null }, { ...point, id: 'invalid', longitude: NaN }];
    const clustered = clusterNaverBuildings(points, 14);
    expect(clustered).toHaveLength(1);
    expect(clustered[0]!.buildings.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(clustered[0]!.latitude).toBeCloseTo(37.50015);
    expect(clusterNaverBuildings(points, 17)).toHaveLength(2);
    expect(clusterNaverBuildings([point, { ...points[1]!, selected: true }], 14)).toHaveLength(2);
  });

  it('shows every located building after choosing a neighborhood at any current zoom', () => {
    const visible: unknown[] = [];
    class TestMap { setCenter() {} setZoom() {} getZoom() { return 13; } }
    class LatLng { constructor(readonly lat: number, readonly lng: number) {} }
    class Marker { constructor(options: unknown) { visible.push(options); } setMap() {} }
    const sdk = { Map: TestMap, LatLng, Marker, Event: { addListener: vi.fn(), removeListener: vi.fn() } };
    const point = { id: 'a', title: 'A', href: '/a/', addressQuery: 'Seoul', latitude: 37.5001, longitude: 127.0001 };
    mountNaverDistrictMap({ sdk, element: {} as HTMLElement, districts, selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      focusAddressQuery: '서울특별시 강남구 역삼동', buildings: [point, { ...point, id: 'b', title: 'B', latitude: 37.5002 }], onSelect: vi.fn() });
    expect(visible).toHaveLength(2);
  });

  it('rejects a geocode for a different parcel in the same neighborhood', () => {
    expect(resolveUnambiguousNaverGeocode('서울특별시 도봉구 도봉동 554-31', [
      { x: '127.04', y: '37.67', jibunAddress: '서울특별시 도봉구 도봉동 554-32' },
    ])).toBeNull();
    expect(resolveUnambiguousNaverGeocode('서울특별시 도봉구 도봉동 554-31', [
      { x: '127.04', y: '37.67', jibunAddress: '서울특별시 도봉구 도봉동 554-31' },
    ])).not.toBeNull();
  });

  it('builds a compact district label without repeating price details on the map', () => {
    expect(buildNaverDistrictMarkerContent({
      ...districts[0],
      nameEn: '<Jongno>',
      metricLabel: '₩500M & up',
      sampleLabel: '5 filings',
      selected: true,
    })).toBe(
      '<div class="spMapDistrictBubble spMapDistrictBubbleSelected"><span>&lt;Jongno&gt;</span></div>',
    );
  });

  it('builds a compact building price label and keeps full details in the linked panel', () => {
    expect(buildNaverBuildingMarkerContent({
      id: 'tower',
      title: '<Evidence Tower>',
      href: '/tower/',
      addressQuery: 'Seoul',
      latitude: 37.5,
      longitude: 127,
      metricLabel: '₩1.2B & up',
      sampleLabel: '8 filings',
      selected: true,
    })).toBe(
      '<div class="spMapBuildingBubble spMapBuildingBubbleSelected"><strong>₩1.2B &amp; up</strong></div>',
    );
  });

  it('builds a safe neighborhood count marker between district and building tiers', () => {
    expect(buildNaverNeighborhoodMarkerContent({
      id: 'yeoksam-dong',
      title: '<Yeoksam-dong>',
      addressQuery: '서울특별시 강남구 역삼동',
      latitude: 37.5,
      longitude: 127.03,
      buildingCount: 128,
      selected: true,
    })).toBe(
      '<div class="spMapNeighborhoodBubble spMapNeighborhoodBubbleSelected"><span>&lt;Yeoksam-dong&gt;</span><strong>128</strong></div>',
    );
  });

  it('renders neighborhood counts and sends a marker click to the same neighborhood selection', () => {
    const icons: string[] = [];
    const clicks: Array<() => void> = [];
    const selected = vi.fn();
    class Map { setCenter() {} setZoom() {} }
    class LatLng {}
    class Marker {
      constructor(options: { icon?: { content: string } }) { icons.push(options.icon?.content ?? ''); }
      setMap() {}
    }
    mountNaverDistrictMap({
      sdk: { Map, LatLng, Marker, Event: { addListener: (_target, _event, callback) => { clicks.push(callback); }, removeListener: () => undefined } },
      element: {} as HTMLElement,
      districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      neighborhoods: [{ id: 'yeoksam', title: '역삼동', addressQuery: '서울특별시 강남구 역삼동', latitude: 37.5, longitude: 127.03, buildingCount: 678 }],
      onSelect: vi.fn(),
      onSelectNeighborhood: selected,
    });
    expect(icons).toHaveLength(1);
    expect(icons[0]).toContain('spMapNeighborhoodBubble');
    expect(icons[0]).toContain('678');
    clicks[0]!();
    expect(selected).toHaveBeenCalledWith('yeoksam');
  });

  it('moves and zooms the existing map when a building becomes selected', () => {
    const centers: unknown[] = [];
    const zooms: number[] = [];
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Map {
      setCenter(center: unknown) { centers.push(center); }
      setZoom(zoom: number) { zooms.push(zoom); }
      getZoom() { return 14; }
    }
    class Marker { setMap() {} }
    const sdk = {
      Map, LatLng, Marker,
      Event: { addListener: () => undefined, removeListener: () => undefined },
    };
    const building = {
      id: 'tower', title: 'Evidence Tower', href: '/tower/', addressQuery: 'Seoul',
      latitude: 37.501, longitude: 127.031,
    } as const;
    const options = {
      districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      buildings: [building],
      onSelect: vi.fn(),
    };
    const mounted = mountNaverDistrictMap({ sdk, element: {} as HTMLElement, ...options });

    mounted.update({ ...options, buildings: [{ ...building, selected: true }] });

    expect(centers).toEqual([new LatLng(37.501, 127.031)]);
    expect(zooms).toEqual([17]);
  });

  it('waits for the asynchronous geocoder submodule before exposing the SDK', () => {
    const ready: unknown[] = [];
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
    const sdk: Record<string, unknown> = {
      Map, LatLng, Marker,
      Event: { addListener: () => undefined, removeListener: () => undefined },
    };

    const cancel = waitForNaverMapsSubmodules(sdk, true, (value) => ready.push(value));

    expect(ready).toEqual([]);
    sdk.Service = { Status: { OK: 'OK' }, geocode: () => undefined };
    expect(typeof sdk.onJSContentLoaded).toBe('function');
    (sdk.onJSContentLoaded as () => void)();
    expect(ready).toEqual([sdk]);
    cancel();
  });

  it('normalizes MOLIT parenthesized lot numbers into NAVER geocoder addresses', () => {
    expect(buildNaverBuildingAddressQuery('강남구', '개포동', '(1163-4)')).toBe(
      '서울특별시 강남구 개포동 1163-4',
    );
    expect(buildNaverBuildingAddressQuery('종로구', '평창동', '(산12-3)')).toBe(
      '서울특별시 종로구 평창동 산12-3',
    );
    expect(buildNaverBuildingAddressQuery('강남구', '대치동', '검증아파트')).toBe(
      '서울특별시 강남구 대치동 검증아파트',
    );
  });

  it('accepts only one geocode whose returned locality matches the normalized query', () => {
    const matching = {
      x: '127.031',
      y: '37.501',
      roadAddress: '서울특별시 강남구 테헤란로 1',
      jibunAddress: '서울특별시 강남구 역삼동 1',
    };

    expect(resolveUnambiguousNaverGeocode(
      '서울특별시 강남구 역삼동 Evidence Tower',
      [matching],
    )).toBe(matching);
    expect(resolveUnambiguousNaverGeocode(
      '서울특별시 강남구 역삼동 Evidence Tower',
      [matching, { ...matching, x: '127.041' }],
    )).toBeNull();
    expect(resolveUnambiguousNaverGeocode(
      '서울특별시 강남구 역삼동 Evidence Tower',
      [matching, {
        ...matching,
        x: '127.041',
        jibunAddress: '서울특별시 강남구 삼성동 1',
      }],
    )).toBe(matching);
    expect(resolveUnambiguousNaverGeocode(
      '서울특별시 강남구 역삼동 Evidence Tower',
      [{ ...matching, jibunAddress: '서울특별시 강남구 삼성동 1' }],
    )).toBeNull();
  });

  it('builds stable official Maps v3 endpoints for the requested submodules', () => {
    expect(buildNaverMapsScriptUrl('client/id + value')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=client%2Fid+%2B+value',
    );
    expect(buildNaverMapsScriptUrl('client/id + value', true)).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=client%2Fid+%2B+value&submodules=geocoder',
    );
    expect(buildNaverMapsScriptUrl('client/id + value', true, true)).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=client%2Fid+%2B+value&submodules=panorama,geocoder',
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
    expect(html).toContain('submodules=geocoder');
    expect(html).toContain('aria-label="Interactive NAVER map of Seoul districts"');
  });

  it('uses the same SDK URL before and after a district-to-building transition', () => {
    const city = renderToStaticMarkup(createElement(NaverDistrictMap, {
      clientId: 'test-client-id', districts, fallback: createElement('p', null, 'Loading'),
    }));
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
    expect(html.match(/src="([^"]+)"/)?.[1]).toBe(city.match(/src="([^"]+)"/)?.[1]);
  });

  it('does not promise loading when the map cannot start', () => {
    const html = renderToStaticMarkup(createElement(NaverDistrictMap, {
      clientId: null,
      districts,
      fallback: createElement('p', null, 'Loading the NAVER map.'),
    }));
    expect(html).toContain('Map unavailable');
    expect(html).toContain('Continue browsing the list');
    expect(html).not.toContain('Loading the NAVER map.');
  });

  it('does not request NAVER when a client ID is unavailable', () => {
    const html = renderToStaticMarkup(createElement(NaverDistrictMap, {
      clientId: null,
      districts,
      fallback: createElement('p', null, 'Static Seoul district map'),
    }));

    expect(html).toContain('data-map-provider="static"');
    expect(html).toContain('data-map-state="fallback"');
    expect(html).toContain('Map unavailable');
    expect(html).not.toContain('oapi.map.naver.com');
  });

  it('keeps NAVER visible when every selected building coordinate is pending', () => {
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

    expect(html).toContain('data-map-provider="naver"');
    expect(html).toContain('data-map-state="loading"');
    expect(html).toContain('oapi.map.naver.com');
  });

  it('rejects a partially initialized SDK after domain authentication fails', () => {
    expect(isNaverMapsSdkReady({
      Map: class {},
      LatLng: null,
      Marker: class {},
      Event: { addListener: () => undefined, removeListener: () => undefined },
    })).toBe(false);
  });

  it('releases references without calling a revoked SDK after authentication failure', () => {
    let revoked = false;
    const removeListener = vi.fn(() => {
      if (revoked) throw new TypeError("Cannot read properties of null (reading 'isArray')");
    });
    const setMap = vi.fn(() => {
      if (revoked) throw new TypeError('NAVER SDK revoked');
    });
    class Map { setCenter() {} setZoom() {} }
    class LatLng {}
    class Marker { setMap = setMap; }
    const lifecycle = mountNaverDistrictMap({
      sdk: { Map, LatLng, Marker, Event: { addListener: () => ({}), removeListener } },
      element: {} as HTMLElement,
      districts,
      onSelect: () => undefined,
    });
    revoked = true;
    expect(() => lifecycle.dispose({ sdkAvailable: false })).not.toThrow();
    expect(() => lifecycle.invalidate()).not.toThrow();
    expect(() => lifecycle.dispose()).not.toThrow();
    expect(removeListener).not.toHaveBeenCalled();
    expect(setMap).not.toHaveBeenCalled();
    expect(lifecycle.markers).toEqual([]);
    expect(lifecycle.map).toBeNull();
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
          callback: (status: string, response: { v2: { addresses: {
            x: string;
            y: string;
            roadAddress?: string;
            jibunAddress?: string;
          }[] } }) => void,
        ) => {
          queries.push(input.query);
          callback('OK', { v2: { addresses: [{
            x: '127.031', y: '37.501',
            roadAddress: '서울특별시 강남구 테헤란로 1',
            jibunAddress: '서울특별시 강남구 역삼동 1',
          }] } });
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
      icon: {
        content: '<div class="spMapBuildingBubble"><strong>—</strong></div>',
      },
    });
    expect(mounted.unavailableBuildingIds).toEqual([]);
  });

  it('keeps an ambiguous multi-address geocode pending instead of choosing the first result', () => {
    const unavailable: string[] = [];
    const markers: Marker[] = [];
    class LatLng { constructor(readonly latitude: number, readonly longitude: number) {} }
    class Map {
      constructor(element: HTMLElement, options: unknown) { void element; void options; }
      setCenter(center: unknown) { void center; }
      setZoom(zoom: number) { void zoom; }
    }
    class Marker {
      constructor(options: unknown) { void options; markers.push(this); }
      setMap(map: unknown) { void map; }
    }
    const sdk = {
      Map, LatLng, Marker,
      Event: { addListener: () => undefined, removeListener: () => undefined },
      Service: {
        Status: { OK: 'OK' },
        geocode: (
          _input: Readonly<{ query: string }>,
          callback: (
            status: string,
            response: { v2: { addresses: { x: string; y: string }[] } },
          ) => void,
        ) => callback('OK', { v2: { addresses: [
          { x: '127.031', y: '37.501' },
          { x: '127.041', y: '37.511' },
        ] } }),
      },
    };

    const mounted = mountNaverDistrictMap({
      sdk, element: {} as HTMLElement, districts,
      selectedDistrict: { latitude: 37.5, longitude: 127.03 },
      buildings: [{
        id: 'ambiguous', title: 'Common Tower', href: '/ambiguous/',
        addressQuery: '서울특별시 강남구 역삼동 Common Tower', latitude: null, longitude: null,
        allowAddressGeocoding: true,
      }],
      onSelect: () => undefined,
      onBuildingMarkerUnavailable: (id) => unavailable.push(id),
    });

    expect(markers).toEqual([]);
    expect(mounted.unavailableBuildingIds).toEqual(['ambiguous']);
    expect(unavailable).toEqual(['ambiguous']);
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
      proximity: null,
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

it('keeps translated display titles out of Google lookup and matching identities', () => {
  const source = { sourceName:'Original Korean parcel identity', addressQuery:'Original Korean address' };
  const english = buildGoogleBuildingLookup({...source, title:'Lot 554-31'});
  const korean = buildGoogleBuildingLookup({...source, title:'Korean display title'});
  expect(english).toEqual(korean);
  expect(english.sourceName).toBe(source.sourceName);
  expect(english.textQuery).toBe(`${source.sourceName}, ${source.addressQuery}`);
  expect(buildGoogleBuildingLookup({title:'Existing building',addressQuery:'Existing address'}).sourceName).toBe('Existing building');
});
