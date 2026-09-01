'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReducer, useState } from 'react';

import {
  areaExplorerReducer,
  type AreaExplorerState,
} from '../../lib/public-market/area-explorer-state';
import { NaverDistrictMap } from '../maps/naver-district-map';
import type {
  ExploreDistrictModel,
  ExploreBuildingModel,
  PublicAreaExploreModel,
} from '../../lib/public-market/area-route-types';
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

function mapTitle(district: ExploreDistrictModel): string {
  return [
    `Open ${district.nameEn} evidence`,
    district.nameKo,
    district.medianLabel ?? 'Not published',
    district.sampleLabel,
  ].join(' · ');
}

function ReadyAreaExplorer({
  model,
  naverMapClientId,
}: Readonly<{
  model: Extract<PublicAreaExploreModel, { status: 'ready' }>;
  naverMapClientId: string | null;
}>) {
  const router = useRouter();
  const initial: AreaExplorerState = Object.freeze({
    selectedSlug: model.selectedSlug,
    districtSlugs: Object.freeze(model.districts.map(({ slug }) => slug)),
  });
  const [state, dispatch] = useReducer(areaExplorerReducer, initial);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [visibleBuildingCount, setVisibleBuildingCount] = useState(10);
  const selected = model.districts.find(({ slug }) => slug === state.selectedSlug)
    ?? model.districts[0]!;
  const districtBuildings = model.buildingAvailability.status === 'ready'
    ? model.buildingAvailability.buildings.filter(({ districtSlug }) => districtSlug === selected.slug)
    : [];
  const neighborhoods = [...new Map(districtBuildings.map((building) => [
    building.neighborhoodId, building.neighborhoodName,
  ] as const))];
  const filteredBuildings = districtBuildings.filter((building) => (
    selectedNeighborhood === 'all' || building.neighborhoodId === selectedNeighborhood
  ));
  const visibleBuildings = filteredBuildings.slice(0, visibleBuildingCount);
  const selectedBuilding = districtBuildings.find(({ id }) => id === selectedBuildingId) ?? null;

  function selectDistrict(slug: string): void {
    dispatch({ type: 'select', slug });
    setSelectedNeighborhood('all');
    setSelectedBuildingId(null);
    setVisibleBuildingCount(10);
    router.replace(`/kr/seoul/explore/?district=${slug}`, { scroll: false });
  }

  return (
    <section className={styles.explorer} aria-labelledby="area-explorer-heading">
      <header className={styles.hero}>
        <p>Seoul · Verified district evidence</p>
        <h1 id="area-explorer-heading">Compare refundable jeonse deposits by district.</h1>
        <p>
          One official-data boundary, 25 districts and the same 45–55㎡ filter.
          Select a district to read its published evidence or explicit refusal.
        </p>
        <Link className={styles.rankingsLink} href="/kr/seoul/rankings/">
          View district rankings
        </Link>
      </header>

      <div className={styles.workspace}>
        <section className={styles.mapPanel} aria-labelledby="area-map-heading">
          <div className={styles.sectionHeading}>
            <p>01 / District map</p>
            <h2 id="area-map-heading">District median refundable jeonse deposit</h2>
          </div>
          <NaverDistrictMap
            key={`${selected.slug}:${selectedBuildingId ?? 'none'}`}
            clientId={naverMapClientId}
            districts={model.districts.map((district) => ({
              slug: district.slug,
              nameEn: district.nameEn,
              href: district.href,
              latitude: district.latitude,
              longitude: district.longitude,
            }))}
            selectedDistrict={selected}
            buildings={visibleBuildings.map((building) => ({
              id: building.id,
              title: building.name,
              href: building.href,
              addressQuery: `서울특별시 ${selected.nameKo} ${building.neighborhoodName} ${building.name}`,
              latitude: building.latitude,
              longitude: building.longitude,
            }))}
            onSelectDistrict={selectDistrict}
            onSelectBuilding={setSelectedBuildingId}
            fallback={<svg
              className={styles.map}
              viewBox="0 0 720 560"
              role="img"
              aria-labelledby="area-map-title area-map-description"
            >
            <title id="area-map-title">Seoul district refundable jeonse deposit map</title>
            <desc id="area-map-description">
              Five ranked median steps. Hatched districts are not published.
              The adjacent district table provides keyboard controls and exact values.
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
                <title>{mapTitle(district)}</title>
              </path>
            ))}
            </svg>}
          />

          <div className={styles.legend} aria-label="Map legend">
            <p>District median refundable jeonse deposit · {model.source.band}</p>
            <ol>
              {model.legend.map((bucket) => (
                <li key={bucket.bucket}>
                  <span className={bucketClasses[bucket.bucket]} aria-hidden="true" />
                  <span>{bucket.label} · {bucket.count} district{bucket.count === 1 ? '' : 's'}</span>
                </li>
              ))}
              <li>
                <span className={styles.legendHatch} aria-hidden="true" />
                <span>Not published · fewer than {model.source.publicationMinimum} contracts</span>
              </li>
            </ol>
          </div>

          <div className={styles.selectedDetail} aria-live="polite">
            <p className={styles.selectedLabel}>Selected · {selected.nameEn}</p>
            <DistrictEvidenceSummary
              key={selected.slug}
              model={selected.contractEvidence}
              mode="compact"
              selectionHref={`/kr/seoul/explore/?district=${selected.slug}`}
            />
          </div>
        </section>

        <section className={styles.rail} aria-labelledby="district-table-heading">
          <div className={styles.buildingBrowser} data-building-browser={selected.slug}>
            <div className={styles.sectionHeading}>
              <p>02 / Neighborhoods &amp; buildings</p>
              <h2>{selected.nameEn} building evidence</h2>
            </div>
            {model.buildingAvailability.status === 'not_loaded' ? (
              <div className={styles.buildingEmpty}>
                <strong>Verified building artifact is not loaded.</strong>
                <span>District evidence stays available while the building snapshot is installed.</span>
              </div>
            ) : districtBuildings.length === 0 ? (
              <div className={styles.buildingEmpty}>
                <strong>No building passes the five-contract publication rule here yet.</strong>
                <span>Nothing synthetic is substituted.</span>
              </div>
            ) : (
              <>
                <div className={styles.neighborhoods} aria-label="Neighborhood filter">
                  <button
                    type="button"
                    aria-pressed={selectedNeighborhood === 'all'}
                    onClick={() => { setSelectedNeighborhood('all'); setVisibleBuildingCount(10); }}
                  >All · {districtBuildings.length}</button>
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
                        onClick={() => setSelectedBuildingId(building.id)}
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
                  >Show 10 more buildings</button>
                ) : null}
                {selectedBuilding === null ? null : (
                  <BuildingEvidencePanel building={selectedBuilding} />
                )}
              </>
            )}
          </div>
          <div className={styles.sectionHeading}>
            <p>03 / Complete table</p>
            <h2 id="district-table-heading">All 25 districts</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>Seoul district evidence in legal-code order</caption>
              <thead>
                <tr>
                  <th scope="col">District</th>
                  <th scope="col">Median</th>
                  <th scope="col">Sample</th>
                  <th scope="col">Evidence</th>
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
                          aria-label={`Open ${district.nameEn} evidence`}
                          aria-current={isSelected ? 'true' : undefined}
                          onPointerEnter={() => dispatch({ type: 'select', slug: district.slug })}
                          onFocus={() => dispatch({ type: 'select', slug: district.slug })}
                          onClick={(event) => { event.preventDefault(); selectDistrict(district.slug); }}
                        >
                          <strong>{district.nameEn}</strong>
                          <span lang="ko">{district.nameKo}</span>
                          {isSelected ? <small>Selected</small> : null}
                        </Link>
                      </th>
                      <td>
                        <strong>{district.medianLabel ?? 'Not published'}</strong>
                        {district.changeLabel === null ? null : <small>{district.changeLabel}</small>}
                      </td>
                      <td>{district.sampleLabel}</td>
                      <td>
                        <Link
                          className={styles.detailLink}
                          href={district.href}
                          aria-label={`Open ${district.nameEn} evidence`}
                        >
                          Open
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

      <PublicSourceBoundary model={model.source} />
    </section>
  );
}

function groupEvidence(sample: string, median: string | null): string {
  return median === null ? `Not published · ${sample}` : `${median} · ${sample}`;
}

function BuildingEvidencePanel({ building }: Readonly<{ building: ExploreBuildingModel }>) {
  return (
    <article className={styles.buildingPanel} aria-live="polite" data-building-panel={building.id}>
      <p>Selected building</p>
      <h3>{building.name}</h3>
      <span>{building.neighborhoodName} · {building.sampleLabel}</span>
      <dl>
        <div><dt>All</dt><dd>{building.medianLabel}</dd></div>
        <div><dt>New</dt><dd>{groupEvidence(building.newSampleLabel, building.newMedianLabel)}</dd></div>
        <div><dt>Renewal</dt><dd>{groupEvidence(building.renewalSampleLabel, building.renewalMedianLabel)}</dd></div>
        <div><dt>Unclassified</dt><dd>{building.unknownContractCount}</dd></div>
      </dl>
      <Link href={building.href}>Open full building evidence</Link>
    </article>
  );
}

function UnavailableAreaExplorer({
  model,
}: Readonly<{ model: Extract<PublicAreaExploreModel, { status: 'unavailable' }> }>) {
  return (
    <section className={styles.explorer} aria-labelledby="area-unavailable-heading">
      <header className={styles.hero}>
        <p>Seoul · District evidence</p>
        <h1 id="area-unavailable-heading">{model.message}</h1>
        <p>The verified district artifact failed closed. No district money is substituted.</p>
      </header>
      <div className={styles.unavailableFrame} data-map-state="unavailable">
        <p>Verified evidence is required before this map can publish figures.</p>
        <Link className={styles.selectedLink} href="/kr/seoul/">Return to Seoul evidence</Link>
      </div>
      <PublicSourceBoundary model={model.source} />
    </section>
  );
}

export function AreaExplorer({
  model,
  naverMapClientId = null,
}: Readonly<{
  model: PublicAreaExploreModel;
  naverMapClientId?: string | null;
}>) {
  return (
    <>
      <PublicSectionTabs current="explore" />
      {model.status === 'ready'
        ? <ReadyAreaExplorer model={model} naverMapClientId={naverMapClientId} />
        : <UnavailableAreaExplorer model={model} />}
    </>
  );
}
