import type { PublicSourceBoundaryModel } from '../../lib/public-market/area-route-types';
import { createEvidenceEmptyState } from '@signedprice/market-core';
import {
  PUBLIC_MARKET_COPY,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import { EvidenceDisclosure } from '../trust/evidence-disclosure';
import { EvidenceEmptyStatePanel } from '../trust/evidence-empty-state';
import styles from './public-market.module.css';

export function PublicSourceBoundary({
  model,
  locale = 'en',
  transaction,
  compact = false,
}: Readonly<{
  model: PublicSourceBoundaryModel;
  locale?: ProductLocale;
  transaction?: 'jeonse' | 'monthly' | 'sale';
  compact?: boolean;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].source;
  const registryValue = transaction === 'sale'
    ? (locale === 'ko' ? '국토교통부 신고 매매 계약' : 'MOLIT reported sale contracts')
    : copy.registryValue;
  const fixedFilterValue = transaction === 'sale'
    ? (locale === 'ko'
        ? '신고 매매 계약이며 취소 건은 제외합니다.'
        : 'Reported sale contracts. Canceled records are excluded.')
    : transaction === 'monthly'
      ? (locale === 'ko'
          ? '신고 월세 계약이며 보증금은 별도로 표시합니다. 취소 건은 제외합니다.'
          : 'Reported monthly-rent contracts; filed deposit is shown separately. Canceled records are excluded.')
      : transaction === 'jeonse'
        ? (locale === 'ko'
            ? '월세 0원의 신고 전세 계약이며 취소 건은 제외합니다.'
            : 'Reported zero-monthly-rent jeonse contracts. Canceled records are excluded.')
        : copy.fixedFilterValue;
  const combinedBoundary = transaction === 'sale'
    ? (locale === 'ko'
        ? '매매 계약에는 신규·갱신 임대차 구분을 적용하지 않습니다.'
        : 'Rental new/renewal contract groups do not apply to reported sales.')
    : copy.combinedBoundary;
  const content = <>
      <div className={styles.publicSourceHeading}>
        <p>{copy.eyebrow}</p>
        <h2 id="public-source-boundary-heading">{copy.heading}</h2>
      </div>
      {model.evidence === null ? (
        <EvidenceEmptyStatePanel
          state={{
            ...createEvidenceEmptyState({ code: 'SOURCE_UNAVAILABLE', retryable: true }),
            title: copy.unavailableTitle,
            reason: copy.unavailableReason,
            nextAction: copy.unavailableAction,
          }}
        />
      ) : (
        <EvidenceDisclosure
          model={model.evidence}
          boundary={copy.boundary}
          attribution={model.attribution}
          locale={locale}
        />
      )}
      <details className={styles.publicSourceDetails}>
        <summary>{locale === 'ko' ? '필터·공개 기준 보기' : 'Filters and publication rules'}</summary>
        <dl>
        <div>
          <dt>{copy.registry}</dt>
          <dd>{registryValue}</dd>
        </div>
        <div>
          <dt>{copy.declaredPeriod}</dt>
          <dd>{model.period || copy.unavailablePeriod}</dd>
        </div>
        {transaction === 'sale' ? null : (
          <div>
            <dt>{copy.filedArea}</dt>
            <dd>{model.band}</dd>
          </div>
        )}
        <div>
          <dt>{copy.fixedFilter}</dt>
          <dd>{fixedFilterValue}</dd>
        </div>
        <div>
          <dt>{copy.publicationRule}</dt>
          <dd>{copy.publicationRuleValue} {model.publicationMinimum}.</dd>
        </div>
        {model.nextUpdate === null ? null : (
          <div>
            <dt>{copy.nextUpdate}</dt>
            <dd><time dateTime={model.nextUpdate.instant}>{model.nextUpdate.instant}</time></dd>
          </div>
        )}
        {model.geometryAttribution === undefined ? null : (
          <div>
            <dt>{copy.geometry}</dt>
            <dd>{model.geometryAttribution}</dd>
          </div>
        )}
        </dl>
        <p>{combinedBoundary}</p>
        <p>{copy.legalBoundary}</p>
      </details>
    </>;
  return (
    <section
      className={`${styles.publicSourceBoundary} ${compact ? styles.publicSourceBoundaryCompact : ''}`}
      aria-labelledby="public-source-boundary-heading"
    >
      {compact ? (
        <details className={styles.publicSourceCompactDisclosure}>
          <summary>{locale === 'ko' ? '출처 및 공개 기준' : 'Sources & limits'}</summary>
          <div>{content}</div>
        </details>
      ) : content}
    </section>
  );
}
