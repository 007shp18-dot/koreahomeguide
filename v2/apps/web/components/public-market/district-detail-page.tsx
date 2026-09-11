import { districtFaq, districtText } from '../../lib/locale/seoul-district-copy';
import { marketHref } from '../../lib/locale/market-localization';
import { localizeSampleLabel, localizeEvidenceMessage, type ProductLocale } from '../../lib/locale/product-copy';
import { getPublicMarketConfig } from '@signedprice/market-core';
import Link from 'next/link';

import type { ExploreBuildingModel, ExploreDistrictModel, PublicDistrictModel, PublicSourceBoundaryModel } from '../../lib/public-market/area-route-types';
import type { PublicPropertyTypeIdentity } from '../../lib/public-market/property-type-route-types';
import type { KoreaNeighborhoodDirectoryEntry } from '../../lib/public-market/korea-building-index-policy';
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
import { NeighborhoodDirectory } from './neighborhood-directory';

const config = getPublicMarketConfig('kr-seoul');
const money = new Intl.NumberFormat(config.formatLocale, {
  style: 'currency',
  currency: config.currencyCode,
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

function headerFor(model: PublicDistrictModel, locale: ProductLocale): SiteHeaderModel {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
  return {
    brand: 'signedprice',
    homeLabel: 'signedprice home',
    navigationLabel: `${model.identity.nameEn} evidence navigation`,
    marketLabel: t('Seoul'),
    languageLabel: locale === 'en' ? 'EN' : locale === 'ko' ? 'KO' : '中文',
    languageSwitch: {
      label: '한국어',
      href: `/ko/kr/seoul/explore/${model.identity.slug}/`,
      hrefLang: 'ko',
    },
    links: [
      { label: t('Global home'), href: `${prefix}/` },
      { label: t('Seoul market'), href: `${prefix}/kr/seoul/` },
      { label: t('District Explorer'), href: `${prefix}/kr/seoul/explore/` },
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

function DistrictNavigation({ locale = 'en', model }: Readonly<{ locale?: ProductLocale; model: PublicDistrictModel }>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  const href = (value: string) => marketHref(locale, value);
  const exploreHref = `/kr/seoul/explore/?district=${model.identity.slug}`;
  return (
    <nav className={styles.navigation} aria-label={t("District evidence navigation")}>
      <div className={styles.primaryLinks}>
        <Link href={href("/kr/seoul/check/")}>{t("Compare a contract")}</Link>
        <Link className={styles.exploreLink} href={href(exploreHref)}>{t("Back to Seoul map")}</Link>
        <Link className={styles.rankingsLink} href={href("/kr/seoul/rankings/")}>{t("View district rankings")}</Link>
      </div>
      <div className={styles.nearby}>
        <p>{t("Nearby districts")}</p>
        {model.nearby.map((district) => (
          <Link href={href(`/kr/seoul/explore/${district.slug}/`)} key={district.slug}>
            <strong>{locale === 'en' ? district.nameEn : district.nameKo}</strong>
            <span lang="ko">{district.nameKo}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Breadcrumb({ locale = 'en', model }: Readonly<{ locale?: ProductLocale; model: PublicDistrictModel }>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  const href = (value: string) => marketHref(locale, value);
  return (
    <nav className={styles.breadcrumb} aria-label={t("Breadcrumb")}>
      <ol>
        <li><Link href={href("/kr/seoul/explore/")}>{t("Explore")}</Link></li>
        <li aria-current="page">{locale === 'en' ? model.identity.nameEn : model.identity.nameKo}</li>
      </ol>
    </nav>
  );
}

function BuildingEvidence({ locale = 'en', model, buildings = [] }: Readonly<{ locale?: ProductLocale;
  model: PublicDistrictModel;
  buildings?: readonly ExploreBuildingModel[];
}>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  const href = (value: string) => marketHref(locale, value);
  return (
    <section
      className={styles.buildingEvidence}
      aria-labelledby="building-evidence-heading"
      data-section="district-buildings"
    >
      <EvidenceSectionHeading
        eyebrow={t("04 / Building evidence")}
        title={locale === 'ko' ? `${model.identity.nameKo} 확인된 건물` : locale === 'zh-CN' ? `${model.identity.nameKo}已核验楼盘` : `Verified buildings in ${model.identity.nameEn}`}
        id="building-evidence-heading"
      />
      {buildings.length > 0 ? (
        <ul className={styles.buildingList}>
          {buildings.slice(0, 20).map((building) => (
            <li key={building.id}>
              <Link href={href(building.href)}>
                <strong>{building.name}</strong>
                <span>{building.neighborhoodName} · {t(building.housingType)} · {building.medianLabel ?? t('Not published')} · {localizeSampleLabel(building.sampleLabel, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : model.buildingAvailability.status === 'ready' ? (
        <ul className={styles.buildingList}>
          {model.buildingAvailability.buildings.map((building) => (
            <li key={building.id}>
              <Link href={href(building.href)}>
                <strong>{building.name}</strong>
                <span>{t(building.housingType)} · {localizeSampleLabel(building.sampleLabel, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EvidenceEmptyStatePanel state={{ ...model.buildingAvailability.empty, title: t(model.buildingAvailability.empty.title), reason: t(model.buildingAvailability.empty.reason), nextAction: t(model.buildingAvailability.empty.nextAction) }} />
      )}
      <Link className={styles.correctionLink} href={href("/kr/seoul/corrections/")}>{t("Review Seoul evidence corrections")}</Link>
    </section>
  );
}

function PropertyTypeEvidence({ locale = 'en',
  model,
  propertyTypes,
}: Readonly<{ locale?: ProductLocale;
  model: PublicDistrictModel;
  propertyTypes: readonly PublicPropertyTypeIdentity[];
}>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  const href = (value: string) => marketHref(locale, value);
  if (propertyTypes.length === 0) return null;
  return (
    <section className={styles.propertyTypeEvidence} aria-labelledby="property-type-evidence-heading">
      <EvidenceSectionHeading
        eyebrow={t("Property type evidence")}
        title={t("Published evidence by home type")}
        id="property-type-evidence-heading"
      />
      <ul className={styles.propertyTypeList}>
        {propertyTypes.map((propertyType) => (
          <li key={propertyType.slug}>
            <a href={href(`/kr/seoul/explore/${model.identity.slug}/${propertyType.slug}/`)}>
              {t(propertyType.label)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Faq({ locale = 'en', model }: Readonly<{ locale?: ProductLocale;
  model: Extract<PublicDistrictModel, { status: 'published' | 'withheld' }>;
}>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  return (
    <section className={styles.faq} aria-labelledby="district-faq-heading">
      <EvidenceSectionHeading
        eyebrow={t("03 / Computed FAQ")}
        title={t("Questions answered from this district summary.")}
        id="district-faq-heading"
      />
      <div className={styles.faqGrid}>
        {districtFaq(locale, model).map(({ question, answer }) => (
          <article key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Finding({ locale = 'en',
  model,
  mapPoint,
  mapDistricts,
  naverMapClientId,
}: Readonly<{ locale?: ProductLocale;
  model: PublicDistrictModel;
  mapPoint?: Readonly<{ latitude: number; longitude: number }>;
  mapDistricts: readonly NaverDistrictMapPoint[];
  naverMapClientId: string | null;
}>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  const map = mapPoint === undefined || naverMapClientId === null ? (
    <div className={styles.mapFallback}><strong>{model.identity.nameEn}</strong><span>{t("District map unavailable")}</span></div>
  ) : (
    <NaverDistrictMap locale={locale}
      clientId={naverMapClientId}
      districts={mapDistricts}
      selectedDistrict={mapPoint}
      fallback={<div className={styles.mapFallback}><strong>{model.identity.nameEn}</strong><span>{t("Loading verified district map")}</span></div>}
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
          <p>{t("Seoul")} · {model.identity.nameKo}</p>
          <h1><span>{locale === 'en' ? model.identity.nameEn : model.identity.nameKo}</span>{' '}<span>{t("District")}</span></h1>
          <p>{t(model.message)}. {locale === 'ko' ? '지역 자료가 없을 때 서울 전체 값으로 대체하지 않습니다.' : locale === 'zh-CN' ? '地区数据缺失时不以全市数据替代。' : 'No city figure is substituted for unavailable district evidence.'}</p>
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
          <p>{t("Seoul \u00b7")}<span lang="ko">{model.identity.nameKo}</span></p>
      <h1><span>{locale === 'en' ? model.identity.nameEn : model.identity.nameKo}</span>{' '}<span>{t("District")}</span></h1>
          <p>{t("Official reported-contract evidence for the declared period.")}</p>
        </div>
      <div className={styles.heroMap}>{map}</div>
    </header>
  );
}

function DistrictMetrics({ locale = 'en', model, currentDistrict }: Readonly<{ locale?: ProductLocale;
  model: PublicDistrictModel;
  currentDistrict?: ExploreDistrictModel;
}>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
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
  return <section className={styles.metricGrid} aria-label={t("District summary metrics")}>{metrics.map(([label, value, detail], index) => <article key={label} data-detail-hero-metric={index === 0 ? model.status === 'published' ? 'median' : 'status' : undefined}><span>{t(label)}</span><strong>{t(value)}</strong>{index === 0 && model.status !== 'unavailable' ? <SampleChip label={localizeSampleLabel(model.display.sampleLabel, locale)} state={model.status} /> : <small>{t(detail)}</small>}</article>)}</section>;
}

function DistrictDecisionSections({ locale = 'en',
  model,
  comparisonDistricts,
  buildings,
}: Readonly<{ locale?: ProductLocale;
  model: PublicDistrictModel;
  comparisonDistricts: readonly ExploreDistrictModel[];
  buildings: readonly ExploreBuildingModel[];
}>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  const href = (value: string) => marketHref(locale, value);
  const nearby = new Set(model.nearby.map((district) => district.slug));
  const nearbyRows = comparisonDistricts.filter((district) => nearby.has(district.slug));
  return <div className={styles.decisionSections}>
    <section aria-labelledby="district-neighbourhood-heading">
      <EvidenceSectionHeading eyebrow={t("Neighbourhood and buildings")} title={t("Local comparison")} id="district-neighbourhood-heading" />
      <div className={styles.comparisonGrid}>
        <article><span>{t("Neighbourhood comparison")}</span><strong>{t("Not verified")}</strong><p>{t("A compatible neighbourhood aggregate is not attached, so district values are not copied into neighbourhood rows.")}</p></article>
        <article><span>{t("Leading verified buildings")}</span><strong>{buildings.length.toLocaleString('en-US')}</strong><p>{t("Buildings connected to the selected sale cohort and identity inventory.")}</p></article>
        <article><span>{t("New / renewal")}</span><strong>{t("Not applicable to sale")}</strong><p>{t("New and renewal cohorts remain available only for rent contracts.")}</p></article>
      </div>
      {buildings.length === 0 ? null : <div className={styles.compactTable}><table><thead><tr><th>{t("Building")}</th><th>{t("Neighbourhood")}</th><th>{t("Median sale")}</th><th>{t("Filings")}</th></tr></thead><tbody>{buildings.slice(0, 12).map((building) => <tr key={building.id}><th><Link href={href(building.href)}>{building.name}</Link></th><td>{building.neighborhoodName}</td><td>{building.medianLabel ?? '—'}</td><td>{building.observationCount}</td></tr>)}</tbody></table></div>}
    </section>
    <section aria-labelledby="district-market-structure-heading">
      <EvidenceSectionHeading eyebrow={t("District structure")} title={t("Volume, size and nearby context")} id="district-market-structure-heading" />
      <div className={styles.comparisonGrid}>
        <article><span>{t("Monthly filing volume")}</span><strong>{t("Not verified")}</strong><p>{t("The current artifact stores a period total, not a month-by-month district series.")}</p></article>
        <article><span>{t("Price by home size")}</span><strong>{t("Use the size filter")}</strong><p>{t("Each area cohort is recalculated from compatible reported sales; empty cohorts remain hidden.")}</p></article>
        <article><span>{t("Housing composition")}</span><strong>{t("Not verified")}</strong><p>{t("No district housing-stock denominator is connected to this release.")}</p></article>
      </div>
      {nearbyRows.length === 0 ? null : <div className={styles.nearbyComparison}>{nearbyRows.map((district) => <Link href={href(district.href)} key={district.slug}><span>{district.nameEn}</span><strong>{district.medianLabel ?? t('Not published')}</strong><small>{localizeSampleLabel(district.sampleLabel, locale)}</small></Link>)}</div>}
    </section>
    <section aria-labelledby="district-future-heading">
      <EvidenceSectionHeading eyebrow={t("Population and supply")} title={t("Verified only when an official identity is attached")} id="district-future-heading" />
      <div className={styles.comparisonGrid}>
        <article><span>{t("Move-in / move-out")}</span><strong>{t("Not verified")}</strong><p>{t("No compatible migration release is attached.")}</p></article>
        <article><span>{t("Scheduled completions")}</span><strong>{t("Not verified")}</strong><p>{t("Future supply opens only after official project identifiers are matched.")}</p></article>
        <article><span>{t("Corrections")}</span><strong>{t("Ledger available")}</strong><p>{t("Collection state, source dates and correction history stay separate from price findings.")}</p><Link href={href("/kr/seoul/corrections/")}>{t("Open correction ledger")}</Link></article>
      </div>
    </section>
  </div>;
}

function Evidence({ locale = 'en', model }: Readonly<{ locale?: ProductLocale; model: PublicDistrictModel }>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  if (model.status === 'unavailable') {
    return (
      <section
        className={styles.unavailable}
        aria-label={t("District evidence unavailable")}
        data-section="district-distribution"
      >
        <p>{t("Verified district evidence is required before any monetary finding can be shown.")}</p>
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
        eyebrow={t("01 / District finding")}
        title={t(model.status === 'published' ? 'Published distribution' : 'Distribution not published')}
        id="district-evidence-heading"
      />
      {model.status === 'published' ? (
        <>
          <EvidencePeriodStrip locale={locale} model={model.period} label={t("District evidence period")} />
          <dl className={styles.findingGrid}>
            <div><dt>{t("Median")}</dt><dd>{model.display.medianLabel}</dd></div>
            <div><dt>{t("Middle half")}</dt><dd>{model.display.middleHalfLabel}</dd></div>
            <div><dt>{t("Full range")}</dt><dd>{model.display.rangeLabel}</dd></div>
            {model.display.spread === null ? null : (
              <div>
                <dt>{t("Spread interpretation")}</dt>
                <dd>
                  <strong>{t(model.display.spread.label)}</strong>
                  <span>{t(model.display.spread.explanation)}</span>
                </dd>
              </div>
            )}
            {model.display.change === null ? null : (
              <div>
                <dt>{t("Recent change")}</dt>
                <dd>
                  <strong>{localizeEvidenceMessage(model.display.change.label, locale)}</strong>
                  {model.display.change.reasons.map((reason) => <span key={reason}>{localizeEvidenceMessage(reason, locale)}</span>)}
                </dd>
              </div>
            )}
          </dl>
          <div className={styles.quoteBlock}>
            <EvidenceSectionHeading
              eyebrow={t("02 / Local quote")}
              title={t("Compare one refundable deposit locally.")}
            />
            <QuoteInput
              locale={locale}
              config={config}
              summary={model.summary}
              areaLabel={`${model.identity.nameEn} (${model.identity.nameKo})`}
              showMedianFaq
            />
          </div>
        </>
      ) : (
        <BoxPlot locale={locale}
          summary={model.summary}
          axis={config.axis}
          formatValue={(value) => money.format(value)}
        />
      )}
    </section>
  );
}

function ExactSaleEvidence({ locale = 'en', district }: Readonly<{ locale?: ProductLocale; district: ExploreDistrictModel }>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  return (
    <section className={styles.evidence} aria-labelledby="district-sale-evidence-heading" data-section="district-distribution">
      <EvidenceSectionHeading eyebrow={t("01 / Sale distribution")} title={t(district.summary.published ? 'Reported sale price range' : 'Sale distribution not published')} id="district-sale-evidence-heading" />
      <p className={styles.exactEvidenceNote}>{t("The range below uses the same sale cohort selected in Explore. No jeonse or monthly-rent values are mixed into this section.")}</p>
      <BoxPlot locale={locale} summary={district.summary} axis={config.axis} formatValue={(value) => money.format(value)} />
    </section>
  );
}

export function DistrictDetailPage({ locale = 'en',
  model,
  propertyTypes = [],
  neighborhoods = [],
  mapDistricts = [],
  mapPoint,
  naverMapClientId = null,
  currentDistrict,
  comparisonDistricts = [],
  exploreBuildings = [],
  exactSource,
}: Readonly<{ locale?: ProductLocale;
  model: PublicDistrictModel;
  propertyTypes?: readonly PublicPropertyTypeIdentity[];
  neighborhoods?: readonly KoreaNeighborhoodDirectoryEntry[];
  mapDistricts?: readonly NaverDistrictMapPoint[];
  mapPoint?: Readonly<{ latitude: number; longitude: number }>;
  naverMapClientId?: string | null;
  currentDistrict?: ExploreDistrictModel;
  comparisonDistricts?: readonly ExploreDistrictModel[];
  exploreBuildings?: readonly ExploreBuildingModel[];
  exactSource?: PublicSourceBoundaryModel;
}>) {
  const t = (value: string | null | undefined) => districtText(locale, value ?? '');
  const href = (value: string) => marketHref(locale, value);
  return (
    <div id="top" className={styles.page} data-district-detail={model.status} lang={locale}>
      <SiteHeader copy={headerFor(model, locale)} />
      <main className={styles.main}>
        <div className={styles.detailLayout} data-detail-layout="evidence-rail">
          <div className={styles.detailMain} data-detail-main="true">
            <Breadcrumb locale={locale} model={model} />
            <Finding locale={locale} model={model} mapDistricts={mapDistricts} mapPoint={mapPoint} naverMapClientId={naverMapClientId} />
            <nav className={styles.tabs} aria-label={t("District page sections")}><a href="#overview">{t("Overview")}</a><a href="#distribution">{t("Distribution")}</a><a href="#buildings">{t("Buildings")}</a><a href="#home-types">{t("Home types")}</a><a href="#source">{t("Source")}</a></nav>
            <div id="overview"><DistrictMetrics locale={locale} model={model} currentDistrict={currentDistrict} /></div>
            <div id="distribution">
            {currentDistrict === undefined ? <Evidence locale={locale} model={model} /> : <ExactSaleEvidence locale={locale} district={currentDistrict} />}
            </div>
            {currentDistrict === undefined ? <div className={styles.cohortEvidence} data-section="district-cohorts">
              <DistrictEvidenceSummary locale={locale} model={model.contractEvidence} mode="full" />
            </div> : null}
            <div id="home-types"><PropertyTypeEvidence locale={locale} model={model} propertyTypes={propertyTypes} /></div>
            <div id="buildings"><BuildingEvidence locale={locale} model={model} buildings={exploreBuildings} /></div>
            <NeighborhoodDirectory locale={locale} districtName={locale === 'en' ? model.identity.nameEn : model.identity.nameKo} entries={neighborhoods} />
            <DistrictDecisionSections locale={locale} model={model} comparisonDistricts={comparisonDistricts} buildings={exploreBuildings} />
            {model.status === 'unavailable' || currentDistrict !== undefined ? null : <Faq locale={locale} model={model} />}
            <div className={styles.sourceBoundary} data-section="district-source" id="source">
              <PublicSourceBoundary locale={locale} model={exactSource ?? model.source} transaction={currentDistrict === undefined ? undefined : 'sale'} />
            </div>
          </div>
          <aside className={styles.detailRail} data-detail-rail="true" aria-label={t("District context")}>
            <DetailNewsList locale={locale} news={model.news} />
            <CommunitySignal locale={locale} model={model.communitySignal} />
            <DistrictNavigation locale={locale} model={model} />
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
            dangerouslySetInnerHTML={{ __html: safeJson({ ...model.faqJsonLd, mainEntity: districtFaq(locale, model).map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }) }}
          />
        </>
      )}
      <SiteFooter copy={{ ...footer, descriptor: t(footer.descriptor), navigationLabel: t(footer.navigationLabel), links: footer.links.map(link => ({ ...link, label: t(link.label), href: href(link.href) })) }} />
    </div>
  );
}
