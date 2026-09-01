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
}: Readonly<{ model: PublicSourceBoundaryModel; locale?: ProductLocale }>) {
  const copy = PUBLIC_MARKET_COPY[locale].source;
  return (
    <section
      className={styles.publicSourceBoundary}
      aria-labelledby="public-source-boundary-heading"
    >
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
      <dl>
        <div>
          <dt>{copy.registry}</dt>
          <dd>{copy.registryValue}</dd>
        </div>
        <div>
          <dt>{copy.declaredPeriod}</dt>
          <dd>{model.period || copy.unavailablePeriod}</dd>
        </div>
        <div>
          <dt>{copy.filedArea}</dt>
          <dd>{model.band}</dd>
        </div>
        <div>
          <dt>{copy.fixedFilter}</dt>
          <dd>{copy.fixedFilterValue}</dd>
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
      <p>
        {copy.combinedBoundary}
      </p>
      <p>
        {copy.legalBoundary}
      </p>
    </section>
  );
}
