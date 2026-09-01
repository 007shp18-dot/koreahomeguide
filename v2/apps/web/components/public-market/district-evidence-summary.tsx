import Link from 'next/link';

import type { ContractGroupEvidenceModel } from '../../lib/public-market/area-route-types';
import { ContractGroupSelector } from './contract-group-selector';
import styles from './district-evidence-summary.module.css';

export function DistrictEvidenceSummary({
  model,
  mode,
  selectionHref,
}: Readonly<{
  model: ContractGroupEvidenceModel;
  mode: 'compact' | 'full';
  selectionHref?: string;
}>) {
  const evidence = model.groups[model.selected];
  const groupSelectionHref = selectionHref ?? evidence.href;
  const detailHref = model.selected === 'all'
    ? evidence.href
    : `${evidence.href}?contract=${model.selected}`;

  return (
    <section
      className={styles.summary}
      data-district-summary={evidence.status}
      data-summary-mode={mode}
      data-selected-evidence={model.scopeId}
      aria-labelledby={`district-summary-${model.scopeId}`}
    >
      <header className={styles.header}>
        <p>Seoul · {evidence.groupLabel}</p>
        <h2 id={`district-summary-${model.scopeId}`}>{evidence.nameEn}</h2>
        <p lang="ko">{evidence.nameKo}</p>
      </header>

      <ContractGroupSelector model={model} selectionHref={groupSelectionHref} />

      {evidence.status === 'published' ? (
        <>
          <div className={styles.finding}>
            <span>Median refundable jeonse deposit</span>
            <strong data-summary-median>{evidence.medianLabel}</strong>
            <p>{evidence.groupLabel} in this completed evidence period.</p>
          </div>
          <dl className={styles.metrics}>
            <div>
              <dt>Middle half</dt>
              <dd>{evidence.middleHalfLabel}</dd>
            </div>
            <div>
              <dt>Full range</dt>
              <dd data-summary-range>{evidence.rangeLabel}</dd>
            </div>
            <div>
              <dt>Recent change</dt>
              <dd>{evidence.changeLabel}</dd>
            </div>
            <div>
              <dt>Sample</dt>
              <dd>{evidence.sampleLabel}</dd>
            </div>
          </dl>
        </>
      ) : evidence.status === 'withheld' ? (
        <div className={styles.refusal}>
          <span aria-hidden="true" />
          <h3>Not published</h3>
          <p>{evidence.groupLabel} · {evidence.sampleLabel}</p>
          <p>
            At least {evidence.publicationMinimum} are required before any district money is published.
          </p>
          <p>Compare another contract group or return after the next completed update.</p>
        </div>
      ) : evidence.status === 'snapshot_unavailable' ? (
        <div className={styles.unavailable}>
          <h3>{evidence.message}</h3>
          <p>The installed v1 snapshot remains available as combined All evidence.</p>
          <p>Select All or return after the v2 artifact is installed.</p>
        </div>
      ) : (
        <div className={styles.unavailable}>
          <h3>{evidence.message}</h3>
          <p>No district figure is substituted when the verified artifact is unavailable.</p>
          <p>Return to Explore and choose another district.</p>
        </div>
      )}

      {model.unknownContractCount === null ? null : (
        <p className={styles.unknownCount}>
          Contract type unknown · {model.unknownContractCount}
        </p>
      )}

      <footer className={styles.footer}>
        <p>Completed evidence period · {evidence.period}</p>
        <Link href={detailHref}>Open {evidence.nameEn} evidence</Link>
      </footer>
    </section>
  );
}
