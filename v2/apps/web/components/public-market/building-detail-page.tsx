import {localizedSeoulHref, type ProductLocale} from '../../lib/locale/product-copy';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import { PassportLink as Link } from '../passport/passport-journey';
import type { ReactNode } from 'react';

import type { BuildingDecisionModel } from '../../lib/public-market/building-decision-model';
import type {
  BuildingContractCohort,
  BuildingDecisionMode,
} from '../../lib/public-market/building-decision-state';
import type { BuildingVisualModel } from '../../lib/public-market/building-visual-model';
import type { PublicBuildingModel } from '../../lib/public-market/building-route-model.server';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
} from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { BuildingDecisionTabs } from './building-decision-tabs';
import { BuildingDecisionView } from './building-decision-views';
import { BuildingDetailHeader } from './building-detail-header';
import { BuildingEvidenceDetails, BuildingSourceEvidence } from './building-evidence-details';
import { BuildingVisual } from './building-visual';
import { DetailNewsList } from '../news/detail-news-list';
import pageStyles from './building-page.module.css';
import { createEntityCheckHref } from '../../lib/navigation/explorer-selection';
import { BuildingSaveButton } from './building-save-button';

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul building evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

const MODE_LABELS = {
  overview: 'Overview',
  rent: 'Rent',
  buy: 'Buy',
  invest: 'Invest',
  evidence: 'Evidence',
} as const satisfies Readonly<Record<BuildingDecisionMode, string>>;

const COHORT_LABELS = {
  all: 'All',
  new: 'New',
  renewal: 'Renewal',
} as const satisfies Readonly<Record<BuildingContractCohort, string>>;

export function BuildingDetailPage({
  model,
  decision,
  visual,
  propertyMedia,
  facts,
  base,
  backHref,
  locale = 'en',
}: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  visual: BuildingVisualModel;
  propertyMedia?: ReactNode;
  facts?: ReactNode;
  base: string;
  backHref?: string;
  locale?: ProductLocale;
}>) {
  const { mode, contract } = decision.selection;
  const t = (value: string) => seoulDetailText(locale, value);
  const districtName = locale === 'ko' ? model.district.nameKo : model.district.nameEn;
  const hasMedia = Boolean(propertyMedia) || visual.kind !== 'unavailable';
  const exploreHref = backHref ?? localizedSeoulHref(`/kr/seoul/explore/?district=${model.district.slug}`,locale);
  const exploreTarget = new URL(exploreHref, 'https://signedprice.invalid');
  const detailTarget = new URL(base, 'https://signedprice.invalid');
  for (const [key, value] of exploreTarget.searchParams) detailTarget.searchParams.set(key, value);
  const transaction = exploreTarget.searchParams.get('transaction');
  const checkHref = createEntityCheckHref(localizedSeoulHref('/kr/seoul/check/',locale), {
    locale,
    market: 'kr-seoul',
    entity: model.building.buildingId,
    returnTo: `${detailTarget.pathname}${detailTarget.search}`,
    selection: {
      market: 'kr',
      transaction: transaction === 'jeonse' || transaction === 'monthly' ? transaction : 'sale',
      district: model.district.slug,
      neighborhood: model.building.neighborhoodId,
      buildingId: model.building.buildingId,
      propertyType: model.building.housingType,
    },
  });
  return (
    <div id="top" className={pageStyles.page}>
      <BuildingDetailHeader locale={locale} />
      <main className={pageStyles.main} data-building-detail="ready" data-detail-layout="research">
        <nav className={pageStyles.breadcrumb} aria-label={t('Breadcrumb')}><Link href={localizedSeoulHref('/kr/seoul/',locale)}>{t('Seoul')}</Link><Link href={exploreHref}>{districtName}</Link><span aria-current="page">{model.building.name}</span></nav>
        <section
          className={pageStyles.identityHero}
          data-identity-hero="true"
          data-detail-hero="building"
          data-building-section="identity"
          data-has-media={hasMedia}
        >
          {hasMedia ? <section className={pageStyles.identityMedia} data-detail-order="media" data-building-gallery="verified" aria-label={locale === 'ko' ? '확인된 건물 사진' : 'Verified building photograph'}><span className={pageStyles.mediaKind} data-media-kind="exterior">{locale === 'ko' ? '외관' : 'Exterior'}</span>{propertyMedia ?? <BuildingVisual model={visual} />}</section> : null}
          <div className={pageStyles.identitySummary} data-detail-hero-metric="identity" data-detail-order="identity">
            <Link
              className={pageStyles.backAction}
              href={exploreHref}
            >
              {locale === 'ko' ? `${districtName} 탐색으로` : `Back to ${districtName} Explore`}
            </Link>
            <h1>{model.building.name}</h1>
            <p className={pageStyles.location}>{model.building.neighborhoodName} · {districtName}, {t('Seoul')}</p>
            <dl className={pageStyles.identityFacts}>
              <div><dt>{t('Property type')}</dt><dd>{t(model.building.housingType)}</dd></div>
            </dl>
            <Link className={pageStyles.primaryAction} href={checkHref}>
              {locale === 'ko' ? '매물 가격 비교' : 'Compare an asking price'}
            </Link>
            <BuildingSaveButton
              buildingKey={`${model.district.slug}/${model.building.buildingId}`}
              buildingName={model.building.name}
              locale={locale}
              variant="detail"
            />
          </div>
        </section>

        <nav className={pageStyles.tabs} aria-label={t('Building page sections')}><a href="#building-overview">{t('Overview')}</a><a href="#building-evidence">{t('Transactions')}</a><a href="#rent-evidence">{t('Rent evidence')}</a><a href="#building-source">{t('Source')}</a></nav>
        <section className={pageStyles.summaryGrid} id="building-overview" aria-label={t('Building summary')}>
          <article className={pageStyles.priceSummary} data-detail-order="current-evidence"><h2>{t('Price summary')}</h2><span>{t('Median refundable deposit')}</span><strong>{model.display.medianLabel}</strong><small>{t(model.display.sampleLabel)} · {model.evidence.period}</small></article>
          <article data-detail-order="history"><h2>{t('Recent reported evidence')}</h2><ul className={pageStyles.transactionList}>{model.building.recentContracts.slice(0, 3).map((contract, index) => <li key={`${contract.filedMonth}-${index}`}><span>{contract.filedMonth}</span><span>{contract.areaSqm}㎡ · {locale === 'ko' ? `${contract.floor ?? '—'}층` : `Floor ${contract.floor ?? '—'}`}</span><strong>{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(contract.depositWon)}</strong></li>)}</ul></article>

        </section>

        <section className={pageStyles.decisionRegion} data-building-section="decision" data-detail-order="comparable-range" id="rent-evidence">
          <BuildingDecisionTabs base={base} selection={decision.selection} locale={locale} />
          <p className={pageStyles.selectedModeStatus} aria-live="polite">
            {locale === 'ko' ? `${t(MODE_LABELS[mode])} · ${t(COHORT_LABELS[contract])} 계약` : `Viewing ${MODE_LABELS[mode]} · ${COHORT_LABELS[contract]} contract cohort`}
          </p>
          <BuildingDecisionView model={model} decision={decision} base={base} locale={locale} />
        </section>

        <div className={pageStyles.details} id="building-evidence"><BuildingEvidenceDetails model={model} locale={locale} includeSource={false} /></div>
        <section className={pageStyles.profileFacts} data-detail-order="facts" aria-labelledby="building-profile-heading">
          <div><span>{t('Building profile')}</span><h2 id="building-profile-heading">{t('Verified facts already attached')}</h2></div>
          <dl>
            <div><dt>{t('Building')}</dt><dd>{model.building.name}</dd></div>
            <div><dt>{t('Area')}</dt><dd>{model.building.neighborhoodName} · {districtName}</dd></div>
            <div><dt>{t('Housing type')}</dt><dd>{t(model.building.housingType)}</dd></div>
            <div><dt>{t('Evidence period')}</dt><dd>{model.evidence.period}</dd></div>
          </dl>
        </section>

        <div className={pageStyles.facts} data-detail-order="proximity">{facts}</div>
        <div className={pageStyles.details} data-detail-order="sources"><BuildingSourceEvidence model={model} locale={locale} /></div>
        <section className={pageStyles.contextGrid} data-detail-order="related-actions" aria-label={t('Building news and community')}>
          <DetailNewsList news={model.news} locale={locale} />

        </section>
      </main>
      <SiteFooter locale={locale} copy={locale === 'ko' ? { ...footer, descriptor: '서울 단지별 실거래 자료와 집계 범위를 확인하세요.' } : footer} />
    </div>
  );
}
