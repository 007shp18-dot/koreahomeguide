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
import styles from './building-detail.module.css';

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
    <div id="top" className={styles.page}>
      <BuildingDetailHeader />
      <main className={styles.main} data-building-detail="ready">
        <section
          className={styles.identityHero}
          data-identity-hero="true"
          data-detail-hero="building"
          data-building-section="identity"
        >
          {streetView ?? <BuildingVisual model={visual} />}
          <div className={styles.identitySummary} data-detail-hero-metric="identity">
            <Link
              className={styles.backAction}
              href={exploreHref}
            >
              Back to {model.district.nameEn} Explore
            </Link>
            <p className={styles.identityEyebrow}>Verified building identity</p>
            <h1>{model.building.name}</h1>
            <p>{model.building.neighborhoodName} · {model.district.nameEn}</p>
            <dl className={styles.factGrid}>
              <div><dt>Housing type</dt><dd>{model.building.housingType}</dd></div>
              <div><dt>Rent evidence</dt><dd>{model.display.sampleLabel}</dd></div>
              <div><dt>Declared period</dt><dd>{model.evidence.period}</dd></div>
              <div><dt>Source</dt><dd>{model.evidence.provider} {model.evidence.dataset}</dd></div>
            </dl>
            <Link className={styles.primaryAction} href={decision.rentCheckHref}>
              Check this contract
            </Link>
          </div>
        </section>

        {facts}

        <section className={styles.decisionRegion} data-building-section="decision">
          <BuildingDecisionTabs base={base} selection={decision.selection} />
          <p className={styles.selectedModeStatus} aria-live="polite">
            Viewing {MODE_LABELS[mode]} · {COHORT_LABELS[contract]} contract cohort
          </p>
          <BuildingDecisionView model={model} decision={decision} base={base} />
        </section>
        <BuildingEvidenceDetails model={model} />
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
