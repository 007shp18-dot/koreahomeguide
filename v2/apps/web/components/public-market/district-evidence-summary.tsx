import Link from 'next/link';

import type { ContractGroupEvidenceModel } from '../../lib/public-market/area-route-types';
import {
  PUBLIC_MARKET_COPY,
  localizeEvidenceMessage,
  localizedGroupLabel,
  localizeSampleLabel,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import { ContractGroupSelector } from './contract-group-selector';
import styles from './district-evidence-summary.module.css';

function spreadCopy(
  spread: Extract<ContractGroupEvidenceModel['groups']['all'], { status: 'published' }>['spread'],
  locale: ProductLocale,
): Readonly<{ label: string; explanation: string }> {
  if (locale === 'en') return spread;
  if (spread.status === 'unavailable') {
    return {
      label: '분포 폭 확인 불가',
      explanation: '중간 절반 분포 폭을 해석하려면 0보다 큰 유효 중앙값이 필요합니다.',
    };
  }
  const labels = {
    narrow: '좁은 중간 절반',
    moderate: '보통 중간 절반',
    wide: '넓은 중간 절반',
  } as const;
  return {
    label: labels[spread.bucket],
    explanation: `중간 절반의 폭은 중앙값의 ${(spread.ratio * 100).toFixed(1)}%입니다.`,
  };
}

export function DistrictEvidenceSummary({
  model,
  mode,
  selectionHref,
  locale = 'en',
  medianLabel,
  showContractGroups = true,
}: Readonly<{
  model: ContractGroupEvidenceModel;
  mode: 'compact' | 'full';
  selectionHref?: string;
  locale?: ProductLocale;
  medianLabel?: string;
  showContractGroups?: boolean;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].summary;
  const evidence = model.groups[model.selected];
  const groupSelectionHref = selectionHref ?? evidence.href;
  const detailHref = model.selected === 'all'
    ? evidence.href
    : `${evidence.href}?contractType=${model.selected}`;
  const comparisonOrder = ['new', 'renewal', 'all'] as const;

  return (
    <section
      className={styles.summary}
      data-district-summary={evidence.status}
      data-summary-mode={mode}
      data-selected-evidence={model.scopeId}
      aria-labelledby={`district-summary-${model.scopeId}`}
    >
      <header className={styles.header}>
        <p>{copy.seoul} · {localizedGroupLabel(evidence.contractGroup, locale)}</p>
        <h2 id={`district-summary-${model.scopeId}`}>
          {locale === 'ko' ? evidence.nameKo : evidence.nameEn}
        </h2>
        <p lang={locale === 'ko' ? 'en' : 'ko'}>
          {locale === 'ko' ? evidence.nameEn : evidence.nameKo}
        </p>
      </header>

      {showContractGroups ? (
        <ContractGroupSelector
          model={model}
          selectionHref={groupSelectionHref}
          locale={locale}
        />
      ) : null}

      {evidence.status === 'published' ? (
        <>
          <div className={styles.finding}>
            <span>{medianLabel ?? copy.median}</span>
            <strong data-summary-median>{evidence.medianLabel}</strong>
            <p>{localizedGroupLabel(evidence.contractGroup, locale)} · {copy.evidencePeriodSuffix}</p>
          </div>
          <dl className={styles.metrics}>
            <div>
              <dt>{copy.middleHalf}</dt>
              <dd>{evidence.middleHalfLabel}</dd>
            </div>
            <div>
              <dt>{copy.fullRange}</dt>
              <dd data-summary-range>{evidence.rangeLabel}</dd>
            </div>
            <div>
              <dt>{copy.spread}</dt>
              <dd>{spreadCopy(evidence.spread, locale).label}</dd>
              <dd>{spreadCopy(evidence.spread, locale).explanation}</dd>
            </div>
            <div>
              <dt>{copy.recentChange}</dt>
              <dd>{localizeEvidenceMessage(evidence.change.label, locale)}</dd>
              {evidence.change.reasons.map((reason) => (
                <dd key={reason}>{localizeEvidenceMessage(reason, locale)}</dd>
              ))}
            </div>
            <div>
              <dt>{copy.sample}</dt>
              <dd>{localizeSampleLabel(evidence.sampleLabel, locale)}</dd>
            </div>
          </dl>
        </>
      ) : evidence.status === 'withheld' ? (
        <div className={styles.refusal}>
          <span aria-hidden="true" />
          <h3>{copy.notPublished}</h3>
          <p>{localizedGroupLabel(evidence.contractGroup, locale)} · {localizeSampleLabel(evidence.sampleLabel, locale)}</p>
          <p>
            {copy.minimumLead} {evidence.publicationMinimum}{locale === 'en' ? ' ' : ''}{copy.minimumTail}
          </p>
          <p>{copy.withheldAction}</p>
        </div>
      ) : evidence.status === 'snapshot_unavailable' ? (
        <div className={styles.unavailable}>
          <h3>{localizeEvidenceMessage(evidence.message, locale)}</h3>
          <p>{copy.snapshotReason}</p>
          <p>{copy.snapshotAction}</p>
        </div>
      ) : (
        <div className={styles.unavailable}>
          <h3>{localizeEvidenceMessage(evidence.message, locale)}</h3>
          <p>{copy.unavailableReason}</p>
          <p>{copy.unavailableAction}</p>
        </div>
      )}

      {model.unknownContractCount === null ? null : (
        <p className={styles.unknownCount}>
          {copy.unknownContract} · {model.unknownContractCount}
        </p>
      )}

      {showContractGroups ? (
        <section
          className={styles.comparison}
          data-contract-comparison="new-renewal-all"
          aria-labelledby={`contract-comparison-${model.scopeId}`}
        >
          <div className={styles.comparisonHeading}>
            <p>{copy.sameDistrictPeriod}</p>
            <h3 id={`contract-comparison-${model.scopeId}`}>{copy.comparisonHeading}</h3>
          </div>
          <div className={styles.comparisonRows} role="table" aria-label={copy.comparisonAria}>
            {comparisonOrder.map((group) => {
              const row = model.groups[group];
              const sample = row.status === 'published' || row.status === 'withheld'
                ? localizeSampleLabel(row.sampleLabel, locale)
                : copy.sampleUnavailable;
              const median = row.status === 'published'
                ? row.medianLabel
                : row.status === 'snapshot_unavailable'
                  ? copy.snapshotUnavailable
                  : copy.notPublished;
              return (
                <div
                  className={styles.comparisonRow}
                  data-contract-comparison-row={group}
                  role="row"
                  key={group}
                >
                  <strong role="rowheader">{localizedGroupLabel(group, locale).replace(locale === 'en' ? ' contracts' : ' 계약', '')}</strong>
                  <span role="cell">{sample}</span>
                  <span role="cell">{median}</span>
                </div>
              );
            })}
          </div>
          {model.allLowerThanNew ? (
            <p className={styles.comparisonNote}>
              {copy.allLowerThanNew}
            </p>
          ) : null}
        </section>
      ) : null}

      <footer className={styles.footer}>
        <p>{copy.reportedPeriod} · {evidence.period}</p>
        <Link href={detailHref}>
          {copy.openEvidence} · {locale === 'ko' ? evidence.nameKo : evidence.nameEn}
        </Link>
      </footer>
    </section>
  );
}
