'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useReducer, useState } from 'react';

import {
  areaExplorerReducer,
  buildingExplorerSelectionReducer,
  resolveSelectedExploreBuilding,
  type AreaExplorerState,
} from '../../lib/public-market/area-explorer-state';
import { NaverDistrictMap } from '../maps/naver-district-map';
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
import { PublicSectionTabs } from './public-section-tabs';
import { PublicSourceBoundary } from './public-source-boundary';

const bucketClasses = [
  styles.bucket0,
  styles.bucket1,
  styles.bucket2,
  styles.bucket3,
  styles.bucket4,
] as const;

function mapTitle(district: ExploreDistrictModel, locale: ProductLocale): string {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  return [
    locale === 'ko' ? `${district.nameKo} 근거 열기` : `Open ${district.nameEn} evidence`,
    locale === 'ko' ? district.nameEn : district.nameKo,
    district.medianLabel ?? copy.notPublished,
    localizeSampleLabel(district.sampleLabel, locale),
  ].join(' · ');
}

function ReadyAreaExplorer({
  model,
  naverMapClientId,
  locale,
}: Readonly<{
  model: Extract<PublicAreaExploreModel, { status: 'ready' }>;
  naverMapClientId: string | null;
  locale: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  const countSeparator = locale === 'en' ? ' ' : '';
  const router = useRouter();
  const initial: AreaExplorerState = Object.freeze({
    selectedSlug: model.selectedSlug,
    districtSlugs: Object.freeze(model.districts.map(({ slug }) => slug)),
  });
  const [state, dispatch] = useReducer(areaExplorerReducer, initial);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [buildingSelection, dispatchBuildingSelection] = useReducer(
    buildingExplorerSelectionReducer,
    Object.freeze({ selectedBuildingId: null }),
  );
  const { selectedBuildingId } = buildingSelection;
  const [visibleBuildingCount, setVisibleBuildingCount] = useState(10);
  const selected = model.districts.find(({ slug }) => slug === state.selectedSlug)
    ?? model.districts[0]!;
  const districtBuildings = useMemo(() => (
    model.buildingAvailability.status === 'ready'
      ? model.buildingAvailability.buildings.filter(({ districtSlug }) => districtSlug === selected.slug)
      : []
  ), [model.buildingAvailability, selected.slug]);
  const neighborhoods = useMemo(() => [...new Map(districtBuildings.map((building) => [
    building.neighborhoodId, building.neighborhoodName,
  ] as const))], [districtBuildings]);
  const filteredBuildings = useMemo(() => districtBuildings.filter((building) => (
    selectedNeighborhood === 'all' || building.neighborhoodId === selectedNeighborhood
  )), [districtBuildings, selectedNeighborhood]);
  const visibleBuildings = useMemo(
    () => filteredBuildings.slice(0, visibleBuildingCount),
    [filteredBuildings, visibleBuildingCount],
  );
  const selectedBuilding = resolveSelectedExploreBuilding(
    districtBuildings,
    selectedBuildingId,
  );

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
    href: building.href,
    addressQuery: `서울특별시 ${selected.nameKo} ${building.neighborhoodName} ${building.name}`,
    latitude: building.latitude,
    longitude: building.longitude,
  })), [selected.nameKo, visibleBuildings]);

  const selectDistrict = useCallback((slug: string): void => {
    dispatch({ type: 'select', slug });
    setSelectedNeighborhood('all');
    dispatchBuildingSelection({ type: 'clear_building' });
    setVisibleBuildingCount(10);
    router.replace(
      localizedSeoulHref(`/kr/seoul/explore/?district=${slug}`, locale),
      { scroll: false },
    );
  }, [locale, router]);
  const selectBuildingFromMarker = useCallback((buildingId: string) => {
    dispatchBuildingSelection({ type: 'select_building', source: 'marker', buildingId });
  }, []);

  return (
    <section className={styles.explorer} aria-labelledby="area-explorer-heading">
      <header className={styles.hero}>
        <p>{copy.heroEyebrow}</p>
        <h1 id="area-explorer-heading">{copy.heroHeading}</h1>
        <p>{copy.heroDescription}</p>
        <Link
          className={styles.rankingsLink}
          href={localizedSeoulHref('/kr/seoul/rankings/', locale)}
        >
          {copy.rankingsLink}
        </Link>
      </header>

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
          <div>
            <dt>{copy.districtsPublished}</dt>
            <dd>{model.coverage.districts.published} {copy.of} {model.coverage.districts.retained}</dd>
          </div>
          <div>
            <dt>{copy.buildingsPublished}</dt>
            <dd>{model.coverage.buildings.status === 'ready'
              ? `${model.coverage.buildings.published} ${copy.of} ${model.coverage.buildings.retained}`
              : copy.unavailable}</dd>
          </div>
          <div>
            <dt>{copy.eligibleContracts}</dt>
            <dd>{model.coverage.eligibleContracts} {copy.eligibleSuffix}</dd>
          </div>
        </dl>
        <div className={styles.coverageLimits}>
          <p>{model.coverage.unpublished.districtsBelowMinimum}{countSeparator}{copy.districtsBelowMinimum}</p>
          {model.coverage.unpublished.retainedBuildingsBelowMinimum === null ? (
            <p>{copy.buildingArtifactMissing}</p>
          ) : (
            <p>{model.coverage.unpublished.retainedBuildingsBelowMinimum}{countSeparator}{copy.retainedBuildingsBelowMinimum}</p>
          )}
          <p>{locale === 'ko'
            ? copy.sourceCandidatesMissing
            : model.coverage.unpublished.sourceBuildingCandidates.reason}</p>
        </div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.mapPanel} aria-labelledby="area-map-heading">
          <div className={styles.sectionHeading}>
            <p>{copy.mapEyebrow}</p>
            <h2 id="area-map-heading">{copy.mapHeading}</h2>
          </div>
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
            <title id="area-map-title">{copy.mapTitle}</title>
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

          <div className={styles.legend} aria-label={copy.mapHeading}>
            <p>{copy.mapLegend} · {model.source.band}</p>
            <ol>
              {model.legend.map((bucket) => (
                <li key={bucket.bucket}>
                  <span className={bucketClasses[bucket.bucket]} aria-hidden="true" />
                  <span>{bucket.label} · {bucket.count}{copy.districtCount}</span>
                </li>
              ))}
              <li>
                <span className={styles.legendHatch} aria-hidden="true" />
                <span>{copy.notPublished} · {copy.fewerThan} {model.source.publicationMinimum} {copy.contracts}</span>
              </li>
            </ol>
          </div>

          <div className={styles.selectedDetail} aria-live="polite">
            <p className={styles.selectedLabel}>
              {copy.selected} · {locale === 'ko' ? selected.nameKo : selected.nameEn}
            </p>
            <DistrictEvidenceSummary
              key={selected.slug}
              model={selected.contractEvidence}
              mode="compact"
              selectionHref={localizedSeoulHref(`/kr/seoul/explore/?district=${selected.slug}`, locale)}
              locale={locale}
            />
          </div>
        </section>

        <section className={styles.rail} aria-labelledby="district-table-heading">
          <div className={styles.buildingBrowser} data-building-browser={selected.slug}>
            <div className={styles.sectionHeading}>
              <p>{copy.buildingsEyebrow}</p>
              <h2>{locale === 'ko' ? selected.nameKo : selected.nameEn} {copy.buildingEvidence}</h2>
            </div>
            {model.buildingAvailability.status === 'not_loaded' ? (
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
                <div className={styles.neighborhoods} aria-label={copy.neighborhoodFilter}>
                  <button
                    type="button"
                    aria-pressed={selectedNeighborhood === 'all'}
                    onClick={() => { setSelectedNeighborhood('all'); setVisibleBuildingCount(10); }}
                  >{copy.all} · {districtBuildings.length}</button>
                  {neighborhoods.map(([id, name]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={selectedNeighborhood === id}
                      onClick={() => { setSelectedNeighborhood(id); setVisibleBuildingCount(10); }}
                    >{name}</button>
                  ))}
                </div>
                <ul className={styles.buildingList}>
                  {visibleBuildings.map((building) => (
                    <li key={building.id}>
                      <button
                        type="button"
                        aria-pressed={selectedBuilding?.id === building.id}
                        onClick={() => dispatchBuildingSelection({
                          type: 'select_building', source: 'rail', buildingId: building.id,
                        })}
                      >
                        <span><strong>{building.name}</strong><small>{building.neighborhoodName} · {building.housingType}</small></span>
                        <span><strong>{building.medianLabel}</strong><small>{building.sampleLabel}</small></span>
                      </button>
                    </li>
                  ))}
                </ul>
                {visibleBuildings.length < filteredBuildings.length ? (
                  <button
                    type="button"
                    className={styles.moreBuildings}
                    onClick={() => setVisibleBuildingCount((count) => count + 10)}
                  >{copy.showMore}</button>
                ) : null}
                {selectedBuilding === null ? null : (
                  <BuildingEvidencePanel building={selectedBuilding} locale={locale} />
                )}
              </>
            )}
          </div>
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
      </div>

      <PublicSourceBoundary model={model.source} locale={locale} />
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
  locale,
}: Readonly<{ building: ExploreBuildingModel; locale: ProductLocale }>) {
  const copy = PUBLIC_MARKET_COPY[locale].area;
  return (
    <article className={styles.buildingPanel} aria-live="polite" data-building-panel={building.id}>
      <p>{copy.selectedBuilding}</p>
      <h3>{building.name}</h3>
      <span>{building.neighborhoodName} · {localizeSampleLabel(building.sampleLabel, locale)}</span>
      <dl>
        <div><dt>{copy.all}</dt><dd>{building.medianLabel}</dd></div>
        <div><dt>{copy.new}</dt><dd>{groupEvidence(building.newSampleLabel, building.newMedianLabel, locale)}</dd></div>
        <div><dt>{copy.renewal}</dt><dd>{groupEvidence(building.renewalSampleLabel, building.renewalMedianLabel, locale)}</dd></div>
        <div><dt>{copy.unclassified}</dt><dd>{building.unknownContractCount}</dd></div>
      </dl>
      <Link href={building.href}>{copy.fullBuildingEvidence}</Link>
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
}: Readonly<{
  model: PublicAreaExploreModel;
  naverMapClientId?: string | null;
  locale?: ProductLocale;
}>) {
  return (
    <>
      <PublicSectionTabs current="explore" locale={locale} />
      {model.status === 'ready'
        ? <ReadyAreaExplorer model={model} naverMapClientId={naverMapClientId} locale={locale} />
        : <UnavailableAreaExplorer model={model} locale={locale} />}
    </>
  );
}
