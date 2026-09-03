import { getPublicMarketConfig } from '@signedprice/market-core';
import Link from 'next/link';

import type { ExploreBuildingModel, ExploreDistrictModel, PublicDistrictModel, PublicSourceBoundaryModel } from '../../lib/public-market/area-route-types';
import type { PublicPropertyTypeIdentity } from '../../lib/public-market/property-type-route-types';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { CommunitySignal } from '../community/community-signal';
import { EvidenceSectionHeading } from '../evidence-ui/section-heading';
import { DetailNewsList } from '../news/detail-news-list';
import { EvidenceEmptyStatePanel } from '../trust/evidence-empty-state';
import { BoxPlot } from './box-plot';
import styles from './district-page.module.css';
import { DistrictEvidenceSummary } from './district-evidence-summary';
import { EvidencePeriodStrip } from './evidence-period-strip';
import { QuoteInput } from './quote-input';
import { SampleChip } from './sample-chip';
import { PublicSourceBoundary } from './public-source-boundary';
import { NaverDistrictMap, type NaverDistrictMapPoint } from '../maps/naver-district-map';

const config = getPublicMarketConfig('kr-seoul');
const money = new Intl.NumberFormat(config.formatLocale, {
  style: 'currency',
  currency: config.currencyCode,
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

function headerFor(model: PublicDistrictModel): SiteHeaderModel {
  return {
    brand: 'signedprice',
    homeLabel: 'signedprice home',
    navigationLabel: `${model.identity.nameEn} evidence navigation`,
    marketLabel: 'Seoul',
    languageLabel: 'EN',
    languageSwitch: {
      label: '한국어',
      href: `/ko/kr/seoul/explore/${model.identity.slug}/`,
      hrefLang: 'ko',
    },
    links: [
      { label: 'Global home', href: '/' },
      { label: 'Seoul market', href: '/kr/seoul/' },
      { label: 'District Explorer', href: '/kr/seoul/explore/' },
    ],
  };
}

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul reported-sale and rent evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District Explorer', href: '/kr/seoul/explore/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

function safeJson(value: Readonly<Record<string, unknown>>): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function DistrictNavigation({ model }: Readonly<{ model: PublicDistrictModel }>) {
  const exploreHref = `/kr/seoul/explore/?district=${model.identity.slug}`;
  return (
    <nav className={styles.navigation} aria-label="District evidence navigation">
      <div className={styles.primaryLinks}>
        <Link href="/kr/seoul/check/">
          Compare a contract
        </Link>
        <Link className={styles.exploreLink} href={exploreHref}>
          Back to Seoul map
        </Link>
        <Link className={styles.rankingsLink} href="/kr/seoul/rankings/">
          View district rankings
        </Link>
      </div>
      <div className={styles.nearby}>
        <p>Nearby districts</p>
        {model.nearby.map((district) => (
          <Link href={`/kr/seoul/explore/${district.slug}/`} key={district.slug}>
            <strong>{district.nameEn}</strong>
            <span lang="ko">{district.nameKo}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Breadcrumb({ model }: Readonly<{ model: PublicDistrictModel }>) {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      <ol>
        <li><Link href="/kr/seoul/explore/">Explore</Link></li>
        <li aria-current="page">{model.identity.nameEn}</li>
      </ol>
    </nav>
  );
}

function BuildingEvidence({ model, buildings = [] }: Readonly<{
  model: PublicDistrictModel;
  buildings?: readonly ExploreBuildingModel[];
}>) {
  return (
    <section
      className={styles.buildingEvidence}
      aria-labelledby="building-evidence-heading"
      data-section="district-buildings"
    >
      <EvidenceSectionHeading
        eyebrow="04 / Building evidence"
        title={`Verified buildings in ${model.identity.nameEn}`}
        id="building-evidence-heading"
      />
      {buildings.length > 0 ? (
        <ul className={styles.buildingList}>
          {buildings.slice(0, 20).map((building) => (
            <li key={building.id}>
              <Link href={building.href}>
                <strong>{building.name}</strong>
                <span>{building.neighborhoodName} · {building.housingType} · {building.medianLabel ?? 'Not published'} · {building.sampleLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : model.buildingAvailability.status === 'ready' ? (
        <ul className={styles.buildingList}>
          {model.buildingAvailability.buildings.map((building) => (
            <li key={building.id}>
              <Link href={building.href}>
                <strong>{building.name}</strong>
                <span>{building.housingType} · {building.sampleLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EvidenceEmptyStatePanel state={model.buildingAvailability.empty} />
      )}
      <Link className={styles.correctionLink} href="/kr/seoul/corrections/">
        Review Seoul evidence corrections
      </Link>
    </section>
  );
}

function PropertyTypeEvidence({
  model,
  propertyTypes,
}: Readonly<{
  model: PublicDistrictModel;
  propertyTypes: readonly PublicPropertyTypeIdentity[];
}>) {
  if (propertyTypes.length === 0) return null;
  return (
    <section className={styles.propertyTypeEvidence} aria-labelledby="property-type-evidence-heading">
      <EvidenceSectionHeading
        eyebrow="Property type evidence"
        title="Published evidence by home type"
        id="property-type-evidence-heading"
      />
      <ul className={styles.propertyTypeList}>
        {propertyTypes.map((propertyType) => (
          <li key={propertyType.slug}>
            <a href={`/kr/seoul/explore/${model.identity.slug}/${propertyType.slug}/`}>
              {propertyType.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Faq({ model }: Readonly<{
  model: Extract<PublicDistrictModel, { status: 'published' | 'withheld' }>;
}>) {
  return (
    <section className={styles.faq} aria-labelledby="district-faq-heading">
      <EvidenceSectionHeading
        eyebrow="03 / Computed FAQ"
        title="Questions answered from this district summary."
        id="district-faq-heading"
      />
      <div className={styles.faqGrid}>
        {model.faq.map(({ question, answer }) => (
          <article key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Finding({
  model,
  mapPoint,
  mapDistricts,
  naverMapClientId,
}: Readonly<{
  model: PublicDistrictModel;
  mapPoint?: Readonly<{ latitude: number; longitude: number }>;
  mapDistricts: readonly NaverDistrictMapPoint[];
  naverMapClientId: string | null;
}>) {
  const map = mapPoint === undefined || naverMapClientId === null ? (
    <div className={styles.mapFallback}><strong>{model.identity.nameEn}</strong><span>District map unavailable</span></div>
  ) : (
    <NaverDistrictMap
      clientId={naverMapClientId}
      districts={mapDistricts}
      selectedDistrict={mapPoint}
      fallback={<div className={styles.mapFallback}><strong>{model.identity.nameEn}</strong><span>Loading verified district map</span></div>}
    />
  );
  if (model.status === 'unavailable') {
    return (
      <header
        className={styles.hero}
        data-section="district-summary"
        data-detail-hero="district"
      >
        <div className={styles.heroCopy}>
          <p>Seoul · {model.identity.nameKo}</p>
          <h1>{model.identity.nameEn} District</h1>
          <p>{model.message}. No city figure is substituted for unavailable district evidence.</p>
        </div>
        <div className={styles.heroMap}>{map}</div>
      </header>
    );
  }
  return (
    <header
      className={styles.hero}
      data-section="district-summary"
      data-detail-hero="district"
    >
        <div className={styles.heroCopy}>
          <p>Seoul · <span lang="ko">{model.identity.nameKo}</span></p>
          <h1>{model.identity.nameEn} District</h1>
          <p>Official reported-contract evidence for the declared period.</p>
        </div>
      <div className={styles.heroMap}>{map}</div>
    </header>
  );
}

function DistrictMetrics({ model, currentDistrict }: Readonly<{
  model: PublicDistrictModel;
  currentDistrict?: ExploreDistrictModel;
}>) {
  const metrics = currentDistrict !== undefined ? [
    ['Median sale price', currentDistrict.medianLabel ?? 'Not published', currentDistrict.sampleLabel],
    ['Reported sales', currentDistrict.summary.n.toLocaleString('en-US'), 'Selected reported-sale cohort'],
    ['Price per ㎡', 'Not verified', 'No compatible district-level denominator attached'],
    ['Recent change', currentDistrict.changeLabel ?? 'Not assessable', 'Comparison counts must remain compatible'],
  ] : model.status === 'unavailable' ? [
    ['Evidence status', 'Unavailable', 'No city value substituted'],
    ['Sample', 'Unavailable', 'Verified district evidence required'],
    ['Period', 'Unavailable', 'No current release'],
    ['Publication', 'Withheld', 'Fail-closed display'],
  ] : [
    ['Median deposit', model.status === 'published' ? model.display.medianLabel : 'Not published', model.display.sampleLabel],
    ['Middle half', model.status === 'published' ? model.display.middleHalfLabel : 'Not published', 'Comparable district distribution'],
    ['Full range', model.status === 'published' ? model.display.rangeLabel : 'Not published', 'Official reported contracts'],
    ['Evidence period', model.source.period, model.period.caveat ?? 'Declared reporting period'],
  ];
  return <section className={styles.metricGrid} aria-label="District summary metrics">{metrics.map(([label, value, detail], index) => <article key={label} data-detail-hero-metric={index === 0 ? model.status === 'published' ? 'median' : 'status' : undefined}><span>{label}</span><strong>{value}</strong>{index === 0 && model.status !== 'unavailable' ? <SampleChip label={model.display.sampleLabel} state={model.status} /> : <small>{detail}</small>}</article>)}</section>;
}

function DistrictDecisionSections({
  model,
  comparisonDistricts,
  buildings,
}: Readonly<{
  model: PublicDistrictModel;
  comparisonDistricts: readonly ExploreDistrictModel[];
  buildings: readonly ExploreBuildingModel[];
}>) {
  const nearby = new Set(model.nearby.map((district) => district.slug));
  const nearbyRows = comparisonDistricts.filter((district) => nearby.has(district.slug));
  return <div className={styles.decisionSections}>
    <section aria-labelledby="district-neighbourhood-heading">
      <EvidenceSectionHeading eyebrow="Neighbourhood and buildings" title="Local comparison" id="district-neighbourhood-heading" />
      <div className={styles.comparisonGrid}>
        <article><span>Neighbourhood comparison</span><strong>Not verified</strong><p>A compatible neighbourhood aggregate is not attached, so district values are not copied into neighbourhood rows.</p></article>
        <article><span>Leading verified buildings</span><strong>{buildings.length.toLocaleString('en-US')}</strong><p>Buildings connected to the selected sale cohort and identity inventory.</p></article>
        <article><span>New / renewal</span><strong>Not applicable to sale</strong><p>New and renewal cohorts remain available only for rent contracts.</p></article>
      </div>
      {buildings.length === 0 ? null : <div className={styles.compactTable}><table><thead><tr><th>Building</th><th>Neighbourhood</th><th>Median sale</th><th>Filings</th></tr></thead><tbody>{buildings.slice(0, 12).map((building) => <tr key={building.id}><th><Link href={building.href}>{building.name}</Link></th><td>{building.neighborhoodName}</td><td>{building.medianLabel ?? '—'}</td><td>{building.observationCount}</td></tr>)}</tbody></table></div>}
    </section>
    <section aria-labelledby="district-market-structure-heading">
      <EvidenceSectionHeading eyebrow="District structure" title="Volume, size and nearby context" id="district-market-structure-heading" />
      <div className={styles.comparisonGrid}>
        <article><span>Monthly filing volume</span><strong>Not verified</strong><p>The current artifact stores a period total, not a month-by-month district series.</p></article>
        <article><span>Price by home size</span><strong>Use the size filter</strong><p>Each area cohort is recalculated from compatible reported sales; empty cohorts remain hidden.</p></article>
        <article><span>Housing composition</span><strong>Not verified</strong><p>No district housing-stock denominator is connected to this release.</p></article>
      </div>
      {nearbyRows.length === 0 ? null : <div className={styles.nearbyComparison}>{nearbyRows.map((district) => <Link href={district.href} key={district.slug}><span>{district.nameEn}</span><strong>{district.medianLabel ?? 'Not published'}</strong><small>{district.sampleLabel}</small></Link>)}</div>}
    </section>
    <section aria-labelledby="district-future-heading">
      <EvidenceSectionHeading eyebrow="Population and supply" title="Verified only when an official identity is attached" id="district-future-heading" />
      <div className={styles.comparisonGrid}>
        <article><span>Move-in / move-out</span><strong>Not verified</strong><p>No compatible migration release is attached.</p></article>
        <article><span>Scheduled completions</span><strong>Not verified</strong><p>Future supply opens only after official project identifiers are matched.</p></article>
        <article><span>Corrections</span><strong>Ledger available</strong><p>Collection state, source dates and correction history stay separate from price findings.</p><Link href="/kr/seoul/corrections/">Open correction ledger</Link></article>
      </div>
    </section>
  </div>;
}

function Evidence({ model }: Readonly<{ model: PublicDistrictModel }>) {
  if (model.status === 'unavailable') {
    return (
      <section
        className={styles.unavailable}
        aria-label="District evidence unavailable"
        data-section="district-distribution"
      >
        <p>Verified district evidence is required before any monetary finding can be shown.</p>
      </section>
    );
  }
  return (
    <section
      className={styles.evidence}
      aria-labelledby="district-evidence-heading"
      data-section="district-distribution"
    >
      <EvidenceSectionHeading
        eyebrow="01 / District finding"
        title={model.status === 'published' ? 'Published distribution' : 'Distribution not published'}
        id="district-evidence-heading"
      />
      {model.status === 'published' ? (
        <>
          <EvidencePeriodStrip model={model.period} label="District evidence period" />
          <dl className={styles.findingGrid}>
            <div><dt>Median</dt><dd>{model.display.medianLabel}</dd></div>
            <div><dt>Middle half</dt><dd>{model.display.middleHalfLabel}</dd></div>
            <div><dt>Full range</dt><dd>{model.display.rangeLabel}</dd></div>
            {model.display.spread === null ? null : (
              <div>
                <dt>Spread interpretation</dt>
                <dd>
                  <strong>{model.display.spread.label}</strong>
                  <span>{model.display.spread.explanation}</span>
                </dd>
              </div>
            )}
            {model.display.change === null ? null : (
              <div>
                <dt>Recent change</dt>
                <dd>
                  <strong>{model.display.change.label}</strong>
                  {model.display.change.reasons.map((reason) => <span key={reason}>{reason}</span>)}
                </dd>
              </div>
            )}
          </dl>
          <div className={styles.quoteBlock}>
            <EvidenceSectionHeading
              eyebrow="02 / Local quote"
              title="Compare one refundable deposit locally."
            />
            <QuoteInput
              config={config}
              summary={model.summary}
              areaLabel={`${model.identity.nameEn} (${model.identity.nameKo})`}
              showMedianFaq
            />
          </div>
        </>
      ) : (
        <BoxPlot
          summary={model.summary}
          axis={config.axis}
          formatValue={(value) => money.format(value)}
        />
      )}
    </section>
  );
}

function ExactSaleEvidence({ district }: Readonly<{ district: ExploreDistrictModel }>) {
  return (
    <section className={styles.evidence} aria-labelledby="district-sale-evidence-heading" data-section="district-distribution">
      <EvidenceSectionHeading eyebrow="01 / Sale distribution" title={district.summary.published ? 'Reported sale price range' : 'Sale distribution not published'} id="district-sale-evidence-heading" />
      <p className={styles.exactEvidenceNote}>The range below uses the same sale cohort selected in Explore. No jeonse or monthly-rent values are mixed into this section.</p>
      <BoxPlot summary={district.summary} axis={config.axis} formatValue={(value) => money.format(value)} />
    </section>
  );
}

export function DistrictDetailPage({
  model,
  propertyTypes = [],
  mapDistricts = [],
  mapPoint,
  naverMapClientId = null,
  currentDistrict,
  comparisonDistricts = [],
  exploreBuildings = [],
  exactSource,
}: Readonly<{
  model: PublicDistrictModel;
  propertyTypes?: readonly PublicPropertyTypeIdentity[];
  mapDistricts?: readonly NaverDistrictMapPoint[];
  mapPoint?: Readonly<{ latitude: number; longitude: number }>;
  naverMapClientId?: string | null;
  currentDistrict?: ExploreDistrictModel;
  comparisonDistricts?: readonly ExploreDistrictModel[];
  exploreBuildings?: readonly ExploreBuildingModel[];
  exactSource?: PublicSourceBoundaryModel;
}>) {
  return (
    <div id="top" className={styles.page} data-district-detail={model.status}>
      <SiteHeader copy={headerFor(model)} />
      <main className={styles.main}>
        <div className={styles.detailLayout} data-detail-layout="evidence-rail">
          <div className={styles.detailMain} data-detail-main="true">
            <Breadcrumb model={model} />
            <Finding model={model} mapDistricts={mapDistricts} mapPoint={mapPoint} naverMapClientId={naverMapClientId} />
            <nav className={styles.tabs} aria-label="District page sections"><a href="#overview">Overview</a><a href="#distribution">Distribution</a><a href="#buildings">Buildings</a><a href="#home-types">Home types</a><a href="#source">Source</a></nav>
            <div id="overview"><DistrictMetrics model={model} currentDistrict={currentDistrict} /></div>
            <div id="distribution">
            {currentDistrict === undefined ? <Evidence model={model} /> : <ExactSaleEvidence district={currentDistrict} />}
            </div>
            {currentDistrict === undefined ? <div className={styles.cohortEvidence} data-section="district-cohorts">
              <DistrictEvidenceSummary model={model.contractEvidence} mode="full" />
            </div> : null}
            <div id="home-types"><PropertyTypeEvidence model={model} propertyTypes={propertyTypes} /></div>
            <div id="buildings"><BuildingEvidence model={model} buildings={exploreBuildings} /></div>
            <DistrictDecisionSections model={model} comparisonDistricts={comparisonDistricts} buildings={exploreBuildings} />
            {model.status === 'unavailable' || currentDistrict !== undefined ? null : <Faq model={model} />}
            <div className={styles.sourceBoundary} data-section="district-source" id="source">
              <PublicSourceBoundary model={exactSource ?? model.source} transaction={currentDistrict === undefined ? undefined : 'sale'} />
            </div>
          </div>
          <aside className={styles.detailRail} data-detail-rail="true" aria-label="District context">
            <DetailNewsList news={model.news} />
            <CommunitySignal model={model.communitySignal} />
            <DistrictNavigation model={model} />
          </aside>
        </div>
      </main>
      {model.status === 'unavailable' ? null : (
        <>
          <script
            type="application/ld+json"
            data-structured-data="dataset"
            dangerouslySetInnerHTML={{ __html: safeJson(model.datasetJsonLd) }}
          />
          <script
            type="application/ld+json"
            data-structured-data="faq"
            dangerouslySetInnerHTML={{ __html: safeJson(model.faqJsonLd) }}
          />
        </>
      )}
      <SiteFooter copy={footer} />
    </div>
  );
}
