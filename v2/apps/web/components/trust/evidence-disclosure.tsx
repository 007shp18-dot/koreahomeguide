import type { EvidenceDescriptor } from '@signedprice/market-core';

import styles from './trust.module.css';

export function EvidenceDisclosure({
  model,
  boundary,
  attribution = [],
}: Readonly<{
  model: EvidenceDescriptor;
  boundary: string;
  attribution?: readonly string[];
}>) {
  return (
    <section className={styles.disclosure} aria-label="Evidence disclosure">
      <dl className={styles.disclosureGrid}>
        <div><dt>Source</dt><dd>{model.provider}</dd></div>
        <div><dt>Dataset</dt><dd>{model.dataset}</dd></div>
        <div><dt>Period</dt><dd>{model.period}</dd></div>
        <div>
          <dt>Generated</dt>
          <dd><time dateTime={model.generatedAt}>{model.generatedAt}</time></dd>
        </div>
        <div><dt>Method</dt><dd>{model.methodologyId}</dd></div>
        <div><dt>Rights</dt><dd>{model.rightsPolicyId}</dd></div>
        <div>
          <dt>Publication minimum</dt>
          <dd>{model.publicationMinimum ?? 'Not configured'}</dd>
        </div>
        <div><dt>Boundary</dt><dd>{boundary}</dd></div>
      </dl>
      {attribution.length === 0 ? null : (
        <p className={styles.attribution}>{attribution.join(', ')}</p>
      )}
    </section>
  );
}
