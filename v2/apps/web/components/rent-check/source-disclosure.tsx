import type { SeoulRentCheckEnvelope } from '@signedprice/korea-rent/browser';

import styles from '../../app/kr/seoul/tools/rent-check/rent-check.module.css';

type SourceDisclosureProps = {
  readonly envelope: SeoulRentCheckEnvelope;
};

export function SourceDisclosure({ envelope }: SourceDisclosureProps) {
  const unknownStatuses = envelope.methodology.sourceRecordStatusCounts.unknown;
  const monthlyAdjusted = envelope.result.comparisonBasis === 'deposit-adjusted-monthly-rent';
  const selected = envelope.methodology.selectedContractTypeCounts;
  const contractSelection = envelope.methodology.contractSelection === 'new_only'
    ? 'new_only'
    : envelope.methodology.contractSelection === 'mixed'
      ? 'mixed because the new-contract minimum was not met'
      : 'no compatible contracts';

  return (
    <section className={styles['source-disclosure']} aria-label="Source, method and limitations">
      <dl className={styles['disclosure-facts']}>
        <div>
          <dt>Source</dt>
          <dd>{envelope.source.provider} · {envelope.source.dataset}</dd>
          <dd>{envelope.source.attribution.join(', ')}</dd>
        </div>
        <div>
          <dt>Period</dt>
          <dd>Source completeness through {envelope.coverage.coverageThroughMonth}</dd>
          <dd>{envelope.coverage.monthsUsed} completed months used</dd>
          <dd>Latest contract month: {envelope.coverage.latestContractMonth ?? 'Unavailable'}</dd>
          <dd>Contract-date basis · {envelope.coverage.timezone}</dd>
        </div>
        <div>
          <dt>Retrieval</dt>
          <dd>Earliest: {envelope.coverage.sourceRetrievedAt.earliest}</dd>
          <dd>Latest: {envelope.coverage.sourceRetrievedAt.latest}</dd>
        </div>
        <div>
          <dt>Sample</dt>
          <dd>{envelope.result.comparableCount.toLocaleString('en-US')} compatible contracts</dd>
          <dd>{unknownStatuses.toLocaleString('en-US')} records had unknown status</dd>
          <dd>Contract selection: {contractSelection}</dd>
          <dd>
            Selected contract types: {selected.new.toLocaleString('en-US')} new ·{' '}
            {selected.renewal.toLocaleString('en-US')} renewal ·{' '}
            {selected.unknown.toLocaleString('en-US')} unknown
          </dd>
        </div>
        <div>
          <dt>Method</dt>
          <dd>{monthlyAdjusted
            ? 'signedprice deposit-adjusted estimate'
            : 'Direct comparison of official reported jeonse deposits'}</dd>
          <dd>5.0%/year signedprice comparison assumption</dd>
          <dd>{monthlyAdjusted
            ? 'Applied only to monthly-rent normalization.'
            : 'Not applied to this jeonse comparison.'}</dd>
        </div>
      </dl>

      {envelope.typeMapping.applied && envelope.typeMapping.explanation !== null ? (
        <p className={styles['mapping-warning']}>{envelope.typeMapping.explanation}</p>
      ) : null}

      <div className={styles['limitations']}>
        <h3>Method and limitations</h3>
        <p>
          Official records may later be corrected or cancelled. Reported contracts are not
          current asking listings. This result is a market reference, not an appraisal or legal
          advice.
        </p>
        <ul>
          {envelope.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
