import type { EvidenceEmptyState } from '@signedprice/market-core';
import Link from 'next/link';

import type {
  BuildingDecisionModel,
  BuildingDecisionReadiness,
} from '../../lib/public-market/building-decision-model';
import { buildingDecisionHref } from '../../lib/public-market/building-decision-state';
import type { PublicBuildingModel } from '../../lib/public-market/building-route-model.server';
import { EvidenceDisclosure } from '../trust/evidence-disclosure';
import { EvidenceEmptyStatePanel } from '../trust/evidence-empty-state';
import { BoxPlot } from './box-plot';
import styles from './building-detail.module.css';

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

function OverviewDecisionView({ model, decision, base }: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  base: string;
}>) {
  return (
    <div className={styles.decisionLayout}>
      <div>
        <p className={styles.decisionEyebrow}>What can SignedPrice support now?</p>
        <h2>Evidence is ready for a rent comparison</h2>
        <p>
          {model.distribution.n} reported contracts are published for the declared period.
          Sale and investment conclusions remain gated.
        </p>
        <Link
          className={styles.primaryAction}
          href={buildingDecisionHref({ base, mode: decision.overview.primaryMode, contract: 'all' })}
        >
          Check my contract
        </Link>
      </div>
      <dl className={styles.decisionMetrics} aria-label="Building evidence readiness">
        <div><dt>Rent evidence</dt><dd>Published · {model.distribution.n} records</dd></div>
        <div><dt>Buy evidence</dt><dd>{decision.buy.readiness.state === 'published'
          ? 'Published'
          : decision.buy.readiness.title}</dd></div>
        <div><dt>Investment scenario</dt><dd>{decision.invest.readiness.state === 'published'
          ? 'Published'
          : decision.invest.readiness.title}</dd></div>
      </dl>
    </div>
  );
}

function GatedDecisionView({
  mode,
  readiness,
  base,
}: Readonly<{
  mode: 'Buy' | 'Invest';
  readiness: BuildingDecisionReadiness;
  base: string;
}>) {
  if (readiness.state === 'published') {
    return (
      <section className={styles.decisionView} aria-label={`${mode} evidence`}>
        <h2>{mode} evidence is published</h2>
        <p>{readiness.count} eligible records are ready.</p>
      </section>
    );
  }
  const emptyState: EvidenceEmptyState = {
    title: readiness.title,
    reason: readiness.reason,
    nextAction: readiness.nextAction,
    detail: {
      code: 'NOT_REPORTABLE',
      note: readiness.reason,
    },
  };
  return (
    <div className={styles.decisionView} data-gated-mode={mode.toLowerCase()}>
      <EvidenceEmptyStatePanel
        state={emptyState}
        actionHref={buildingDecisionHref({ base, mode: 'evidence', contract: 'new' })}
      />
    </div>
  );
}

function RentDecisionView({ model, decision, base }: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  base: string;
}>) {
  const { readiness, summary } = decision.rent;
  if (summary === null || readiness.state !== 'published') {
    const count = readiness.state === 'insufficient' ? readiness.count : 0;
    const title = readiness.state === 'published'
      ? 'Contract evidence is not available'
      : readiness.title;
    const reason = readiness.state === 'published'
      ? 'The selected cohort has no independently publishable summary.'
      : readiness.reason;
    const nextAction = readiness.state === 'published'
      ? 'Return to district evidence'
      : readiness.nextAction;
    const emptyState: EvidenceEmptyState = {
      title,
      reason,
      nextAction,
      detail: {
        code: 'INSUFFICIENT',
        count,
        threshold: model.evidence.publicationMinimum,
      },
    };
    const actionHref = decision.rent.cohort === 'all'
      ? `/kr/seoul/explore/${model.district.slug}/`
      : buildingDecisionHref({ base, mode: 'rent', contract: 'all' });
    return <EvidenceEmptyStatePanel state={emptyState} actionHref={actionHref} />;
  }
  return (
    <div className={styles.decisionView}>
      <p className={styles.decisionEyebrow}>Verified reported distribution</p>
      <h2>{decision.rent.cohort === 'all' ? 'All' : decision.rent.cohort === 'new'
        ? 'New'
        : 'Renewal'} contract evidence</h2>
      <p>{summary.n} reported contract{summary.n === 1 ? '' : 's'}</p>
      <div data-building-distribution="true">
        <BoxPlot
          summary={summary}
          axis={decision.rent.axis}
          formatValue={(value) => money.format(value)}
        />
      </div>
      <Link className={styles.primaryAction} href={decision.rentCheckHref}>
        Open full Rent Check
      </Link>
    </div>
  );
}

function EvidenceDecisionView({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <div className={styles.decisionView}>
      <div className={styles.sectionHeading}>
        <p>Evidence ledger</p>
        <h2>What supports this building page</h2>
      </div>
      <EvidenceDisclosure
        model={model.evidence.descriptor}
        boundary={model.presentation.sourceBoundary}
        attribution={['Ministry of Land, Infrastructure and Transport (MOLIT)']}
      />
      <dl className={styles.evidenceLedger}>
        <div><dt>Building identity</dt><dd>Verified by the signed building artifact.</dd></div>
        <div><dt>Rent contracts</dt><dd>Published for {model.evidence.period} with a minimum of {model.evidence.publicationMinimum} eligible records.</dd></div>
        <div><dt>Official sale evidence</dt><dd>Not connected and not used in Phase 1.</dd></div>
        <div><dt>Building visual</dt><dd>No rights-cleared source is connected.</dd></div>
        <div><dt>Community</dt><dd>Independent threshold state; never merged with official evidence.</dd></div>
      </dl>
    </div>
  );
}

export function BuildingDecisionView({ model, decision, base }: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  base: string;
}>) {
  const mode = decision.selection.mode;
  const content = (() => {
    switch (mode) {
      case 'rent':
        return <RentDecisionView model={model} decision={decision} base={base} />;
      case 'buy':
        return <GatedDecisionView mode="Buy" readiness={decision.buy.readiness} base={base} />;
      case 'invest':
        return <GatedDecisionView mode="Invest" readiness={decision.invest.readiness} base={base} />;
      case 'evidence':
        return <EvidenceDecisionView model={model} />;
      default:
        return <OverviewDecisionView model={model} decision={decision} base={base} />;
    }
  })();
  return (
    <section
      id="building-mode-panel"
      role="tabpanel"
      aria-labelledby={`building-mode-${mode}-tab`}
      data-selected-mode={mode}
    >
      {content}
    </section>
  );
}
