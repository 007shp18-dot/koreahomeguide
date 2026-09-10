import { seoulBuildingLocationHref } from '../../lib/public-market/seoul-building-location';
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
import { ProjectedEntityMedia } from './projected-entity-media';
import { MarketSummary } from '../market-ui/market-summary';
import { DetailTools } from '../market-ui/detail-tools';
import detailStyles from '../market-ui/detail-layout.module.css';

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
      <main className={`${pageStyles.main} ${detailStyles.root}`} data-building-detail="ready" data-detail-layout="unified">
        <nav className={pageStyles.breadcrumb} aria-label={t('Breadcrumb')}><Link href={localizedSeoulHref('/kr/seoul/',locale)}>{t('Seoul')}</Link><Link href={exploreHref}>{locale === 'ko' ? `${districtName} 탐색으로` : `Back to ${districtName} Explore`}</Link><span aria-current="page">{model.building.name}</span></nav>
        <MarketSummary locale={locale} id="building-overview" title={model.building.name}
          location={`${model.building.neighborhoodName} · ${districtName}`}
          context={locale === 'ko' ? '서울 · 신고 임대차 거래' : 'Seoul · Reported rental contracts'}
          metric={{label:t('Median refundable deposit'),value:model.display.medianLabel,note:`${t(model.display.sampleLabel)} · ${model.evidence.period}`}}
          facts={[{label:t('Property type'),value:t(model.building.housingType)}]}
          actions={<><Link href={checkHref}>{locale === 'ko' ? '매물 가격 비교' : 'Compare an asking price'}</Link><BuildingSaveButton buildingKey={`${model.district.slug}/${model.building.buildingId}`} buildingName={model.building.name} locale={locale} variant="detail" /></>} />
        <div data-detail-order="media">{propertyMedia ?? (visual.kind !== 'unavailable' ? <BuildingVisual model={visual} /> : <ProjectedEntityMedia locale={locale} buildingName={model.building.name} address={`${model.building.neighborhoodName}, ${districtName}, Seoul`} media={null} locationHref={seoulBuildingLocationHref(exploreHref)} />)}</div>
        <nav className={pageStyles.tabs} aria-label={t('Building page sections')}>
          <a href="#building-overview">{t('Overview')}</a><a href="#building-evidence">{t('Transactions')}</a><a href="#building-facts">{t('Building profile')}</a><a href="#building-tools">{locale === 'ko' ? '내 조건 비교' : 'Compare'}</a><a href="#building-source">{t('Source')}</a>
        </nav>
        <div className={pageStyles.details} id="building-evidence"><BuildingEvidenceDetails model={model} locale={locale} includeSource={false} /></div>
        <details id="rent-evidence" className={detailStyles.disclosure} open={mode !== 'overview'}>
          <summary>{locale === 'ko' ? '임대차 조건별 추가 분석' : 'Additional analysis by rental contract type'}</summary>
        <section className={pageStyles.decisionRegion} data-building-section="decision" data-detail-order="comparable-range">
          <BuildingDecisionTabs base={base} selection={decision.selection} locale={locale} />
          <p className={pageStyles.selectedModeStatus} aria-live="polite">
            {locale === 'ko' ? `${t(MODE_LABELS[mode])} · ${t(COHORT_LABELS[contract])} 계약` : `Viewing ${MODE_LABELS[mode]} · ${COHORT_LABELS[contract]} contract cohort`}
          </p>
          <BuildingDecisionView model={model} decision={decision} base={base} locale={locale} />
        </section>

        </details>
        <div id="building-facts" className={detailStyles.section} data-detail-order="facts">
          {facts ?? <section><h2>{t('Building profile')}</h2><p>{t(model.building.housingType)} · {model.building.neighborhoodName}</p></section>}
        </div>
        <DetailTools locale={locale} id="building-tools" checkHref={checkHref} />
        <div className={pageStyles.details} data-detail-order="sources"><BuildingSourceEvidence model={model} locale={locale} /></div>
        <section className={pageStyles.contextGrid} data-detail-order="related-actions" aria-label={t('Building news and community')}>
          <DetailNewsList news={model.news} locale={locale} />

        </section>
      </main>
      <SiteFooter locale={locale} copy={locale === 'ko' ? { ...footer, descriptor: '서울 단지별 실거래 자료와 집계 범위를 확인하세요.' } : footer} />
    </div>
  );
}
