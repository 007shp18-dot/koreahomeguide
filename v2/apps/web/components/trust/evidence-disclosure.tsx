import type { EvidenceDescriptor } from '@signedprice/market-core';

import {
  PUBLIC_MARKET_COPY,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import styles from './trust.module.css';

export function EvidenceDisclosure({
  model,
  boundary,
  attribution = [],
  locale = 'en',
}: Readonly<{
  model: EvidenceDescriptor;
  boundary: string;
  attribution?: readonly string[];
  locale?: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].source;
  const [source, dataset, period, generated, method, rights, publicationMinimum, boundaryLabel]
    = copy.disclosureLabels;
  const datasetValue = locale === 'ko' && model.dataset === 'reported rent contracts'
    ? '신고 임대차 계약'
    : model.dataset;
  const localizedAttribution = attribution.map((value) => (
    locale === 'ko' && value === 'Ministry of Land, Infrastructure and Transport (MOLIT)'
      ? '국토교통부(MOLIT)'
      : value
  ));
  return (
    <details className={styles.disclosure} aria-label={copy.disclosureAria}>
      <summary className={styles.disclosureSummary}>
        <span><strong>{model.provider}</strong><small>{datasetValue}</small></span>
        <span><strong>{model.period || (locale === 'ko' ? '기간 미수집' : 'Period unavailable')}</strong><small>{locale === 'ko' ? '출처·방법 보기' : 'Source & method'}</small></span>
      </summary>
      <div className={styles.disclosureBody}>
        <dl className={styles.disclosureGrid}>
        <div><dt>{source}</dt><dd>{model.provider}</dd></div>
        <div><dt>{dataset}</dt><dd>{datasetValue}</dd></div>
        <div><dt>{period}</dt><dd>{model.period}</dd></div>
        <div>
          <dt>{generated}</dt>
          <dd><time dateTime={model.generatedAt}>{model.generatedAt}</time></dd>
        </div>
        <div><dt>{method}</dt><dd>{model.methodologyId}</dd></div>
        <div><dt>{rights}</dt><dd>{model.rightsPolicyId}</dd></div>
        <div>
          <dt>{publicationMinimum}</dt>
          <dd>{model.publicationMinimum ?? (locale === 'ko' ? '설정되지 않음' : 'Not configured')}</dd>
        </div>
        <div><dt>{boundaryLabel}</dt><dd>{boundary}</dd></div>
        </dl>
        {localizedAttribution.length === 0 ? null : (
          <p className={styles.attribution}>{localizedAttribution.join(', ')}</p>
        )}
      </div>
    </details>
  );
}
