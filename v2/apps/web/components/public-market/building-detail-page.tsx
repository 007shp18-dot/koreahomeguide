import Link from 'next/link';
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
import { BuildingEvidenceDetails } from './building-evidence-details';
import { BuildingVisual } from './building-visual';
import { DetailNewsList } from '../news/detail-news-list';
import { CommunitySignal } from '../community/community-signal';
import pageStyles from './building-page.module.css';
import { createEntityCheckHref } from '../../lib/navigation/explorer-selection';

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
}: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  visual: BuildingVisualModel;
  propertyMedia?: ReactNode;
  facts?: ReactNode;
  base: string;
  backHref?: string;
}>) {
  const { mode, contract } = decision.selection;
  const exploreHref = backHref ?? `/kr/seoul/explore/?district=${model.district.slug}`;
  const exploreTarget = new URL(exploreHref, 'https://signedprice.invalid');
  const detailTarget = new URL(base, 'https://signedprice.invalid');
  for (const [key, value] of exploreTarget.searchParams) detailTarget.searchParams.set(key, value);
  const transaction = exploreTarget.searchParams.get('transaction');
  const checkHref = createEntityCheckHref('/kr/seoul/check/', {
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
      <BuildingDetailHeader />
      <main className={pageStyles.main} data-building-detail="ready" data-detail-layout="research">
        <nav className={pageStyles.breadcrumb} aria-label="Breadcrumb"><Link href="/kr/seoul/">Seoul</Link><Link href={exploreHref}>{model.district.nameEn}</Link><span aria-current="page">{model.building.name}</span></nav>
        <section
          className={pageStyles.identityHero}
          data-identity-hero="true"
          data-detail-hero="building"
          data-building-section="identity"
        >
          <div className={pageStyles.identityMedia} data-detail-order="media">{propertyMedia ?? <BuildingVisual model={visual} />}</div>
          <div className={pageStyles.identitySummary} data-detail-hero-metric="identity" data-detail-order="identity">
            <Link
              className={pageStyles.backAction}
              href={exploreHref}
            >
              Back to {model.district.nameEn} Explore
            </Link>
            <h1>{model.building.name}</h1>
            <p className={pageStyles.location}>{model.building.neighborhoodName} · {model.district.nameEn}, Seoul</p>
            <dl className={pageStyles.identityFacts}>
              <div><dt>Property type</dt><dd>{model.building.housingType}</dd></div>
              <div><dt>Evidence</dt><dd>{model.display.sampleLabel}</dd></div>
              <div><dt>Period</dt><dd>{model.evidence.period}</dd></div>
            </dl>
            <Link className={pageStyles.primaryAction} href={checkHref}>
              Check this contract
            </Link>
          </div>
        </section>

        <nav className={pageStyles.tabs} aria-label="Building page sections"><a href="#building-overview">Overview</a><a href="#building-evidence">Transactions</a><a href="#rent-evidence">Rent evidence</a><span>Listings · Preparing</span><a href="#building-source">Source</a></nav>
        <section className={pageStyles.summaryGrid} id="building-overview" aria-label="Building summary">
          <article className={pageStyles.priceSummary} data-detail-order="current-evidence"><h2>Price summary</h2><span>Median refundable deposit</span><strong>{model.display.medianLabel}</strong><small>{model.display.sampleLabel}</small></article>
          <article data-detail-order="history"><h2>Recent reported evidence</h2><ul className={pageStyles.transactionList}>{model.building.recentContracts.slice(0, 3).map((contract, index) => <li key={`${contract.filedMonth}-${index}`}><span>{contract.filedMonth}</span><span>{contract.areaSqm}㎡ · Floor {contract.floor ?? '—'}</span><strong>{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(contract.depositWon)}</strong></li>)}</ul></article>
          <article className={pageStyles.preparing}><span>Listing service</span><h2>Not a live listing</h2><p>Listings, inquiries and agent connections are intentionally unavailable while operating and legal checks are completed.</p></article>
        </section>

        <section className={pageStyles.decisionRegion} data-building-section="decision" data-detail-order="comparable-range" id="rent-evidence">
          <BuildingDecisionTabs base={base} selection={decision.selection} />
          <p className={pageStyles.selectedModeStatus} aria-live="polite">
            Viewing {MODE_LABELS[mode]} · {COHORT_LABELS[contract]} contract cohort
          </p>
          <BuildingDecisionView model={model} decision={decision} base={base} />
        </section>

        <section className={pageStyles.profileFacts} data-detail-order="facts" aria-labelledby="building-profile-heading">
          <div><span>Building profile</span><h2 id="building-profile-heading">Verified facts already attached</h2></div>
          <dl>
            <div><dt>Building</dt><dd>{model.building.name}</dd></div>
            <div><dt>Area</dt><dd>{model.building.neighborhoodName} · {model.district.nameEn}</dd></div>
            <div><dt>Housing type</dt><dd>{model.building.housingType}</dd></div>
            <div><dt>Evidence period</dt><dd>{model.evidence.period}</dd></div>
          </dl>
        </section>

        <div className={pageStyles.facts} data-detail-order="proximity">{facts}</div>
        <div className={pageStyles.details} id="building-evidence" data-detail-order="sources"><BuildingEvidenceDetails model={model} /></div>
        <section className={pageStyles.contextGrid} data-detail-order="related-actions" aria-label="Building news and community">
          <DetailNewsList news={model.news} />
          <CommunitySignal model={model.communitySignal} />
        </section>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
