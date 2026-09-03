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
  streetView,
  facts,
  base,
  backHref,
}: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  visual: BuildingVisualModel;
  streetView?: ReactNode;
  facts?: ReactNode;
  base: string;
  backHref?: string;
}>) {
  const { mode, contract } = decision.selection;
  const exploreHref = backHref ?? `/kr/seoul/explore/?district=${model.district.slug}`;
  return (
    <div id="top" className={pageStyles.page}>
      <BuildingDetailHeader />
      <main className={pageStyles.main} data-building-detail="ready">
        <nav className={pageStyles.breadcrumb} aria-label="Breadcrumb"><Link href="/kr/seoul/">Seoul</Link><Link href={exploreHref}>{model.district.nameEn}</Link><span aria-current="page">{model.building.name}</span></nav>
        <section
          className={pageStyles.identityHero}
          data-identity-hero="true"
          data-detail-hero="building"
          data-building-section="identity"
        >
          <div className={pageStyles.identitySummary} data-detail-hero-metric="identity">
            <Link
              className={pageStyles.backAction}
              href={exploreHref}
            >
              Back to {model.district.nameEn} Explore
            </Link>
            <p className={pageStyles.identityEyebrow}>Verified building identity</p>
            <h1>{model.building.name}</h1>
            <p className={pageStyles.location}>{model.building.neighborhoodName} · {model.district.nameEn}, Seoul</p>
            <div className={pageStyles.identityFacts}><span>{model.building.housingType}</span><span>{model.display.sampleLabel}</span><span>{model.evidence.period}</span></div>
            <Link className={pageStyles.primaryAction} href={decision.rentCheckHref}>
              Check this contract
            </Link>
          </div>
          <div className={pageStyles.identityMedia}>{streetView ?? <BuildingVisual model={visual} />}</div>
        </section>

        <nav className={pageStyles.tabs} aria-label="Building page sections"><a href="#building-overview">Overview</a><a href="#building-evidence">Transactions</a><a href="#rent-evidence">Rent evidence</a><span>Listings · Preparing</span><a href="#building-source">Source</a></nav>
        <section className={pageStyles.summaryGrid} id="building-overview" aria-label="Building summary">
          <article className={pageStyles.priceSummary}><h2>Price summary</h2><span>Median refundable deposit</span><strong>{model.display.medianLabel}</strong><small>{model.display.sampleLabel}</small></article>
          <article><h2>Recent reported evidence</h2><ul className={pageStyles.transactionList}>{model.building.recentContracts.slice(0, 3).map((contract, index) => <li key={`${contract.filedMonth}-${index}`}><span>{contract.filedMonth}</span><span>{contract.areaSqm}㎡ · Floor {contract.floor ?? '—'}</span><strong>{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(contract.depositWon)}</strong></li>)}</ul></article>
          <article className={pageStyles.preparing}><span>Properties · Service preparing</span><h2>Not a live listing</h2><p>Listings, inquiries and agent connections are intentionally unavailable while operating and legal checks are completed.</p></article>
        </section>

        <section className={pageStyles.profileFacts} aria-labelledby="building-profile-heading">
          <div><span>Building profile</span><h2 id="building-profile-heading">Verified facts already attached</h2></div>
          <dl>
            <div><dt>Building</dt><dd>{model.building.name}</dd></div>
            <div><dt>Area</dt><dd>{model.building.neighborhoodName} · {model.district.nameEn}</dd></div>
            <div><dt>Housing type</dt><dd>{model.building.housingType}</dd></div>
            <div><dt>Evidence period</dt><dd>{model.evidence.period}</dd></div>
          </dl>
        </section>

        <section className={pageStyles.contextGrid} aria-label="Building news and community">
          <DetailNewsList news={model.news} />
          <CommunitySignal model={model.communitySignal} />
        </section>

        <div className={pageStyles.facts}>{facts}</div>

        <section className={pageStyles.decisionRegion} data-building-section="decision" id="rent-evidence">
          <BuildingDecisionTabs base={base} selection={decision.selection} />
          <p className={pageStyles.selectedModeStatus} aria-live="polite">
            Viewing {MODE_LABELS[mode]} · {COHORT_LABELS[contract]} contract cohort
          </p>
          <BuildingDecisionView model={model} decision={decision} base={base} />
        </section>
        <div className={pageStyles.details} id="building-evidence"><BuildingEvidenceDetails model={model} /></div>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
