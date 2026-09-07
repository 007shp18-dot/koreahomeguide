'use client';

import { retainPassportContext } from '../../lib/passport/journey';
import { PassportLink as Link } from '../passport/passport-journey';
import { seoulNeighborhoodLabel } from '../../lib/public-market/seoul-neighborhood-label';
import { buildingDisplayLabel } from '../../lib/public-market/building-display-label';
import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useMemo, useReducer, useState } from 'react';

import {
  areaExplorerReducer,
  buildingExplorerSelectionReducer,
  filterExploreBuildings,
  resolveExploreSearchDistrict,
  resolveSelectedExploreBuilding,
  type AreaExplorerState,
} from '../../lib/public-market/area-explorer-state';
import {
  createSelectionHref,
  type ExplorerSelection,
  type ExplorerView,
} from '../../lib/navigation/explorer-selection';
import { appendKoreaProximityPairs } from '../../lib/public-market/korea-proximity-url';
import {
  NaverDistrictMap,
  buildNaverBuildingAddressQuery,
  type NaverAreaMapGroup,
} from '../maps/naver-district-map';
import type {
  ExploreBuildingModel,
  ExploreMapBuildingModel,
  PublicAreaExploreModel,
} from '../../lib/public-market/area-route-types';
import {
  PUBLIC_MARKET_COPY,
  localizedSeoulHref,
  localizeSampleLabel,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import styles from './area-explorer.module.css';
import { AreaBuildingDialog } from './area-building-dialog';
import { AreaExplorerViewSwitcher } from './area-explorer-view-switcher';
import { DistrictEvidenceSummary } from './district-evidence-summary';
import { PublicSourceBoundary } from './public-source-boundary';

export function compareExploreBuildingsByEvidence(
  left: Pick<ExploreBuildingModel, 'evidenceStatus' | 'observationCount' | 'name' | 'id'>,
  right: Pick<ExploreBuildingModel, 'evidenceStatus' | 'observationCount' | 'name' | 'id'>,
): number {
  const publicationOrder = Number(right.evidenceStatus === 'published')
    - Number(left.evidenceStatus === 'published');
  if (publicationOrder !== 0) return publicationOrder;
  if (left.observationCount !== right.observationCount) {
    return right.observationCount - left.observationCount;
  }
  const nameOrder = left.name.localeCompare(right.name, 'ko-KR');
  return nameOrder === 0 ? left.id.localeCompare(right.id) : nameOrder;
}

const genericBuildingNames = /^(다가구|단독|단독주택|다세대|연립|연립주택|주택|빌라|오피스텔|아파트)$/;

export function isIndividualMapBuilding(
  building: Pick<ExploreBuildingModel, 'name' | 'latitude' | 'longitude'>,
): boolean {
  return building.latitude !== null
    && building.longitude !== null
    && Number.isFinite(building.latitude) && Number.isFinite(building.longitude)
    && building.latitude >= 37.4 && building.latitude <= 37.72
    && building.longitude >= 126.75 && building.longitude <= 127.25
    && !genericBuildingNames.test(building.name.trim());
}

type ExploreBuildingRouteIdentity = Pick<ExploreBuildingModel,
  'id' | 'districtSlug' | 'neighborhoodId'>;

const evidenceHousingOptions = Object.freeze([
  ['all', 'All types', '전체 유형'],
  ['apartment', 'Apartment', '아파트'],
  ['officetel', 'Officetel', '오피스텔'],
  ['villa_multifamily', 'Villa / multifamily', '연립·다세대'],
  ['detached', 'Detached / multi-unit', '단독·다가구'],
] as const);

function selectedMetricCopy(
  transaction: 'jeonse' | 'monthly' | 'sale',
  locale: ProductLocale,
) {
  if (locale === 'ko') {
    return {
      heroHeading: {
        jeonse: '서울 구별 전세보증금을 비교합니다.',
        monthly: '서울 구별 신고 월세를 비교합니다.',
        sale: '서울 구별 신고 매매가를 비교합니다.',
      }[transaction],
      heroDescription: '서울 25개 구의 실거래가입니다. 거래·건물·계약 유형을 선택해 비교하세요. 거래가 5건 미만이면 가격을 표시하지 않습니다.',
      mapHeading: {
        jeonse: '구 중앙값 전세보증금',
        monthly: '구 중앙값 신고 월세',
        sale: '구 중앙값 신고 매매가',
      }[transaction],
      mapTitle: {
        jeonse: '서울 구별 전세보증금 지도',
        monthly: '서울 구별 신고 월세 지도',
        sale: '서울 구별 신고 매매가 지도',
      }[transaction],
      medianLabel: {
        jeonse: '전세보증금 중앙값',
        monthly: '신고 월세 중앙값',
        sale: '신고 매매가 중앙값',
      }[transaction],
    } as const;
  }
  return {
    heroHeading: {
      jeonse: 'Compare refundable jeonse deposits by district.',
      monthly: 'Compare reported monthly rents by district.',
      sale: 'Compare reported sale prices by district.',
    }[transaction],
    heroDescription: 'Official reported-contract evidence across all 25 Seoul districts. Refine by transaction, building type and contract group; money stays hidden below the five-contract rule.',
    mapHeading: {
      jeonse: 'District median refundable jeonse deposit',
      monthly: 'District median reported monthly rent',
      sale: 'District median reported sale price',
    }[transaction],
    mapTitle: {
      jeonse: 'Seoul district refundable jeonse deposit map',
      monthly: 'Seoul district reported monthly-rent map',
      sale: 'Seoul district reported sale-price map',
    }[transaction],
    medianLabel: {
      jeonse: 'Median refundable jeonse deposit',
      monthly: 'Median reported monthly rent',
      sale: 'Median reported sale price',
    }[transaction],
  } as const;
}

function compactDistrictMetric(label: string | null, locale: ProductLocale): string {
  if (label === null) return '—';
  const match = /^₩([\d,]+)$/.exec(label);
  if (match === null) return label;
  const value = Number(match[1]!.replaceAll(',', ''));
  if (!Number.isFinite(value)) return label;
  if (locale === 'ko') {
    const eok = value / 100_000_000;
    return `₩${eok >= 10 ? eok.toFixed(1) : eok.toFixed(2)}억`;
  }
  if (value >= 1_000_000_000) return `₩${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₩${(value / 1_000_000).toFixed(1)}M`;
  return label;
}

function ProjectedBuildingMedia({
  building,
  locale,
  variant,
}: Readonly<{
  building: ExploreBuildingModel;
  locale: ProductLocale;
  variant: 'thumbnail' | 'drawer';
}>) {
  if (building.media === undefined) {
    return variant === 'thumbnail' ? (
      <span className={styles.photoUnavailable} data-building-media="location-only">
        <strong>{locale === 'ko' ? '건물 사진 미제공' : 'Building photo unavailable'}</strong>
        <small>{locale === 'ko' ? '건물 정보 보기' : 'View property details'}</small>
      </span>
    ) : (
      <section className={styles.buildingMediaUnavailable} data-building-media="location-only">
        <strong>{locale === 'ko' ? '건물 사진 미제공' : 'Building photo unavailable'}</strong>
        <p>{locale === 'ko'
          ? '현재 이 건물을 식별할 수 있는 사진을 제공하지 못하고 있습니다.'
          : 'An identifiable photo of this property is not available in this view.'}</p>
      </section>
    );
  }
  const focalX = building.media.focalX ?? 0.5;
  const focalY = building.media.focalY ?? 0.5;
  return (
    <figure
      className={styles.projectedBuildingMedia}
      data-building-media="public-projection"
      data-media-variant={variant}
    >
      {/* Projection URLs have already passed rights and editorial review on the server. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={building.media.displayUrl}
        alt={`${buildingDisplayLabel(building, locale).title} ${locale === 'ko' ? '건물 외관' : 'building exterior'}`}
        width={building.media.width ?? undefined}
        height={building.media.height ?? undefined}
        style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
      />
      {building.media.attributionName === null ? null : (
        <figcaption>
          {building.media.attributionUrl === null
            ? building.media.attributionName
            : <a href={building.media.attributionUrl} rel="noreferrer">{building.media.attributionName}</a>}
        </figcaption>
      )}
    </figure>
  );
}

type KoreaExploreLinkSelection = ExplorerSelection & Readonly<{
  station?: string;
  stationDistance?: 250 | 500 | 750 | 1000;
  school?: string;
  schoolDistance?: 250 | 500 | 750 | 1000;
}>;

export function withKoreaProximityPairs(href: string, selection: KoreaExploreLinkSelection): string {
  return appendKoreaProximityPairs(href, {
    station: selection.station === undefined || selection.stationDistance === undefined
      ? null
      : { sourceId: selection.station, distanceMeters: selection.stationDistance },
    school: selection.school === undefined || selection.schoolDistance === undefined
      ? null
      : { sourceId: selection.school, distanceMeters: selection.schoolDistance },
  });
}

export function createKoreaProximitySelectorHref(
  href: string,
  kind: 'station' | 'school',
  sourceId: string,
  distance: string,
): string {
  const target = new URL(href, 'https://signedprice.invalid');
  const distanceKey = `${kind}Distance`;
  if (sourceId.length === 0 || !['250', '500', '750', '1000'].includes(distance)) {
    target.searchParams.delete(kind);
    target.searchParams.delete(distanceKey);
  } else {
    target.searchParams.set(kind, sourceId);
    target.searchParams.set(distanceKey, distance);
  }
  target.searchParams.delete('buildingPage');
  return `${target.pathname}${target.search}`;
}

function buildingSelectionHref<T extends ExploreBuildingRouteIdentity>(
  building: T,
  selection: KoreaExploreLinkSelection,
  locale: ProductLocale,
  location: Readonly<{ query?: string; buildingPage?: number }> = Object.freeze({}),
): string {
  return createKoreaBuildingDetailHref(building, selection, locale, location);
}

/** Creates the canonical dynamic Detail URL without dropping Explore state. */
export function createKoreaBuildingDetailHref<T extends ExploreBuildingRouteIdentity>(
  building: T,
  selection: KoreaExploreLinkSelection,
  locale: ProductLocale,
  location: Readonly<{ query?: string; buildingPage?: number }> = Object.freeze({}),
): string {
  const href = withKoreaProximityPairs(localizedSeoulHref(createSelectionHref(
    `/kr/seoul/explore/${building.districtSlug}/${building.id}/`,
    {
      ...selection,
      district: building.districtSlug,
      neighborhood: building.neighborhoodId,
      buildingId: building.id,
    },
    { market: 'kr', transaction: 'sale' },
  ), locale), selection);
  const target = new URL(href, 'https://signedprice.invalid');
  const query = location.query?.trim() ?? '';
  if (query.length > 0) target.searchParams.set('q', query);
  if (location.buildingPage !== undefined && location.buildingPage > 1) {
    target.searchParams.set('buildingPage', String(location.buildingPage));
  }
  return `${target.pathname}${target.search}`;
}

export function createExploreBuildingSelectionHref<T extends ExploreBuildingRouteIdentity>(
  building: T,
  selection: KoreaExploreLinkSelection,
  locale: ProductLocale,
  location: Readonly<{ query?: string; buildingPage?: number }> = Object.freeze({}),
): string {
  const href = withKoreaProximityPairs(localizedSeoulHref(createSelectionHref(
    '/kr/seoul/explore/',
    {
      ...selection,
      district: building.districtSlug,
      neighborhood: building.neighborhoodId,
      buildingId: building.id,
    },
    { market: 'kr', transaction: 'sale' },
  ), locale), selection);
  const target = new URL(href, 'https://signedprice.invalid');
  const query = location.query?.trim() ?? '';
  if (query.length > 0) target.searchParams.set('q', query);
  if (location.buildingPage !== undefined && location.buildingPage > 1) {
    target.searchParams.set('buildingPage', String(location.buildingPage));
  }
  return `${target.pathname}${target.search}`;
}

export function createKoreaDistrictHref(
  districtSlug: string,
  selection: KoreaExploreLinkSelection,
  locale: ProductLocale,
): string {
  return withKoreaProximityPairs(localizedSeoulHref(createSelectionHref(
    '/kr/seoul/explore/',
    {
      ...selection,
      district: districtSlug,
      neighborhood: undefined,
      buildingId: undefined,
    },
    { market: 'kr', transaction: 'sale' },
  ), locale), selection);
}

function ReadyAreaExplorer({
  model,
  naverMapClientId,
  googleMapsBrowserKey,
  locale,
  initialQuery,
  initialSelection,
}: Readonly<{
  model: Extract<PublicAreaExploreModel, { status: 'ready' }>;
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
  locale: ProductLocale;
  initialQuery: string;
  initialSelection: ExplorerSelection;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  const currentView: ExplorerView = initialSelection.view ?? 'split';
  const proximity = model.proximity;
  const linkSelection: KoreaExploreLinkSelection = Object.freeze({
    ...initialSelection,
    ...(proximity.status === 'ready' && proximity.selection.station !== null ? {
      station: proximity.selection.station.sourceId, stationDistance: proximity.selection.station.distanceMeters,
    } : {}),
    ...(proximity.status === 'ready' && proximity.selection.school !== null ? {
      school: proximity.selection.school.sourceId, schoolDistance: proximity.selection.school.distanceMeters,
    } : {}),
  });
  const exactMetricCopy = selectedMetricCopy(model.evidenceSelection.transaction, locale);
  const usesLegacyCopy = model.evidenceSelection.areaBand === 'legacy-45-55';
  const countSeparator = locale === 'en' ? ' ' : '';
  const navigation = useRouter();
  const router = useMemo(() => ({ ...navigation,
    replace: (href: string, options?: Parameters<typeof navigation.replace>[1]) =>
      navigation.replace(retainPassportContext(href, window.location.href), options),
  }), [navigation]);
  const allBuildings = useMemo(
    () => model.buildingAvailability.status === 'ready'
      ? model.buildingAvailability.buildings
      : model.buildingAvailability.fallbackBuildings,
    [model.buildingAvailability],
  );
  const initial: AreaExplorerState = Object.freeze({
    selectedSlug: resolveExploreSearchDistrict(
      model.districts,
      allBuildings,
      initialQuery,
      model.selectedSlug,
    ),
    districtSlugs: Object.freeze(model.districts.map(({ slug }) => slug)),
  });
  const [state, dispatch] = useReducer(areaExplorerReducer, initial);
  const initialNeighborhood = initialSelection.neighborhood !== undefined
    && allBuildings.some((building) => (
      building.districtSlug === initial.selectedSlug
      && building.neighborhoodId === initialSelection.neighborhood
    ))
    ? initialSelection.neighborhood
    : 'all';
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(initialNeighborhood);
  const [selectedHousingType, setSelectedHousingType] = useState<string>(
    model.evidenceSelection.housingType,
  );
  const [buildingQuery, setBuildingQuery] = useState(initialQuery);
  const deferredBuildingQuery = useDeferredValue(buildingQuery);
  const [mapDrilledToDistrict, setMapDrilledToDistrict] = useState(
    initialSelection.district !== undefined
      || initialSelection.buildingId !== undefined
      || initialQuery.trim().length > 0,
  );
  const [buildingSelection, dispatchBuildingSelection] = useReducer(
    buildingExplorerSelectionReducer,
    Object.freeze({
      selectedBuildingId: initialSelection.buildingId !== undefined
        && allBuildings.some((building) => (
          building.id === initialSelection.buildingId
          && building.districtSlug === initial.selectedSlug
        ))
        ? initialSelection.buildingId
        : null,
    }),
  );
  const { selectedBuildingId } = buildingSelection;
  const [visibleBuildingCount, setVisibleBuildingCount] = useState(50);
  const [openAreaBuildings, setOpenAreaBuildings] = useState(false);
  const revealAreaBuildings = useCallback(() => setOpenAreaBuildings(true), [setOpenAreaBuildings]);
  const [sortMode, setSortMode] = useState<'latest' | 'evidence' | 'name'>('evidence');
  const readyBuildingAvailability = model.buildingAvailability.status === 'ready'
    ? model.buildingAvailability
    : null;
  const selected = model.districts.find(({ slug }) => slug === state.selectedSlug)
    ?? model.districts[0]!;
  const districtBuildings = useMemo(() => (
    model.buildingAvailability.status === 'ready'
      ? model.buildingAvailability.buildings.filter(({ districtSlug }) => districtSlug === selected.slug)
      : model.buildingAvailability.fallbackBuildings.filter(
        ({ districtSlug }) => districtSlug === selected.slug,
      )
  ), [model.buildingAvailability, selected.slug]);
  const districtMapBuildings = useMemo<readonly ExploreMapBuildingModel[]>(() => (
    readyBuildingAvailability?.mapBuildings?.filter(({ districtSlug }) => districtSlug === selected.slug)
      ?? districtBuildings
  ), [districtBuildings, readyBuildingAvailability?.mapBuildings, selected.slug]);
  const filteredBuildings = useMemo(
    () => {
      const filtered = [...filterExploreBuildings(
      districtBuildings,
      buildingQuery,
      selectedNeighborhood,
      selectedHousingType,
      [selected.slug, selected.nameEn, selected.nameKo],
      )];
      if (sortMode === 'name') {
        return filtered.sort((left, right) => left.name.localeCompare(right.name, 'ko-KR'));
      }
      if (sortMode === 'evidence') return filtered.sort(compareExploreBuildingsByEvidence);
      return filtered.sort((left, right) => (
        right.lastObservedMonth.localeCompare(left.lastObservedMonth)
        || right.observationCount - left.observationCount
        || left.name.localeCompare(right.name, 'ko-KR')
      ));
    },
    [
      buildingQuery,
      districtBuildings,
      selected.nameEn,
      selected.nameKo,
      selected.slug,
      selectedHousingType,
      selectedNeighborhood,
      sortMode,
    ],
  );
  const selectedBuilding = resolveSelectedExploreBuilding(
    districtBuildings,
    selectedBuildingId,
  );
  const filteredMapBuildings = useMemo(() => filterExploreBuildings(
    districtMapBuildings,
    deferredBuildingQuery,
    selectedNeighborhood,
    selectedHousingType,
    [selected.slug, selected.nameEn, selected.nameKo],
  ), [deferredBuildingQuery, districtMapBuildings, selected.nameEn, selected.nameKo,
    selected.slug, selectedHousingType, selectedNeighborhood]);
  const selectedBuildingDetailHref = selectedBuilding === null
    ? null
    : buildingSelectionHref(selectedBuilding, linkSelection, locale, {
        query: buildingQuery,
        buildingPage: readyBuildingAvailability?.page,
      });
  const visibleBuildings = useMemo(() => {
    const visible = filteredBuildings.slice(0, visibleBuildingCount);
    if (
      selectedBuilding === null
      || !filteredBuildings.some(({ id }) => id === selectedBuilding.id)
      || visible.some(({ id }) => id === selectedBuilding.id)
    ) return visible;
    return Object.freeze([...visible, selectedBuilding]);
  }, [filteredBuildings, selectedBuilding, visibleBuildingCount]);

  const districtHref = useCallback((slug: string) => (
    createKoreaDistrictHref(slug, linkSelection, locale)
  ), [linkSelection, locale]);
  const mapDistricts = useMemo(() => model.districts.map((district) => ({
    slug: district.slug,
    nameEn: locale === 'ko' ? district.nameKo : district.nameEn,
    href: districtHref(district.slug),
    latitude: district.latitude,
    longitude: district.longitude,
    metricLabel: compactDistrictMetric(district.medianLabel, locale),
    selected: mapDrilledToDistrict && district.slug === selected.slug,
  })), [districtHref, locale, mapDrilledToDistrict, model.districts, selected.slug]);
  const mapBuildings = useMemo(() => filteredMapBuildings.map((building) => ({
    id: building.id,
    storedLocationKey: `seoul:${building.id}`,
    districtSlug: selected.slug,
    neighborhoodId: building.neighborhoodId,
    title: buildingDisplayLabel(building, locale).title,
    sourceName: buildingDisplayLabel(building, locale).isLot ? buildingDisplayLabel(building, locale).original : building.name,
    href: buildingSelectionHref(building, linkSelection, locale, {
      query: buildingQuery,
      buildingPage: readyBuildingAvailability?.page,
    }),
    addressQuery: building.verifiedAddress ?? buildNaverBuildingAddressQuery(
      selected.nameKo,
      building.neighborhoodName,
      building.name,
    ),
    latitude: isIndividualMapBuilding(building) ? building.latitude : null,
    longitude: isIndividualMapBuilding(building) ? building.longitude : null,
    areaReference: { id: selected.slug, title: locale === 'ko' ? selected.nameKo : selected.nameEn,
      latitude: selected.latitude, longitude: selected.longitude },
    // Resolve only the selected building, not every unresolved row in the district.
    allowAddressGeocoding: building.id === selectedBuilding?.id
      && (building.verifiedAddress !== undefined || !genericBuildingNames.test(building.name.trim())),
    metricLabel: compactDistrictMetric(building.medianLabel, locale),
    sampleLabel: localizeSampleLabel(building.sampleLabel, locale),
    selected: building.id === selectedBuilding?.id,
  })), [buildingQuery, filteredMapBuildings, linkSelection, locale, readyBuildingAvailability?.page, selected, selectedBuilding?.id]);
  const mapNeighborhoods = useMemo(() => (
    (readyBuildingAvailability?.neighborhoods ?? []).map((neighborhood) => {
      const located = districtMapBuildings.filter((building) => (
        building.neighborhoodId === neighborhood.id
        && building.latitude !== null && building.longitude !== null
        && Number.isFinite(building.latitude) && Number.isFinite(building.longitude)
        && building.latitude >= 37.4 && building.latitude <= 37.72
        && building.longitude >= 126.75 && building.longitude <= 127.25
      ));
      return {
        id: neighborhood.id,
        title: seoulNeighborhoodLabel(selected.slug, neighborhood.name, locale),
        addressQuery: `서울특별시 ${selected.nameKo} ${neighborhood.name}`,
        latitude: located.length === 0 ? null
          : located.reduce((sum, building) => sum + building.latitude!, 0) / located.length,
        longitude: located.length === 0 ? null
          : located.reduce((sum, building) => sum + building.longitude!, 0) / located.length,
        buildingCount: neighborhood.count,
        selected: selectedNeighborhood === neighborhood.id,
      };
    })
  ), [districtMapBuildings, readyBuildingAvailability?.neighborhoods, selected.nameKo, selected.slug, selectedNeighborhood, locale]);
  const referencedMapBuildings = useMemo(() => {
    const references = new Map(mapNeighborhoods.map(point => [point.id, point]));
    return mapBuildings.map(building => {
      const point = references.get(building.neighborhoodId);
      if (point === undefined) return building;
      return { ...building, areaReference: { id: point.id, title: point.title,
        latitude: point.latitude ?? selected.latitude,
        longitude: point.longitude ?? selected.longitude,
        neighborhoodId: point.id,
        addressQuery: point.addressQuery } };
    });
  }, [mapBuildings, mapNeighborhoods, selected.latitude, selected.longitude]);
  const searchPending = buildingQuery.trim().toLocaleLowerCase('en-US') !== initialQuery.trim().toLocaleLowerCase('en-US');
  const additionalMapGroups = useMemo<readonly NaverAreaMapGroup[]>(() => {
    if (searchPending || selected.slug !== model.selectedSlug) return [];
    const references = new Map(mapNeighborhoods.map(point => [point.id, point]));
    return (readyBuildingAvailability?.mapGroups ?? []).filter(group => (
      (selectedNeighborhood === 'all' || group.neighborhoodId === selectedNeighborhood)
      && (selectedHousingType === 'all' || group.housingType === selectedHousingType)
    )).map(group => {
      const point = references.get(group.neighborhoodId);
      return { count: group.count, reference: point !== undefined
        ? { id: point.id, title: point.title,
          latitude: point.latitude ?? selected.latitude,
          longitude: point.longitude ?? selected.longitude,
          neighborhoodId: point.id, addressQuery: point.addressQuery }
        : { id: selected.slug, title: locale === 'ko' ? selected.nameKo : selected.nameEn,
          latitude: selected.latitude, longitude: selected.longitude } };
    });
  }, [searchPending, selected, model.selectedSlug, mapNeighborhoods, readyBuildingAvailability?.mapGroups, selectedNeighborhood, selectedHousingType, locale]);
  const showBuildingLayer = selectedNeighborhood !== 'all'
    || openAreaBuildings
    || buildingQuery.trim().length > 0
    || selectedBuilding !== null
    || mapNeighborhoods.length === 0;

  const selectDistrict = (slug: string): void => {
    setOpenAreaBuildings(false);
    dispatch({ type: 'select', slug });
    setMapDrilledToDistrict(true);
    setSelectedNeighborhood('all');
    setSelectedHousingType('all');
    setBuildingQuery('');
    dispatchBuildingSelection({ type: 'clear_building' });
    setVisibleBuildingCount(50);
    router.replace(districtHref(slug), { scroll: false });
  };
  const showAllDistricts = (): void => {
    setOpenAreaBuildings(false);
    setMapDrilledToDistrict(false);
    setBuildingQuery('');
    dispatchBuildingSelection({ type: 'clear_building' });
    setSelectedNeighborhood('all');
    const href = withKoreaProximityPairs(localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        district: undefined,
        neighborhood: undefined,
        buildingId: undefined,
      },
      { market: 'kr', transaction: 'sale' },
    ), locale), linkSelection);
    router.replace(href, { scroll: false });
  };
  const selectBuilding = (
    buildingId: string,
    source: 'marker' | 'rail',
  ): void => {
    const building = districtBuildings.find(({ id }) => id === buildingId);
    if (building === undefined) {
      const mapBuilding = districtMapBuildings.find(({ id }) => id === buildingId);
      if (mapBuilding !== undefined) router.replace(localizedSeoulHref(mapBuilding.href, locale));
      return;
    }
    setMapDrilledToDistrict(true);
    dispatchBuildingSelection({ type: 'select_building', source, buildingId });
    if (source === 'rail' && window.matchMedia('(max-width: 800px)').matches) {
      document.querySelector('[data-explorer-region="map"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // This building's evidence is already loaded; selecting it must not refetch the route.
    window.history.replaceState(window.history.state, '',
      retainPassportContext(createExploreBuildingSelectionHref(building, linkSelection, locale, {
        query: buildingQuery,
        buildingPage: readyBuildingAvailability?.page,
      }), window.location.href),
    );
  };
  const selectBuildingFromMarker = (buildingId: string): void => {
    selectBuilding(buildingId, 'marker');
  };
  const closeBuilding = (): void => {
    dispatchBuildingSelection({ type: 'clear_building' });
    const href = withKoreaProximityPairs(localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        district: state.selectedSlug,
        neighborhood: selectedNeighborhood === 'all' ? undefined : selectedNeighborhood,
        buildingId: undefined,
      },
      { market: 'kr', transaction: 'sale' },
    ), locale), linkSelection);
    const target = new URL(href, 'https://signedprice.invalid');
    const normalizedQuery = buildingQuery.trim();
    if (normalizedQuery.length > 0) target.searchParams.set('q', normalizedQuery);
    if (readyBuildingAvailability !== null && readyBuildingAvailability.page > 1) {
      target.searchParams.set('buildingPage', String(readyBuildingAvailability.page));
    }
    window.history.replaceState(window.history.state, '', retainPassportContext(`${target.pathname}${target.search}`, window.location.href));
  };

  const evidenceHref = useCallback((changes: Readonly<{
    transaction?: 'sale' | 'jeonse' | 'monthly';
    propertyType?: string;
    view?: ExplorerView;
  }> = Object.freeze({})): string => {
    const transaction = changes.transaction ?? model.evidenceSelection.transaction;
    const propertyType = changes.propertyType ?? model.evidenceSelection.housingType;
    const href = withKoreaProximityPairs(localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        market: 'kr',
        transaction,
        area: undefined,
        propertyType: propertyType === 'all' ? undefined : propertyType,
        district: mapDrilledToDistrict ? state.selectedSlug : undefined,
        contractType: transaction === 'sale' ? undefined : initialSelection.contractType,
        view: changes.view ?? currentView,
      },
      { market: 'kr', transaction: 'sale' },
    ), locale), linkSelection);
    const target = new URL(href, 'https://signedprice.invalid');
    const query = buildingQuery.trim();
    if (query.length > 0) target.searchParams.set('q', query);
    if (readyBuildingAvailability !== null && readyBuildingAvailability.page > 1) {
      target.searchParams.set('buildingPage', String(readyBuildingAvailability.page));
    }
    return `${target.pathname}${target.search}`;
  }, [buildingQuery, currentView, initialSelection, linkSelection, locale, mapDrilledToDistrict, model.evidenceSelection, readyBuildingAvailability, state.selectedSlug]);
  const proximityHref = useCallback((kind: 'station' | 'school', sourceId: string, distance: string): string => {
    return createKoreaProximitySelectorHref(evidenceHref(), kind, sourceId, distance);
  }, [evidenceHref]);

  const updateBuildingQuery = (query: string): void => {
    setBuildingQuery(query);
    setVisibleBuildingCount(50);
    dispatchBuildingSelection({ type: 'clear_building' });
    const resolvedSlug = resolveExploreSearchDistrict(
      model.districts,
      allBuildings,
      query,
      state.selectedSlug,
    );
    if (resolvedSlug !== state.selectedSlug) {
      dispatch({ type: 'select', slug: resolvedSlug });
      setMapDrilledToDistrict(true);
      setSelectedNeighborhood('all');
      setSelectedHousingType('all');
    }
  };
  const submitBuildingQuery = (): void => {
    const href = withKoreaProximityPairs(localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        district: state.selectedSlug,
        neighborhood: undefined,
        buildingId: undefined,
      },
      { market: 'kr', transaction: 'sale' },
    ), locale), linkSelection);
    const target = new URL(href, window.location.origin);
    const normalizedQuery = buildingQuery.trim();
    if (normalizedQuery.length === 0) target.searchParams.delete('q');
    else target.searchParams.set('q', normalizedQuery);
    target.searchParams.delete('buildingPage');
    router.replace(`${target.pathname}${target.search}`);
  };
  const buildingPageHref = (page: number): string => {
    const href = evidenceHref();
    const target = new URL(href, window.location.origin);
    const normalizedQuery = buildingQuery.trim();
    if (normalizedQuery.length === 0) target.searchParams.delete('q');
    else target.searchParams.set('q', normalizedQuery);
    if (page <= 1) target.searchParams.delete('buildingPage');
    else target.searchParams.set('buildingPage', String(page));
    return `${target.pathname}${target.search}`;
  };
  const selectNeighborhood = (neighborhoodId: string): void => {
    setOpenAreaBuildings(false);
    setMapDrilledToDistrict(true);
    setSelectedNeighborhood(neighborhoodId);
    setVisibleBuildingCount(50);
    dispatchBuildingSelection({ type: 'clear_building' });
    const href = withKoreaProximityPairs(localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        district: state.selectedSlug,
        neighborhood: neighborhoodId === 'all' ? undefined : neighborhoodId,
        buildingId: undefined,
      },
      { market: 'kr', transaction: 'sale' },
    ), locale), linkSelection);
    const target = new URL(href, 'https://signedprice.invalid');
    const normalizedQuery = buildingQuery.trim();
    if (normalizedQuery.length > 0) target.searchParams.set('q', normalizedQuery);
    target.searchParams.delete('buildingPage');
    router.replace(`${target.pathname}${target.search}`, { scroll: false });
  };
  const matchingBuildingCount = model.buildingAvailability.status === 'ready'
    ? model.buildingAvailability.total
    : filteredBuildings.length;
  const buildingCountLabel = locale === 'ko'
    ? '개 건물'
    : matchingBuildingCount === 1 ? 'building' : 'buildings';

  return (
    <section
      className={styles.explorer}
      aria-labelledby="area-explorer-heading"
      data-market-selection={`kr:${model.evidenceSelection.transaction}`}
      data-journey-level={!mapDrilledToDistrict ? 'city' : showBuildingLayer ? 'building' : 'neighborhood'}
      data-explore-view={currentView}
      data-explorer-version="guide-v2"
    >
      <header className="explore-page-heading"><h1 id="area-explorer-heading">{locale === 'ko' ? `${model.districts.find(d => d.slug === model.selectedSlug)?.nameKo ?? '서울'} 실거래가` : 'Explore'}</h1><p>{locale === 'ko' ? '출처: 국토교통부' : 'Source: MOLIT'} · {model.source.period}</p></header>
      <div className={styles.exploreToolbar} data-explorer-region="filters">
        <div
          className={styles.transactionFilter}
          data-transaction-filter="verified-availability"
          role="group"
          aria-label={locale === 'ko' ? '거래 유형' : 'Transaction type'}
        >
          {([
            ['sale', 'sale', locale === 'ko' ? '매매' : 'Sale'],
            ['jeonse', 'jeonse', locale === 'ko' ? '전세' : 'Jeonse'],
            ['monthly', 'monthly-rent', locale === 'ko' ? '월세' : 'Monthly rent'],
          ] as const).map(([transaction, mode, label]) => (
            model.transactionAvailability[transaction]
              ? <Link
                  key={transaction}
                  href={evidenceHref({ transaction })}
                  aria-current={model.evidenceSelection.transaction === transaction ? 'page' : undefined}
                  data-transaction-mode={mode}
                >{label}</Link>
              : <span key={transaction} aria-disabled="true" data-transaction-mode={mode}>{label}</span>
          ))}
        </div>
        <label className={styles.toolbarSelect}><span>{locale === 'ko' ? '지역' : 'Area'}</span><select aria-label={locale === 'ko' ? '서울 25개 구' : 'All 25 Seoul districts'} value={mapDrilledToDistrict ? selected.slug : 'all'} onChange={(event) => event.currentTarget.value === 'all' ? showAllDistricts() : selectDistrict(event.currentTarget.value)}><option value="all">{locale === 'ko' ? '서울 전체' : 'All Seoul'}</option>{model.districts.map((district) => <option key={district.slug} value={district.slug} data-district-option={district.slug} title={`${district.nameKo} · ${district.medianLabel ?? copy.notPublished}`}>{locale === 'ko' ? district.nameKo : district.nameEn}</option>)}</select></label>
        <div className={styles.buildingSearch} data-building-search="retained">
          <label htmlFor="explore-building-query">
            {locale === 'ko' ? '지역 또는 건물 검색' : 'Search area or building'}
          </label>
          <span className={styles.visuallyHidden}>Search buildings</span>
          <input
            id="explore-building-query"
            name="building-query"
            type="search"
            value={buildingQuery}
            onChange={(event) => updateBuildingQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              submitBuildingQuery();
            }}
            placeholder={locale === 'ko' ? '강남구, 역삼동, 건물명' : 'Gangnam-gu, Yeoksam-dong, building'}
          />
          <button className={styles.submitSearch} type="button" onClick={submitBuildingQuery}>{locale === 'ko' ? '검색' : 'Search'}</button>
        </div>
        <details className={styles.advancedFilters} open={proximity.status === 'ready' && (proximity.selection.station !== null || proximity.selection.school !== null) ? true : undefined}>
          <summary>{locale === 'ko' ? '필터' : 'Filters'}</summary>
          <div className={styles.advancedFiltersPanel}>
            <label className={styles.toolbarSelect}>
              <span>{locale === 'ko' ? '건물 유형' : 'Building type'}</span>
              <select
                name="housing-type"
                value={selectedHousingType}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setSelectedHousingType(value);
                  setVisibleBuildingCount(50);
                  router.replace(evidenceHref({ propertyType: value }), { scroll: false });
                }}
              >
                {evidenceHousingOptions.map(([value, en, ko]) => (
                  <option value={value} key={value}>{locale === 'ko' ? ko : en}</option>
                ))}
              </select>
            </label>
            <label className={styles.sortControl}>
              <span>{locale === 'ko' ? '정렬' : 'Sort'}</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.currentTarget.value as typeof sortMode)}>
                <option value="latest">{locale === 'ko' ? '최근 신고순' : 'Newest filing'}</option>
                <option value="evidence">{locale === 'ko' ? '거래 많은 순' : 'Most evidence'}</option>
                <option value="name">{locale === 'ko' ? '건물명순' : 'Building name'}</option>
              </select>
            </label>
            {proximity.status === 'ready' ? (
              <div className={styles.proximityFilters} data-proximity-selectors="enabled">
                <label><span>{locale === 'ko' ? '역 인접성' : 'Station proximity'}</span><select name="station-proximity" value={proximity.selection.station?.sourceId ?? ''} onChange={(event) => router.replace(proximityHref('station', event.currentTarget.value, String(proximity.selection.station?.distanceMeters ?? 500)), { scroll: false })}><option value="">{locale === 'ko' ? '선택 안 함' : 'No station filter'}</option>{proximity.stations.map((station) => <option key={station.sourceId} value={station.sourceId}>{station.name} · {station.lines.join(', ')}</option>)}</select></label>
                <label><span>{locale === 'ko' ? '역 거리' : 'Station distance'}</span><select name="station-distance" value={proximity.selection.station?.distanceMeters ?? ''} onChange={(event) => router.replace(proximityHref('station', proximity.selection.station?.sourceId ?? '', event.currentTarget.value), { scroll: false })}><option value="">—</option>{[250, 500, 750, 1000].map((distance) => <option key={distance} value={distance}>{distance} m</option>)}</select></label>
                <label><span>{locale === 'ko' ? '학교 인접성' : 'School proximity'}</span><select name="school-proximity" value={proximity.selection.school?.sourceId ?? ''} onChange={(event) => router.replace(proximityHref('school', event.currentTarget.value, String(proximity.selection.school?.distanceMeters ?? 500)), { scroll: false })}><option value="">{locale === 'ko' ? '선택 안 함' : 'No school filter'}</option>{proximity.schools.map((school) => <option key={school.sourceId} value={school.sourceId}>{school.name}</option>)}</select></label>
                <label><span>{locale === 'ko' ? '학교 거리' : 'School distance'}</span><select name="school-distance" value={proximity.selection.school?.distanceMeters ?? ''} onChange={(event) => router.replace(proximityHref('school', proximity.selection.school?.sourceId ?? '', event.currentTarget.value), { scroll: false })}><option value="">—</option>{[250, 500, 750, 1000].map((distance) => <option key={distance} value={distance}>{distance} m</option>)}</select></label>
                <small>{locale === 'ko' ? '직선거리 기준' : 'Straight-line distance'}</small>
              </div>
            ) : <p className={styles.proximityUnavailable} data-proximity-state={proximity.status}>{locale === 'ko' ? '인접성 데이터를 확인할 수 없습니다.' : 'Proximity data unavailable.'}</p>}
          </div>
        </details>
        <span className={styles.visuallyHidden} data-building-inventory={model.coverage.buildings.status === 'ready' ? 'observed' : 'unavailable'}>{model.coverage.buildings.status === 'ready' ? model.coverage.buildings.observed : '—'}</span>
      </div>

      <header className={styles.resultBar} data-explorer-region="summary">

        <strong className={styles.resultCount}>{mapDrilledToDistrict
          ? `${matchingBuildingCount.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}${locale === 'ko' ? '개 건물' : ` ${buildingCountLabel}`}`
          : locale === 'ko' ? '서울 25개 구' : '25 Seoul districts'} · {model.source.period}</strong>
        <span>{!mapDrilledToDistrict
          ? (locale === 'ko' ? '구를 선택하면 동별로 자료에 포함된 건물 수를 볼 수 있습니다.' : 'Choose a district to see observed building counts by neighborhood.')
          : showBuildingLayer
            ? searchPending
              ? (locale === 'ko' ? '현재 목록에서 검색 중입니다. Enter를 누르면 모든 결과 페이지를 검색합니다.' : 'Filtering loaded results. Press Enter to search all result pages.')
              : (locale === 'ko' ? '전체 검색 결과: 개별 위치와 지역 묶음을 구분합니다. 다른 목록 페이지의 건물도 지역 묶음에 포함됩니다.' : 'All matches: individual locations and area-only groups, including buildings on other result pages.')
            : (locale === 'ko' ? '신고 자료에 포함된 건물 수를 동별로 표시합니다.' : 'Neighborhood counts cover observed buildings in the evidence inventory.')}</span>
        <div className={styles.toolbarViews}>
          <AreaExplorerViewSwitcher
            current={currentView}
            hrefFor={(view) => evidenceHref({ view })}
            locale={locale}
          />
        </div>
      </header>

      {currentView === 'table' ? null : (
      <div className={styles.workspace} data-explorer-layout={currentView}>
        {currentView === 'list' ? null : (
        <section className={styles.mapPanel} data-explorer-region="map" aria-labelledby="area-map-heading">
          <div className={styles.sectionHeading}>
            <p>{copy.mapEyebrow}</p>
            <h2 id="area-map-heading">
              {usesLegacyCopy ? copy.mapHeading : exactMetricCopy.mapHeading}
            </h2>
          </div>
          <div className={styles.mapGuide} aria-hidden="true">
            <span>{!mapDrilledToDistrict
              ? (locale === 'ko' ? '서울 전체' : 'All Seoul')
              : locale === 'ko' ? selected.nameKo : selected.nameEn}</span>
            <strong>{!mapDrilledToDistrict
              ? (locale === 'ko' ? '구 선택' : 'Choose a district')
              : showBuildingLayer
                ? (locale === 'ko' ? '건물 위치와 신고 가격' : 'Building locations and reported prices')
                : (locale === 'ko' ? '동별 자료 포함 건물 수' : 'Observed buildings by neighborhood')}</strong>
          </div>
          {mapDrilledToDistrict ? (
            <button className={styles.mapLevelButton} type="button" onClick={showAllDistricts}>
              {locale === 'ko' ? '서울 전체 보기' : 'All Seoul districts'}
            </button>
          ) : null}
          <NaverDistrictMap
            clientId={naverMapClientId}
            googleMapsBrowserKey={googleMapsBrowserKey}
            districts={mapDistricts}
            selectedDistrict={mapDrilledToDistrict ? selected : undefined}
            focusAddressQuery={showBuildingLayer ? mapNeighborhoods.find(({ id }) => id === selectedNeighborhood)?.addressQuery : undefined}
            neighborhoods={mapDrilledToDistrict && !showBuildingLayer ? mapNeighborhoods : undefined}
            buildings={mapDrilledToDistrict && showBuildingLayer ? referencedMapBuildings : undefined}
            areaGroups={mapDrilledToDistrict && showBuildingLayer ? additionalMapGroups : undefined}
            onOpenAreaBuildings={revealAreaBuildings}
            onSelectDistrict={selectDistrict}
            onSelectNeighborhood={selectNeighborhood}
            onSelectBuilding={selectBuildingFromMarker}
            locale={locale}
            fallback={<div className={styles.liveMapLoading} role="status">
              <strong>{locale === 'ko' ? '네이버 지도를 불러오는 중입니다.' : 'Loading the NAVER map.'}</strong>
              <span>{locale === 'ko' ? '지역과 확인된 건물 위치가 곧 표시됩니다.' : 'Areas and verified building locations will appear here.'}</span>
            </div>}
          />

          {selectedBuilding === null ? null : (
            <div data-map-evidence="selected-building" className={styles.mapSelectedIdentity} aria-live="polite"
              title={buildingDisplayLabel(selectedBuilding, locale).original}>
              {buildingDisplayLabel(selectedBuilding, locale).title}
            </div>
          )}
        </section>
        )}

        {currentView === 'map' ? null : (
        <aside className={styles.discoveryRail} data-explorer-region="results" aria-label={locale === 'ko' ? '지역과 건물 탐색' : 'District and building discovery'}>
          {mapDrilledToDistrict ? <details className={styles.railEvidenceDisclosure}>
            <summary>
              <span>{copy.selected} · {selectedBuilding === null ? (locale === 'ko' ? selected.nameKo : selected.nameEn) : buildingDisplayLabel(selectedBuilding, locale).title}</span>
              <strong>{selectedBuilding === null ? (selected.medianLabel ?? copy.notPublished) : (selectedBuilding.medianLabel ?? copy.notPublished)}</strong>
              <small>{localizeSampleLabel(selectedBuilding?.sampleLabel ?? selected.sampleLabel, locale)}</small>
            </summary>
            {selectedBuilding !== null ? <BuildingEvidencePanel building={selectedBuilding} locale={locale} /> : <DistrictEvidenceSummary
              key={selected.slug}
              model={selected.contractEvidence}
              mode="compact"
              selectionHref={evidenceHref()}
              locale={locale}
              medianLabel={usesLegacyCopy ? undefined : exactMetricCopy.medianLabel}
              showContractGroups={model.evidenceSelection.transaction !== 'sale'}
            />}
          </details> : null}
          <section className={styles.rail} aria-label={locale === 'ko' ? '탐색 결과' : 'Discovery results'}>
          {!mapDrilledToDistrict ? (
            <div className={styles.districtBrowser} data-district-browser="seoul">
              <div className={styles.sectionHeading}>
                <p>{locale === 'ko' ? '서울 전체' : 'All Seoul'}</p>
                <h2 id="district-table-heading">{locale === 'ko' ? '구를 선택하세요' : 'Choose a district'}</h2>
                <span>{locale === 'ko'
                  ? '지도와 목록이 함께 해당 구의 동별 분포로 이동합니다.'
                  : 'The map and list move together to neighborhood distribution.'}</span>
              </div>
              <ul className={styles.districtList}>
                {model.districts.map((district) => (
                  <li key={district.slug}>
                    <button type="button" onClick={() => selectDistrict(district.slug)}>
                      <span><strong>{locale === 'ko' ? district.nameKo : district.nameEn}</strong><small>{locale === 'ko' ? district.nameEn : district.nameKo}</small></span>
                      <span><strong>{compactDistrictMetric(district.medianLabel, locale)}</strong><small>{localizeSampleLabel(district.sampleLabel, locale)}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
          <div className={styles.buildingBrowser} data-building-browser={selected.slug} data-explorer-region="results">
            <div className={styles.sectionHeading}>
              <p>{copy.buildingsEyebrow}</p>
              <h2>{locale === 'ko' ? selected.nameKo : selected.nameEn} {copy.buildingEvidence}</h2>
            </div>
            {model.buildingAvailability.status === 'not_loaded'
              && model.buildingAvailability.fallbackBuildings.length === 0 ? (
              <div className={styles.buildingEmpty}>
                <strong>{copy.buildingArtifactMissing}</strong>
                <span>{copy.buildingArtifactReason}</span>
              </div>
            ) : districtBuildings.length === 0 ? (
              <div className={styles.buildingEmpty}>
                <strong>{copy.noPublishedBuildings}</strong>
                <span>{copy.noSyntheticBuildings}</span>
              </div>
            ) : (
              <>
                {model.buildingAvailability.status === 'not_loaded' ? (
                  <p data-building-inventory="fallback">
                    {locale === 'ko'
                      ? '전체 건물 목록을 불러올 수 없어 가격 자료가 있는 건물만 표시합니다.'
                      : 'Observed inventory unavailable. Showing the verified price-ready fallback.'}
                  </p>
                ) : null}
                {mapNeighborhoods.length > 0 ? (
                  <label className={styles.neighborhoodSelect}>
                    <span>{locale === 'ko' ? '동' : 'Neighborhood'}</span>
                    <select value={selectedNeighborhood} onChange={(event) => selectNeighborhood(event.currentTarget.value)}>
                      <option value="all">{locale === 'ko' ? '전체 동' : 'All neighborhoods'}</option>
                      {mapNeighborhoods.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.buildingCount.toLocaleString()}</option>)}
                    </select>
                  </label>
                ) : null}
                <>
                <p className={styles.resultSummary} aria-live="polite">
                  {model.buildingAvailability.status === 'ready'
                    ? model.buildingAvailability.total
                    : filteredBuildings.length} {model.buildingAvailability.status === 'ready'
                    ? copy.observedBuildings.toLocaleLowerCase(locale === 'ko' ? 'ko-KR' : 'en-US')
                    : locale === 'ko' ? '개 가격 게시 가능 건물' : 'price-ready buildings'}
                </p>
                {filteredBuildings.length === 0 ? (
                  <div className={styles.buildingEmpty} role="status">
                    <strong>{locale === 'ko' ? '검색 조건에 맞는 건물이 없습니다.' : 'No buildings match this search.'}</strong>
                    <span>{locale === 'ko' ? '검색어를 지우거나 다른 동을 선택하세요.' : 'Clear the query or choose another neighborhood.'}</span>
                    <button type="button" onClick={() => updateBuildingQuery('')}>
                      {locale === 'ko' ? '검색 지우기' : 'Clear search'}
                    </button>
                  </div>
                ) : (
                  <>
                    <ul className={styles.buildingList}>
                      {visibleBuildings.map((building) => (
                        <li
                          key={building.id}
                          className={selectedBuilding?.id === building.id ? styles.selectedBuildingCard : undefined}
                          data-building-evidence={building.evidenceStatus}
                          data-building-row={building.id}
                        >
                          <button
                            type="button"
                            aria-pressed={selectedBuilding?.id === building.id}
                            onClick={() => selectBuilding(building.id, 'rail')}
                          >
                            <span className={styles.buildingThumbnail}>
                              <ProjectedBuildingMedia building={building} locale={locale} variant="thumbnail" />
                            </span>
                            <span className={styles.buildingCardCopy}>
                              <strong title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).title}</strong>
                              <span className={styles.buildingPrice}>{building.medianLabel ?? '—'}</span>
                              <small title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).location} · {evidenceHousingOptions.find(([value]) => value === building.housingType)?.[locale === 'ko' ? 2 : 1] ?? building.housingType}</small>
                              {!isIndividualMapBuilding(building) && building.verifiedAddress === undefined ? <small>{locale === 'ko' ? '지도 위치 확인 전 · 상세 확인 가능' : 'Map location unavailable · Details available'}</small> : null}
                              <small>{model.evidenceSelection.areaBand === 'legacy-45-55'
                                ? `${copy.jeonseObservations} · ${building.jeonseObservationCount} · ${copy.monthlyObservations} · ${building.monthlyObservationCount}`
                                : building.transaction === 'sale'
                                  ? `${locale === 'ko' ? '매매 거래' : 'Sale filings'} ${building.observationCount}`
                                  : building.transaction === 'monthly'
                                    ? `${copy.monthlyObservations} ${building.monthlyObservationCount}`
                                    : `${copy.jeonseObservations} ${building.jeonseObservationCount}`}</small>
                              {building.transaction === 'monthly'
                                && building.filedDepositMedianLabel !== null
                                && building.filedDepositMedianLabel !== undefined
                                ? <small>{locale === 'ko' ? '신고 보증금 중앙값' : 'Filed deposit median'} · {building.filedDepositMedianLabel}</small>
                                : null}
                              <small>{building.evidenceStatus === 'published'
                                ? `${building.sampleLabel} · ${building.lastObservedMonth}`
                                : `${copy.observedPeriod} · ${building.firstObservedMonth}–${building.lastObservedMonth}`}</small>
                              <BuildingProximityFacts building={building} locale={locale} />
                            </span>
                          </button>
                          <Link
                            className={styles.buildingRowLink}
                            href={buildingSelectionHref(building, linkSelection, locale, {
                              query: buildingQuery,
                              buildingPage: readyBuildingAvailability?.page,
                            })}
                          >
                            <span className={styles.visuallyHidden}>{copy.openBuilding} · {buildingDisplayLabel(building, locale).title}</span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {readyBuildingAvailability !== null
                      && readyBuildingAvailability.page > 1 ? (
                      <button
                        type="button"
                        className={styles.moreBuildings}
                        onClick={() => router.replace(buildingPageHref(
                          readyBuildingAvailability.page - 1,
                        ), { scroll: false })}
                      >{locale === 'ko' ? '이전 건물' : 'Previous buildings'}</button>
                    ) : null}
                    {visibleBuildings.length < filteredBuildings.length
                      || (readyBuildingAvailability !== null
                        && readyBuildingAvailability.page * readyBuildingAvailability.pageSize
                          < readyBuildingAvailability.total) ? (
                      <button
                        type="button"
                        className={styles.moreBuildings}
                        onClick={() => {
                          if (visibleBuildings.length < filteredBuildings.length) {
                            setVisibleBuildingCount((count) => count + 50);
                            return;
                          }
                          if (model.buildingAvailability.status === 'ready') {
                            router.replace(buildingPageHref(
                              model.buildingAvailability.page + 1,
                            ), { scroll: false });
                          }
                        }}
                      >{copy.showMore}</button>
                    ) : null}
                  </>
                )}
                </>
              </>
            )}
          </div>
          )}
          </section>
        </aside>
        )}

        {selectedBuilding === null || selectedBuildingDetailHref === null ? null : (
          <AreaBuildingDialog
            building={selectedBuilding}
            detailHref={selectedBuildingDetailHref}
            locale={locale}
            onClose={closeBuilding}
          >
            <ProjectedBuildingMedia building={selectedBuilding} locale={locale} variant="drawer" />
            <BuildingEvidencePanel
              building={selectedBuilding}
              locale={locale}
            />
          </AreaBuildingDialog>
        )}
      </div>
      )}

      <details
        className={styles.coverage}
        data-coverage-panel="verified"
      >
        <summary className={styles.coverageHeading}>
          <span>{copy.coverageEyebrow}</span>
          <strong>{copy.coverageHeading}</strong>
        </summary>
        <dl className={styles.coverageGrid}>
          <div><dt>{copy.districtsPublished}</dt><dd>{model.coverage.districts.published} {copy.of} {model.coverage.districts.retained}</dd></div>
          <div>
            <dt>{copy.observedBuildings}</dt>
            <dd>{model.coverage.buildings.status === 'ready'
              ? `${model.coverage.buildings.observed} · ${copy.transactionCoveredBuildings} ${model.coverage.buildings.transactionCovered}`
              : copy.unavailable}</dd>
          </div>
          <div>
            <dt>{copy.priceReadyBuildings}</dt>
            <dd>{model.coverage.buildings.priceReady ?? copy.unavailable}</dd>
          </div>
          <div><dt>{copy.eligibleContracts}</dt><dd>{model.coverage.eligibleContracts} {copy.eligibleSuffix}</dd></div>
        </dl>
        <div className={styles.coverageLimits}>
          <p>{model.coverage.unpublished.districtsBelowMinimum}{countSeparator}{copy.districtsBelowMinimum}</p>
          {model.coverage.unpublished.retainedBuildingsBelowMinimum === null
            ? <p>{copy.buildingArtifactMissing}</p>
            : <p>{model.coverage.unpublished.retainedBuildingsBelowMinimum}{countSeparator}{copy.retainedBuildingsBelowMinimum}</p>}
          <p>{locale === 'ko' ? copy.sourceCandidatesMissing : model.coverage.unpublished.sourceBuildingCandidates.reason}</p>
          <p>{locale === 'ko' ? '이 수치는 자료에 포함된 전체 건물 수와 다릅니다.' : 'Published cohorts are not the total observed building inventory.'}</p>
        </div>
      </details>

      {currentView === 'table' ? (
        <section
          className={styles.completeTable}
          data-explorer-layout="table"
          data-building-table="filtered"
          aria-labelledby="building-table-heading"
        >
          <div className={styles.sectionHeading}>
            <p>{copy.buildingsEyebrow}</p>
            <h2 id="building-table-heading">{locale === 'ko' ? '조건에 맞는 건물별 거래' : 'Filtered building evidence'}</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>{locale === 'ko'
                ? '선택한 조건과 기간의 건물별 거래'
                : 'Building evidence for the current filters and reporting period'}</caption>
              <thead>
                <tr>
                  <th scope="col">{locale === 'ko' ? '건물' : 'Building'}</th>
                  <th scope="col">{copy.district}</th>
                  <th scope="col">{copy.median}</th>
                  <th scope="col">{locale === 'ko' ? '건물 유형' : 'Building type'}</th>
                  <th scope="col">{locale === 'ko' ? '신고 건수' : 'Filings'}</th>
                  <th scope="col">{locale === 'ko' ? '집계 기간' : 'Observed period'}</th>
                  <th scope="col">{copy.evidence}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuildings.map((building) => {
                  const district = model.districts.find(({ slug }) => slug === building.districtSlug);
                  return (
                    <tr key={building.id} data-building-table-row={building.id}>
                      <th scope="row">
                        <strong title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).title}</strong>
                        <small title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).location}</small>
                      </th>
                      <td>{district === undefined
                        ? '—'
                        : locale === 'ko' ? district.nameKo : district.nameEn}</td>
                      <td>{building.medianLabel ?? '—'}</td>
                      <td>{building.housingType || '—'}</td>
                      <td>{building.observationCount}</td>
                      <td>{building.firstObservedMonth}–{building.lastObservedMonth}</td>
                      <td>
                        <Link
                          className={styles.detailLink}
                          href={buildingSelectionHref(building, linkSelection, locale, {
                            query: buildingQuery,
                            buildingPage: readyBuildingAvailability?.page,
                          })}
                        >{copy.open}</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={styles.tableNote}>{locale === 'ko'
            ? '자료가 없는 값은 —로 표시하며 순위에서 제외합니다.'
            : 'Unbound values display —. Empty values are never treated as a ranking signal.'}</p>
        </section>
      ) : null}

    <p><Link href="/guides/seoul-apartment-buying-budget-guide/">{locale === 'ko' ? '서울 예산별 매수 가이드 (영문)' : 'Apartment buying guide: budgets, costs and ownership checks'}</Link></p>
      <PublicSourceBoundary
        model={model.source}
        locale={locale}
        transaction={usesLegacyCopy ? undefined : model.evidenceSelection.transaction}
        compact
      />
    </section>
  );
}

function groupEvidence(
  sample: string,
  median: string | null,
  locale: ProductLocale,
): string {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  const localizedSample = localizeSampleLabel(sample, locale);
  return median === null
    ? `${copy.notPublished} · ${localizedSample}`
    : `${median} · ${localizedSample}`;
}

function BuildingProximityFacts({ building, locale }: Readonly<{ building: ExploreBuildingModel; locale: ProductLocale }>) {
  const proximity = building.proximity;
  if (proximity === null) return null;
  if (proximity.coordinateStatus === 'pending_coordinate') return <small>{locale === 'ko' ? '거리 미확정' : 'Distance not confirmed'}</small>;
  if (proximity.coordinateStatus === 'unavailable') return <small>{locale === 'ko' ? '좌표 확인 불가' : 'Coordinate unavailable'}</small>;
  return <><small>{locale === 'ko' ? '가까운 역 · 직선거리' : 'Nearest station · straight-line distance'} · {proximity.nearestStation === null ? '—' : `${proximity.nearestStation.name} · ${proximity.nearestStation.lines.join(', ')} · ${Math.round(proximity.nearestStation.distanceMeters)} m`}</small><small>{locale === 'ko' ? '학교 인접성 · 직선거리' : 'School proximity · straight-line distance'} · {proximity.nearestSchool === null ? '—' : `${proximity.nearestSchool.name} · ${Math.round(proximity.nearestSchool.distanceMeters)} m`}</small></>;
}

function BuildingEvidencePanel({
  building,
  locale,
}: Readonly<{ building: ExploreBuildingModel; locale: ProductLocale }>) {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  if (building.evidenceStatus !== 'published') {
    return (
      <article
        className={styles.buildingPanel}
        aria-live="polite"
        data-building-panel={building.id}
        data-selected-building-card={building.id}
        data-building-evidence={building.evidenceStatus}
      >
        <p>{copy.selectedBuilding}</p>
        <h3 title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).title}</h3>
        <span title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).location} · {evidenceHousingOptions.find(([value]) => value === building.housingType)?.[locale === 'ko' ? 2 : 1] ?? building.housingType}</span>
        <strong>{copy.priceEvidenceUnavailable}</strong>
        <dl>
          <div><dt>{copy.observedPeriod}</dt><dd>{building.firstObservedMonth}–{building.lastObservedMonth}</dd></div>
          <div><dt>{copy.jeonseObservations}</dt><dd>{building.jeonseObservationCount}</dd></div>
          <div><dt>{copy.monthlyObservations}</dt><dd>{building.monthlyObservationCount}</dd></div>
          <div><dt>{copy.sample}</dt><dd>{building.observationCount}</dd></div>
        </dl>
        <BuildingProximityFacts building={building} locale={locale} />
      </article>
    );
  }
  return (
    <article
      className={styles.buildingPanel}
      aria-live="polite"
      data-building-panel={building.id}
      data-selected-building-card={building.id}
      data-building-evidence={building.evidenceStatus}
    >
      <p>{copy.selectedBuilding}</p>
      <h3 title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).title}</h3>
      <span title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).location} · {localizeSampleLabel(building.sampleLabel, locale)}</span>
      <dl>
        <div><dt>{building.primaryMetric === 'monthly-rent'
          ? (locale === 'ko' ? '월세 중앙값' : 'Monthly-rent median')
          : building.primaryMetric === 'sale-price'
            ? (locale === 'ko' ? '매매가 중앙값' : 'Sale-price median')
            : copy.all}</dt><dd>{building.medianLabel}</dd></div>
        {building.primaryMetric === 'monthly-rent' ? (
          <div><dt>{locale === 'ko' ? '신고 보증금 중앙값' : 'Filed deposit median'}</dt><dd>{building.filedDepositMedianLabel ?? copy.notPublished}</dd></div>
        ) : null}
        {building.transaction === 'sale' ? null : (
          <>
            <div><dt>{copy.new}</dt><dd>{groupEvidence(building.newSampleLabel, building.newMedianLabel, locale)}</dd></div>
            <div><dt>{copy.renewal}</dt><dd>{groupEvidence(building.renewalSampleLabel, building.renewalMedianLabel, locale)}</dd></div>
            <div><dt>{copy.unclassified}</dt><dd>{building.unknownContractCount}</dd></div>
          </>
        )}
      </dl>
      <BuildingProximityFacts building={building} locale={locale} />
    </article>
  );
}

function UnavailableAreaExplorer({
  model,
  locale,
}: Readonly<{
  model: Extract<PublicAreaExploreModel, { status: 'unavailable' }>;
  locale: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  return (
    <section className={styles.explorer} aria-labelledby="area-unavailable-heading">
      <header className={styles.unavailableHeader}>
        <p>{copy.unavailableEyebrow}</p>
        <h1 id="area-unavailable-heading">
          {locale === 'ko' ? '검증된 구별 자료를 확인할 수 없습니다.' : model.message}
        </h1>
        <p>{copy.unavailableReason}</p>
      </header>
      <div className={styles.unavailableFrame} data-map-state="unavailable">
        <p>{copy.unavailableAction}</p>
        <Link
          className={styles.selectedLink}
          href={localizedSeoulHref('/kr/seoul/', locale)}
        >
          {copy.unavailableActionLink}
        </Link>
      </div>
      <PublicSourceBoundary model={model.source} locale={locale} compact />
    </section>
  );
}

export function AreaExplorer({
  model,
  naverMapClientId = null,
  googleMapsBrowserKey = null,
  locale = 'en',
  initialQuery = '',
  initialSelection = Object.freeze({ market: 'kr', transaction: 'sale' }),
}: Readonly<{
  model: PublicAreaExploreModel;
  naverMapClientId?: string | null;
  googleMapsBrowserKey?: string | null;
  locale?: ProductLocale;
  initialQuery?: string;
  initialSelection?: ExplorerSelection;
}>) {
  return (
    <>
      {model.status === 'ready'
        ? (
          <ReadyAreaExplorer
            key={`${model.selectedSlug}:${initialQuery}:${model.evidenceSelection.transaction}:${
              model.evidenceSelection.areaBand
            }:${model.evidenceSelection.housingType}:${model.evidenceSelection.contractGroup}:${
              model.buildingAvailability.status === 'ready'
                ? model.buildingAvailability.page
                : 0
            }:${initialSelection.view ?? 'split'}:${initialSelection.neighborhood ?? 'all'}:${initialSelection.buildingId ?? 'none'}`}
            model={model}
            naverMapClientId={naverMapClientId}
            googleMapsBrowserKey={googleMapsBrowserKey}
            locale={locale}
            initialQuery={initialQuery}
            initialSelection={initialSelection}
          />
        )
        : <UnavailableAreaExplorer model={model} locale={locale} />}
    </>
  );
}
