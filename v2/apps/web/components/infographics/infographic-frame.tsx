import Link from 'next/link';
import type { ReactNode } from 'react';

import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import styles from './infographic.module.css';

export function formatInfographicValue(value: number, locale: InfographicSpec['locale']): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export function InfographicFrame({ children, spec }: Readonly<{
  children: ReactNode;
  spec: InfographicSpec;
}>) {
  return <figure className={styles.frame} data-infographic-template={spec.template}>
    <figcaption className={styles.header}>
      <span>SignedPrice infographic</span>
      <h2>{spec.title}</h2>
      <p>{spec.accessibleSummary}</p>
    </figcaption>
    <div className={styles.visual}>{children}</div>
    <footer className={styles.footer}>
      <dl>
        <div><dt>Source</dt><dd>{spec.sourceLabel}</dd></div>
        <div><dt>Period</dt><dd><time dateTime={spec.period.start}>{spec.period.start}</time>–<time dateTime={spec.period.end}>{spec.period.end}</time></dd></div>
        <div><dt>Sample</dt><dd>{spec.sampleLabel}</dd></div>
        <div><dt>Evidence releases</dt><dd>{spec.evidenceReleaseIds.join(', ')}</dd></div>
      </dl>
      {spec.conversionProvenance === null ? null : <p className={styles.conversion}>Conversion: {spec.conversionProvenance.note} · {spec.conversionProvenance.evidenceReleaseId}</p>}
      <details className={styles.dataTable}>
        <summary data-editorial-event="infographic_data_open" data-infographic-id={spec.id}>Open accessible data table</summary>
        <div><table>
          <caption>{spec.title} · unit {spec.unit}</caption>
          <thead><tr><th scope="col">Series</th><th scope="col">Label</th><th scope="col">Value</th><th scope="col">Evidence release</th></tr></thead>
          <tbody>{spec.series.flatMap((series) => series.values.map((datum) => <tr key={`${series.id}:${datum.label}`}>
            <th scope="row">{series.label}</th><td>{datum.label}</td><td>{datum.value}</td><td>{datum.evidenceReleaseId}</td>
          </tr>))}</tbody>
        </table></div>
      </details>
      {spec.relatedHref === null ? null : <Link className={styles.related} href={spec.relatedHref}>Explore the related evidence <span aria-hidden="true">→</span></Link>}
    </footer>
  </figure>;
}
