'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useReducer, useState } from 'react';

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
} from '../../lib/navigation/explorer-selection';
import {
  NaverDistrictMap,
  buildNaverBuildingAddressQuery,
} from '../maps/naver-district-map';
import type {
  ExploreDistrictModel,
  ExploreBuildingModel,
  PublicAreaExploreModel,
} from '../../lib/public-market/area-route-types';
import {
  PUBLIC_MARKET_COPY,
  localizeEvidenceMessage,
  localizedSeoulHref,
  localizeSampleLabel,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import styles from './area-explorer.module.css';
import { DistrictEvidenceSummary } from './district-evidence-summary';
import { PublicSourceBoundary } from './public-source-boundary';

const bucketClasses = [
  styles.bucket0,
  styles.bucket1,
  styles.bucket2,
  styles.bucket3,
  styles.bucket4,
] as const;

const evidenceAreaOptions = Object.freeze([
  ['all', 'All areas', '전체 면적'],
  ['under-40', 'Under 40㎡', '40㎡ 미만'],
  ['40-60', '40–60㎡', '40–60㎡'],
  ['60-85', '60–85㎡', '60–85㎡'],
  ['85-plus', '85㎡ and above', '85㎡ 이상'],
] as const);
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
      heroDescription: '서울 25개 구의 공식 신고 계약 근거입니다. 거래유형·신고면적·건물유형·계약구분을 선택할 수 있으며, 표본 5건 미만의 금액은 게시하지 않습니다.',
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
    heroDescription: 'Official reported-contract evidence across all 25 Seoul districts. Refine by transaction, filed area, building type and contract group; money stays hidden below the five-contract rule.',
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

function mapTitle(district: ExploreDistrictModel, locale: ProductLocale): string {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  return [
    locale === 'ko' ? `${district.nameKo} 근거 열기` : `Open ${district.nameEn} evidence`,
    locale === 'ko' ? district.nameEn : district.nameKo,
    district.medianLabel ?? copy.notPublished,
    localizeSampleLabel(district.sampleLabel, locale),
  ].join(' · ');
}

function buildingSelectionHref(
  building: ExploreBuildingModel,
  selection: ExplorerSelection,
  locale: ProductLocale,
): string {
  return localizedSeoulHref(createSelectionHref(
    building.href,
    {
      ...selection,
      district: building.districtSlug,
      neighborhood: building.neighborhoodId,
      buildingId: building.id,
    },
    { market: 'kr', transaction: 'jeonse' },
  ), locale);
}

export function createExploreBuildingSelectionHref(
  building: ExploreBuildingModel,
  selection: ExplorerSelection,
  locale: ProductLocale,
  location: Readonly<{ query?: string; buildingPage?: number }> = Object.freeze({}),
): string {
  const href = localizedSeoulHref(createSelectionHref(
    '/kr/seoul/explore/',
    {
      ...selection,
      district: building.districtSlug,
      neighborhood: building.neighborhoodId,
      buildingId: building.id,
    },
    { market: 'kr', transaction: 'jeonse' },
  ), locale);
  const target = new URL(href, 'https://signedprice.invalid');
  const query = location.query?.trim() ?? '';
  if (query.length > 0) target.searchParams.set('q', query);
  if (location.buildingPage !== undefined && location.buildingPage > 1) {
    target.searchParams.set('buildingPage', String(location.buildingPage));
  }
  return `${target.pathname}${target.search}`;
}

function ReadyAreaExplorer({
  model,
  naverMapClientId,
  locale,
  initialQuery,
  initialSelection,
}: Readonly<{
  model: Extract<PublicAreaExploreModel, { status: 'ready' }>;
  naverMapClientId: string | null;
  locale: ProductLocale;
  initialQuery: string;
  initialSelection: ExplorerSelection;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  const exactMetricCopy = selectedMetricCopy(model.evidenceSelection.transaction, locale);
  const usesLegacyCopy = model.evidenceSelection.areaBand === 'legacy-45-55';
  const countSeparator = locale === 'en' ? ' ' : '';
  const activeView = initialSelection.view ?? 'split';
  const router = useRouter();
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
  const [visibleBuildingCount, setVisibleBuildingCount] = useState(10);
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
  const neighborhoods = useMemo(() => [...new Map(districtBuildings.map((building) => [
    building.neighborhoodId, building.neighborhoodName,
  ] as const))], [districtBuildings]);
  const filteredBuildings = useMemo(
    () => filterExploreBuildings(
      districtBuildings,
      buildingQuery,
      selectedNeighborhood,
      selectedHousingType,
      [selected.slug, selected.nameEn, selected.nameKo],
    ),
    [
      buildingQuery,
      districtBuildings,
      selected.nameEn,
      selected.nameKo,
      selected.slug,
      selectedHousingType,
      selectedNeighborhood,
    ],
  );
  const selectedBuilding = resolveSelectedExploreBuilding(
    districtBuildings,
    selectedBuildingId,
  );
  const visibleBuildings = useMemo(() => {
    const visible = filteredBuildings.slice(0, visibleBuildingCount);
    if (
      selectedBuilding === null
      || !filteredBuildings.some(({ id }) => id === selectedBuilding.id)
      || visible.some(({ id }) => id === selectedBuilding.id)
    ) return visible;
    return Object.freeze([...visible, selectedBuilding]);
  }, [filteredBuildings, selectedBuilding, visibleBuildingCount]);

  const mapDistricts = useMemo(() => model.districts.map((district) => ({
    slug: district.slug,
    nameEn: locale === 'ko' ? district.nameKo : district.nameEn,
    href: district.href,
    latitude: district.latitude,
    longitude: district.longitude,
  })), [locale, model.districts]);
  const mapBuildings = useMemo(() => visibleBuildings.map((building) => ({
    id: building.id,
    title: building.name,
    href: buildingSelectionHref(building, initialSelection, locale),
    addressQuery: buildNaverBuildingAddressQuery(
      selected.nameKo,
      building.neighborhoodName,
      building.name,
    ),
    latitude: building.latitude,
    longitude: building.longitude,
    allowAddressGeocoding: naverMapClientId !== null
      && building.latitude === null
      && building.longitude === null,
  })), [initialSelection, locale, naverMapClientId, selected.nameKo, visibleBuildings]);

  const selectDistrict = useCallback((slug: string): void => {
    dispatch({ type: 'select', slug });
    setSelectedNeighborhood('all');
    setSelectedHousingType('all');
    setBuildingQuery('');
    dispatchBuildingSelection({ type: 'clear_building' });
    setVisibleBuildingCount(10);
    router.replace(
      localizedSeoulHref(createSelectionHref(
        '/kr/seoul/explore/',
        {
          ...initialSelection,
          district: slug,
          neighborhood: undefined,
          buildingId: undefined,
        },
        { market: 'kr', transaction: 'jeonse' },
      ), locale),
      { scroll: false },
    );
  }, [initialSelection, locale, router]);
  const selectBuilding = useCallback((
    buildingId: string,
    source: 'marker' | 'rail',
  ): void => {
    const building = districtBuildings.find(({ id }) => id === buildingId);
    if (building === undefined) return;
    dispatchBuildingSelection({ type: 'select_building', source, buildingId });
    router.replace(
      createExploreBuildingSelectionHref(building, initialSelection, locale, {
        query: buildingQuery,
        buildingPage: readyBuildingAvailability?.page,
      }),
      { scroll: false },
    );
  }, [
    buildingQuery,
    districtBuildings,
    initialSelection,
    locale,
    readyBuildingAvailability?.page,
    router,
  ]);
  const selectBuildingFromMarker = useCallback((buildingId: string) => {
    selectBuilding(buildingId, 'marker');
  }, [selectBuilding]);

  const evidenceHref = useCallback((changes: Readonly<{
    transaction?: 'sale' | 'jeonse' | 'monthly';
    area?: 'all' | 'under-40' | '40-60' | '60-85' | '85-plus';
    propertyType?: string;
  }> = Object.freeze({})): string => {
    const transaction = changes.transaction ?? model.evidenceSelection.transaction;
    const propertyType = changes.propertyType ?? model.evidenceSelection.housingType;
    return localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        market: 'kr',
        transaction,
        area: changes.area ?? (model.evidenceSelection.areaBand === 'legacy-45-55'
          ? 'all'
          : model.evidenceSelection.areaBand),
        propertyType: propertyType === 'all' ? undefined : propertyType,
        district: state.selectedSlug,
        contractType: transaction === 'sale' ? undefined : initialSelection.contractType,
      },
      { market: 'kr', transaction: 'jeonse' },
    ), locale);
  }, [initialSelection, locale, model.evidenceSelection, state.selectedSlug]);

  const updateBuildingQuery = useCallback((query: string): void => {
    setBuildingQuery(query);
    setVisibleBuildingCount(10);
    dispatchBuildingSelection({ type: 'clear_building' });
    const resolvedSlug = resolveExploreSearchDistrict(
      model.districts,
      allBuildings,
      query,
      state.selectedSlug,
    );
    if (resolvedSlug !== state.selectedSlug) {
      dispatch({ type: 'select', slug: resolvedSlug });
      setSelectedNeighborhood('all');
      setSelectedHousingType('all');
    }
  }, [allBuildings, model.districts, state.selectedSlug]);
  const submitBuildingQuery = useCallback((): void => {
    const href = localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        district: state.selectedSlug,
        neighborhood: undefined,
        buildingId: undefined,
      },
      { market: 'kr', transaction: 'jeonse' },
    ), locale);
    const target = new URL(href, window.location.origin);
    const normalizedQuery = buildingQuery.trim();
    if (normalizedQuery.length === 0) target.searchParams.delete('q');
    else target.searchParams.set('q', normalizedQuery);
    target.searchParams.delete('buildingPage');
    router.replace(`${target.pathname}${target.search}`);
  }, [buildingQuery, initialSelection, locale, router, state.selectedSlug]);
  const buildingPageHref = useCallback((page: number): string => {
    const href = evidenceHref();
    const target = new URL(href, window.location.origin);
    const normalizedQuery = buildingQuery.trim();
    if (normalizedQuery.length === 0) target.searchParams.delete('q');
    else target.searchParams.set('q', normalizedQuery);
    if (page <= 1) target.searchParams.delete('buildingPage');
    else target.searchParams.set('buildingPage', String(page));
    return `${target.pathname}${target.search}`;
  }, [buildingQuery, evidenceHref]);
  const viewHref = useCallback((view: 'split' | 'list' | 'table' | 'map'): string => {
    const href = localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        district: state.selectedSlug,
        neighborhood: selectedNeighborhood === 'all' ? undefined : selectedNeighborhood,
        buildingId: selectedNeighborhood === 'all' ? undefined : selectedBuildingId ?? undefined,
        view: view === 'split' ? undefined : view,
      },
      { market: 'kr', transaction: 'jeonse' },
    ), locale);
    const target = new URL(href, 'https://signedprice.invalid');
    const normalizedQuery = buildingQuery.trim();
    if (normalizedQuery.length > 0) target.searchParams.set('q', normalizedQuery);
    if (readyBuildingAvailability !== null && readyBuildingAvailability.page > 1) {
      target.searchParams.set('buildingPage', String(readyBuildingAvailability.page));
    }
    return `${target.pathname}${target.search}`;
  }, [
    buildingQuery,
    initialSelection,
    locale,
    readyBuildingAvailability,
    selectedBuildingId,
    selectedNeighborhood,
    state.selectedSlug,
  ]);

  const selectNeighborhood = useCallback((neighborhoodId: string): void => {
    setSelectedNeighborhood(neighborhoodId);
    setVisibleBuildingCount(10);
    dispatchBuildingSelection({ type: 'clear_building' });
    const href = localizedSeoulHref(createSelectionHref(
      '/kr/seoul/explore/',
      {
        ...initialSelection,
        district: state.selectedSlug,
        neighborhood: neighborhoodId === 'all' ? undefined : neighborhoodId,
        buildingId: undefined,
      },
      { market: 'kr', transaction: 'jeonse' },
    ), locale);
    const target = new URL(href, 'https://signedprice.invalid');
    const normalizedQuery = buildingQuery.trim();
    if (normalizedQuery.length > 0) target.searchParams.set('q', normalizedQuery);
    if (readyBuildingAvailability !== null && readyBuildingAvailability.page > 1) {
      target.searchParams.set('buildingPage', String(readyBuildingAvailability.page));
    }
    router.replace(`${target.pathname}${target.search}`, { scroll: false });
  }, [
    buildingQuery,
    initialSelection,
    locale,
    readyBuildingAvailability,
    router,
    state.selectedSlug,
  ]);

  return (
    <section
      className={styles.explorer}
      aria-labelledby="area-explorer-heading"
      data-market-selection={`${initialSelection.market}:${initialSelection.transaction}`}
      data-explore-view={activeView}
      data-explorer-version="v2"
    >
      <header className={styles.hero}>
        <div>
          <p>{copy.heroEyebrow}</p>
          <h1 id="area-explorer-heading">
            {usesLegacyCopy ? copy.heroHeading : exactMetricCopy.heroHeading}
          </h1>
          <p>{usesLegacyCopy ? copy.heroDescription : exactMetricCopy.heroDescription}</p>
        </div>
        <Link className={styles.rankingsLink} href={localizedSeoulHref('/kr/seoul/rankings/', locale)}>
          {copy.rankingsLink}
        </Link>
        <dl className={styles.marketTape} aria-label={locale === 'ko' ? '현재 탐색 범위' : 'Current exploration scope'}>
          <div>
            <dt>{locale === 'ko' ? '지역' : 'Market'}</dt>
            <dd>{locale === 'ko' ? '서울 25개 구' : 'Seoul · 25 districts'}</dd>
          </div>
          <div>
            <dt>{locale === 'ko' ? '신고기간' : 'Evidence period'}</dt>
            <dd>{model.source.period}</dd>
          </div>
          <div>
            <dt>{locale === 'ko' ? '선택 지역' : 'Selected district'}</dt>
            <dd>{locale === 'ko' ? selected.nameKo : selected.nameEn}</dd>
          </div>
          <div>
            <dt>{locale === 'ko' ? '검색 결과' : 'Matching buildings'}</dt>
            <dd>{filteredBuildings.length.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}</dd>
          </div>
        </dl>
      </header>

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
        <div className={styles.buildingSearch} data-building-search="retained">
          <label htmlFor="explore-building-query">
            {locale === 'ko' ? '구·동·건물·유형 검색' : 'Search district, neighborhood, building or type'}
          </label>
          <span className={styles.visuallyHidden}>Search retained buildings</span>
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
            placeholder={locale === 'ko' ? '예: 강남구, 역삼동, 아파트' : 'Try Gangnam-gu, Yeoksam-dong or apartment'}
          />
        </div>
        <label className={styles.toolbarSelect}>
          <span>{locale === 'ko' ? '면적' : 'Area'}</span>
          <select
            name="evidence-area"
            value={model.evidenceSelection.areaBand === 'legacy-45-55'
              ? 'all'
              : model.evidenceSelection.areaBand}
            onChange={(event) => router.replace(evidenceHref({
              area: event.currentTarget.value as 'all' | 'under-40' | '40-60' | '60-85' | '85-plus',
            }), { scroll: false })}
          >
            {evidenceAreaOptions.map(([value, en, ko]) => (
              <option value={value} key={value}>{locale === 'ko' ? ko : en}</option>
            ))}
          </select>
        </label>
        <label className={styles.toolbarSelect}>
          <span>{locale === 'ko' ? '지역' : 'District'}</span>
          <select value={selected.slug} onChange={(event) => selectDistrict(event.currentTarget.value)}>
            {model.districts.map((district) => (
              <option value={district.slug} key={district.slug}>
                {locale === 'ko' ? district.nameKo : district.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.toolbarSelect}>
          <span>{locale === 'ko' ? '건물 유형' : 'Building type'}</span>
          <select
            name="housing-type"
            value={selectedHousingType}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setSelectedHousingType(value);
              setVisibleBuildingCount(10);
              router.replace(evidenceHref({ propertyType: value }), { scroll: false });
            }}
          >
            {evidenceHousingOptions.map(([value, en, ko]) => (
              <option value={value} key={value}>{locale === 'ko' ? ko : en}</option>
            ))}
          </select>
        </label>
        <div
          className={styles.toolbarStatus}
          data-building-inventory={model.coverage.buildings.status === 'ready' ? 'observed' : 'unavailable'}
        >
          <span>{copy.observedBuildings}</span>
          <strong>{model.coverage.buildings.status === 'ready'
            ? model.coverage.buildings.observed
            : '—'}</strong>
          <small>{copy.transactionCoveredBuildings} · {model.coverage.buildings.transactionCovered ?? '—'} · {copy.priceReadyBuildings} · {model.coverage.buildings.priceReady ?? '—'}</small>
        </div>
      </div>

      <nav className={styles.viewBar} aria-label={locale === 'ko' ? '탐색 보기' : 'Explorer view'}>
        <span>{locale === 'ko' ? '보기' : 'View'}</span>
        <div className={styles.viewTabs}>
          {([
            ['split', 'Split', '분할'],
            ['list', 'List', '목록'],
            ['table', 'Table', '표'],
            ['map', 'Map', '지도'],
          ] as const).map(([value, en, ko]) => (
            <Link
              key={value}
              href={viewHref(value)}
              aria-current={activeView === value ? 'page' : undefined}
            >{locale === 'ko' ? ko : en}</Link>
          ))}
        </div>
      </nav>

      <div className={styles.workspace} data-explorer-layout={activeView}>
        <aside className={styles.districtRail} data-district-rail="all-25" data-explorer-region="results" aria-label={locale === 'ko' ? '서울 25개 구' : 'All 25 Seoul districts'}>
          <div className={styles.districtRailHeading}>
            <span>{locale === 'ko' ? '지역' : 'Districts'}</span>
            <strong>25</strong>
          </div>
          <ol>
            {model.districts.map((district) => (
              <li key={district.slug}>
                <button
                  type="button"
                  aria-pressed={district.slug === selected.slug}
                  data-district-option={district.slug}
                  onClick={() => selectDistrict(district.slug)}
                >
                  <span>
                    <strong>{locale === 'ko' ? district.nameKo : district.nameEn}</strong>
                    <small>{locale === 'ko' ? district.nameEn : district.nameKo}</small>
                  </span>
                  <small>{district.medianLabel ?? copy.notPublished}</small>
                </button>
              </li>
            ))}
          </ol>
        </aside>
        <section className={styles.mapPanel} data-explorer-region="map" aria-labelledby="area-map-heading">
          <div className={styles.sectionHeading}>
            <p>{copy.mapEyebrow}</p>
            <h2 id="area-map-heading">
              {usesLegacyCopy ? copy.mapHeading : exactMetricCopy.mapHeading}
            </h2>
          </div>
          <button className={styles.searchAreaButton} type="button" onClick={submitBuildingQuery}>
            {locale === 'ko' ? '이 지역 검색' : 'Search this area'}
          </button>
          <NaverDistrictMap
            clientId={naverMapClientId}
            districts={mapDistricts}
            selectedDistrict={selected}
            buildings={mapBuildings}
            onSelectDistrict={selectDistrict}
            onSelectBuilding={selectBuildingFromMarker}
            locale={locale}
            fallback={<svg
              className={styles.map}
              viewBox="0 0 720 560"
              role="img"
              aria-labelledby="area-map-title area-map-description"
            >
            <title id="area-map-title">
              {usesLegacyCopy ? copy.mapTitle : exactMetricCopy.mapTitle}
            </title>
            <desc id="area-map-description">
              {copy.mapDescription}
            </desc>
            <defs>
              <pattern
                id="area-withheld-hatch"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="10" height="10" className={styles.hatchGround} />
                <line x1="0" y1="0" x2="0" y2="10" className={styles.hatchLine} />
              </pattern>
            </defs>
            {model.districts.map((district) => (
              <path
                key={district.slug}
                d={district.path}
                className={`${styles.mapPath} ${
                  district.bucket === null
                    ? styles.withheld
                    : bucketClasses[district.bucket]
                } ${district.slug === state.selectedSlug ? styles.selectedPath : ''}`}
                data-district-path={district.slug}
                data-map-bucket={district.bucket ?? undefined}
                data-map-state={district.state}
                aria-hidden="true"
                onPointerUp={() => {
                  selectDistrict(district.slug);
                }}
              >
                <title>{mapTitle(district, locale)}</title>
              </path>
            ))}
            </svg>}
          />

          <div
            className={styles.legend}
            role="group"
            aria-label={locale === 'ko' ? '지도 범례' : 'Map legend'}
          >
            <p>{usesLegacyCopy ? copy.mapLegend : exactMetricCopy.mapHeading} · {model.source.band}</p>
            <ol>
              {model.legend.map((bucket) => (
                <li key={bucket.bucket}>
                  <span className={bucketClasses[bucket.bucket]} aria-hidden="true" />
                  <span>
                    {bucket.label} · {bucket.count}
                    {locale === 'en'
                      ? ` district${bucket.count === 1 ? '' : 's'}`
                      : copy.districtCount}
                  </span>
                </li>
              ))}
              <li>
                <span className={styles.legendHatch} aria-hidden="true" />
                <span>{copy.notPublished} · {copy.fewerThan} {model.source.publicationMinimum} {copy.contracts}</span>
              </li>
            </ol>
          </div>

          <div className={styles.selectedDetail} data-explorer-region="selection" aria-live="polite">
            <p className={styles.selectedLabel}>
              {copy.selected} · {locale === 'ko' ? selected.nameKo : selected.nameEn}
            </p>
            <DistrictEvidenceSummary
              key={selected.slug}
              model={selected.contractEvidence}
              mode="compact"
              selectionHref={localizedSeoulHref(`/kr/seoul/explore/?district=${selected.slug}`, locale)}
              locale={locale}
              medianLabel={usesLegacyCopy ? undefined : exactMetricCopy.medianLabel}
              showContractGroups={model.evidenceSelection.transaction !== 'sale'}
            />
          </div>
        </section>

        <section className={styles.rail} aria-labelledby="district-table-heading">
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
                      ? '관측 건물 인벤토리가 없어 현재 가격 게시 가능 건물만 표시합니다.'
                      : 'Observed inventory unavailable. Showing the verified price-ready fallback.'}
                  </p>
                ) : null}
                <div className={styles.neighborhoods} aria-label={copy.neighborhoodFilter}>
                  <button
                    type="button"
                    aria-pressed={selectedNeighborhood === 'all'}
                    onClick={() => selectNeighborhood('all')}
                  >{copy.all} · {districtBuildings.length}</button>
                  {neighborhoods.map(([id, name]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={selectedNeighborhood === id}
                      onClick={() => selectNeighborhood(id)}
                    >{name}</button>
                  ))}
                </div>
                <p className={styles.resultSummary} aria-live="polite">
                  {model.buildingAvailability.status === 'ready'
                    ? model.buildingAvailability.total
                    : filteredBuildings.length} {model.buildingAvailability.status === 'ready'
                    ? copy.observedBuildings.toLocaleLowerCase(locale === 'ko' ? 'ko-KR' : 'en-US')
                    : locale === 'ko' ? '개 가격 게시 가능 건물' : 'price-ready buildings'}
                </p>
                {filteredBuildings.length === 0 ? (
                  <div className={styles.buildingEmpty} role="status">
                    <strong>{locale === 'ko' ? '일치하는 공개 건물이 없습니다.' : 'No retained building matches this search.'}</strong>
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
                          data-building-evidence={building.evidenceStatus}
                          data-building-row={building.id}
                        >
                          <button
                            type="button"
                            aria-pressed={selectedBuilding?.id === building.id}
                            onClick={() => selectBuilding(building.id, 'rail')}
                          >
                            <span>
                              <strong>{building.name}</strong>
                              <small>{building.neighborhoodName} · {building.housingType}</small>
                              <small>{model.evidenceSelection.areaBand === 'legacy-45-55'
                                ? `${copy.jeonseObservations} · ${building.jeonseObservationCount} · ${copy.monthlyObservations} · ${building.monthlyObservationCount}`
                                : building.transaction === 'sale'
                                ? `${locale === 'ko' ? '매매 관측' : 'Sale observations'} · ${building.observationCount}`
                                : building.transaction === 'monthly'
                                  ? `${copy.monthlyObservations} · ${building.monthlyObservationCount}`
                                  : `${copy.jeonseObservations} · ${building.jeonseObservationCount}`}</small>
                            </span>
                            <span>
                              <strong>{building.medianLabel ?? copy.priceEvidenceUnavailable}</strong>
                              {building.transaction === 'monthly'
                                && building.filedDepositMedianLabel !== null
                                && building.filedDepositMedianLabel !== undefined
                                ? <small>{locale === 'ko' ? '신고 보증금 중앙값' : 'Filed deposit median'} · {building.filedDepositMedianLabel}</small>
                                : null}
                              <small>{building.evidenceStatus === 'published'
                                ? building.sampleLabel
                                : `${copy.observedPeriod} · ${building.firstObservedMonth}–${building.lastObservedMonth}`}</small>
                            </span>
                          </button>
                          <Link
                            className={styles.buildingRowLink}
                            href={buildingSelectionHref(building, initialSelection, locale)}
                          >
                            {copy.openBuilding}
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
                            setVisibleBuildingCount((count) => count + 10);
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
                <div className={styles.buildingSelection} data-explorer-region="selection">
                  {selectedBuilding === null ? (
                    <div className={styles.selectionEmpty}>
                      <p>{locale === 'ko' ? '건물을 선택하세요' : 'Select a building'}</p>
                      <span>{locale === 'ko'
                        ? '지도 핀이나 목록 행을 선택하면 동일한 근거가 여기에 표시됩니다.'
                        : 'Choose a map pin or result row to inspect the same verified evidence here.'}</span>
                    </div>
                  ) : (
                    <BuildingEvidencePanel
                      building={selectedBuilding}
                      href={buildingSelectionHref(selectedBuilding, initialSelection, locale)}
                      locale={locale}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <section
        className={styles.coverage}
        data-coverage-panel="verified"
        aria-labelledby="coverage-heading"
      >
        <div className={styles.coverageHeading}>
          <p>{copy.coverageEyebrow}</p>
          <h2 id="coverage-heading">{copy.coverageHeading}</h2>
        </div>
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
          <p>{locale === 'ko' ? '이 수치는 전체 관측 건물 수가 아닙니다.' : 'Published cohorts are not the total observed building inventory.'}</p>
        </div>
      </section>

      <section className={styles.completeTable} aria-labelledby="district-table-heading">
          <div className={styles.sectionHeading}>
            <p>{copy.completeTableEyebrow}</p>
            <h2 id="district-table-heading">{copy.completeTableHeading}</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>{copy.tableCaption}</caption>
              <thead>
                <tr>
                  <th scope="col">{copy.district}</th>
                  <th scope="col">{copy.median}</th>
                  <th scope="col">{copy.sample}</th>
                  <th scope="col">{copy.evidence}</th>
                </tr>
              </thead>
              <tbody>
                {model.districts.map((district) => {
                  const isSelected = district.slug === state.selectedSlug;
                  return (
                    <tr
                      key={district.slug}
                      className={isSelected ? styles.selectedRow : undefined}
                      data-district-row={district.slug}
                    >
                      <th scope="row">
                        <Link
                          className={styles.districtButton}
                          href={district.href}
                          aria-label={locale === 'ko'
                            ? `${district.nameKo} 근거 열기`
                            : `Open ${district.nameEn} evidence`}
                          aria-current={isSelected ? 'true' : undefined}
                          onPointerEnter={() => dispatch({ type: 'select', slug: district.slug })}
                          onFocus={() => dispatch({ type: 'select', slug: district.slug })}
                          onClick={(event) => { event.preventDefault(); selectDistrict(district.slug); }}
                        >
                          <strong>{locale === 'ko' ? district.nameKo : district.nameEn}</strong>
                          <span lang={locale === 'ko' ? 'en' : 'ko'}>
                            {locale === 'ko' ? district.nameEn : district.nameKo}
                          </span>
                          {isSelected ? <small>{copy.selected}</small> : null}
                        </Link>
                      </th>
                      <td>
                        <strong>{district.medianLabel ?? copy.notPublished}</strong>
                        {district.changeLabel === null ? null : (
                          <small>{localizeEvidenceMessage(district.changeLabel, locale)}</small>
                        )}
                      </td>
                      <td>{localizeSampleLabel(district.sampleLabel, locale)}</td>
                      <td>
                        <Link
                          className={styles.detailLink}
                          href={district.href}
                          aria-label={locale === 'ko'
                            ? `${district.nameKo} 근거 열기`
                            : `Open ${district.nameEn} evidence`}
                        >
                          {copy.open}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </section>

      <PublicSourceBoundary
        model={model.source}
        locale={locale}
        transaction={usesLegacyCopy ? undefined : model.evidenceSelection.transaction}
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

function BuildingEvidencePanel({
  building,
  href,
  locale,
}: Readonly<{ building: ExploreBuildingModel; href: string; locale: ProductLocale }>) {
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
        <h3>{building.name}</h3>
        <span>{building.neighborhoodName} · {building.housingType}</span>
        <strong>{copy.priceEvidenceUnavailable}</strong>
        <dl>
          <div><dt>{copy.observedPeriod}</dt><dd>{building.firstObservedMonth}–{building.lastObservedMonth}</dd></div>
          <div><dt>{copy.jeonseObservations}</dt><dd>{building.jeonseObservationCount}</dd></div>
          <div><dt>{copy.monthlyObservations}</dt><dd>{building.monthlyObservationCount}</dd></div>
          <div><dt>{copy.sample}</dt><dd>{building.observationCount}</dd></div>
        </dl>
        <Link href={href}>{copy.openBuilding}</Link>
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
      <h3>{building.name}</h3>
      <span>{building.neighborhoodName} · {localizeSampleLabel(building.sampleLabel, locale)}</span>
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
      <Link href={href}>{copy.fullBuildingEvidence}</Link>
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
      <header className={styles.hero}>
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
      <PublicSourceBoundary model={model.source} locale={locale} />
    </section>
  );
}

export function AreaExplorer({
  model,
  naverMapClientId = null,
  locale = 'en',
  initialQuery = '',
  initialSelection = Object.freeze({ market: 'kr', transaction: 'jeonse' }),
}: Readonly<{
  model: PublicAreaExploreModel;
  naverMapClientId?: string | null;
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
            }:${initialSelection.view ?? 'split'}:${initialSelection.buildingId ?? 'none'}`}
            model={model}
            naverMapClientId={naverMapClientId}
            locale={locale}
            initialQuery={initialQuery}
            initialSelection={initialSelection}
          />
        )
        : <UnavailableAreaExplorer model={model} locale={locale} />}
    </>
  );
}
