import { getPublicMarketConfig } from '@signedprice/market-core';
import Link from 'next/link';

import type { PublicDistrictModel } from '../../lib/public-market/area-route-types';
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
import styles from './district-detail.module.css';
import { DistrictEvidenceSummary } from './district-evidence-summary';
import { EvidencePeriodStrip } from './evidence-period-strip';
import { QuoteInput } from './quote-input';
import { SampleChip } from './sample-chip';
import { PublicSourceBoundary } from './public-source-boundary';

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
    links: [
      { label: 'Global home', href: '/' },
      { label: 'Seoul market', href: '/kr/seoul/' },
      { label: 'District Explorer', href: '/kr/seoul/explore/' },
    ],
  };
}

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul jeonse-deposit evidence, with publication limits shown.',
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

function BuildingEvidence({ model }: Readonly<{ model: PublicDistrictModel }>) {
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
      {model.buildingAvailability.status === 'ready' ? (
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

function Finding({ model }: Readonly<{ model: PublicDistrictModel }>) {
  if (model.status === 'unavailable') {
    return (
      <header
        className={styles.hero}
        data-section="district-summary"
        data-detail-hero="district"
      >
        <div className={styles.heroCopy}>
          <p>Seoul · {model.identity.nameKo}</p>
          <h1>{model.identity.nameEn}</h1>
          <p>{model.message}. No city figure is substituted for unavailable district evidence.</p>
        </div>
        <div className={styles.heroMetric} data-detail-hero-metric="status">
          <span>Evidence status</span>
          <strong>Unavailable</strong>
        </div>
      </header>
    );
  }
  const finding = model.status === 'published' ? model.display.medianLabel : 'Not published';
  return (
    <header
      className={styles.hero}
      data-section="district-summary"
      data-detail-hero="district"
    >
      <div className={styles.heroCopy}>
        <p>Seoul · <span lang="ko">{model.identity.nameKo}</span></p>
        <h1>{model.identity.nameEn}</h1>
        <p>Official reported-contract evidence for the declared period.</p>
      </div>
      <div
        className={styles.heroMetric}
        data-detail-hero-metric={model.status === 'published' ? 'median' : 'status'}
      >
        <span>Median refundable deposit</span>
        <strong>{finding}</strong>
        <SampleChip label={model.display.sampleLabel} state={model.status} />
      </div>
    </header>
  );
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

export function DistrictDetailPage({
  model,
  propertyTypes = [],
}: Readonly<{
  model: PublicDistrictModel;
  propertyTypes?: readonly PublicPropertyTypeIdentity[];
}>) {
  return (
    <div id="top" className={styles.page} data-district-detail={model.status}>
      <SiteHeader copy={headerFor(model)} />
      <main className={styles.main}>
        <div className={styles.detailLayout} data-detail-layout="evidence-rail">
          <div className={styles.detailMain} data-detail-main="true">
            <Breadcrumb model={model} />
            <Finding model={model} />
            <Evidence model={model} />
            <div className={styles.cohortEvidence} data-section="district-cohorts">
              <DistrictEvidenceSummary model={model.contractEvidence} mode="full" />
            </div>
            <PropertyTypeEvidence model={model} propertyTypes={propertyTypes} />
            <BuildingEvidence model={model} />
            {model.status === 'unavailable' ? null : <Faq model={model} />}
            <div className={styles.sourceBoundary} data-section="district-source">
              <PublicSourceBoundary model={model.source} />
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
