import Link from 'next/link';
import type { ReactNode } from 'react';

import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import styles from './infographic.module.css';

export function formatInfographicValue(value: number, locale: InfographicSpec['locale'], unit = ''): string {
  const normalized = unit === '亿韩元' ? 'KRW 100m' : unit === '新元/平方英尺' ? 'SGD psf' : unit;
  const money = normalized.match(/^(KRW|SGD|AED|USD)(?:\s+(100m|10k))?(.*)$/i);
  const scale = money?.[2] === '100m' ? 100_000_000 : money?.[2] === '10k' ? 10_000 : 1;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value * scale);
  if (money) {
    const suffix = money[3]!.trim().replace(/^psf$/, '/ft²');
    return `${money[1]!.toUpperCase()} ${number}${suffix}`;
  }
  if (normalized.startsWith('%')) return `${number}${normalized}`;
  return unit === '' ? number : `${number} ${unit}`;
}

export function InfographicFrame({ children, spec }: Readonly<{
  children: ReactNode;
  spec: InfographicSpec;
}>) {
  return <figure className={styles.frame} data-infographic-template={spec.template}>
    <figcaption className={styles.header}>
      <span>Data in focus</span>
      <h2>{spec.title}</h2>
      <p>{spec.accessibleSummary}</p>
    </figcaption>
    <div className={styles.visual}>{children}</div>
    <footer className={styles.footer}>
      <dl>
        <div><dt>Source</dt><dd>{spec.sourceLabel}</dd></div>
        <div><dt>Period</dt><dd><time dateTime={spec.period.start}>{spec.period.start}</time>{spec.period.end === spec.period.start ? null : <>–<time dateTime={spec.period.end}>{spec.period.end}</time></>}</dd></div>
        <div><dt>Sample</dt><dd>{spec.sampleLabel}</dd></div>
      </dl>
      {spec.conversionProvenance === null ? null : <p className={styles.conversion}>Conversion: {spec.conversionProvenance.note} · {spec.conversionProvenance.evidenceReleaseId}</p>}
      <details className={styles.dataTable}>
        <summary data-editorial-event="infographic_data_open" data-infographic-id={spec.id}>View the numbers</summary>
        <p>Evidence releases: {spec.evidenceReleaseIds.join(', ')}</p>
        <div><table>
          <caption>{spec.title}</caption>
          <thead><tr><th scope="col">Series</th><th scope="col">Label</th><th scope="col">Value</th><th scope="col">Evidence release</th></tr></thead>
          <tbody>{spec.series.flatMap((series) => series.values.map((datum) => <tr key={`${series.id}:${datum.label}`}>
            <th scope="row">{series.label}</th><td>{datum.label}</td><td>{formatInfographicValue(datum.value, spec.locale, spec.unit)}</td><td>{datum.evidenceReleaseId}</td>
          </tr>))}</tbody>
        </table></div>
      </details>
      {spec.relatedHref === null ? null : <Link className={styles.related} href={spec.relatedHref}>Explore related data</Link>}
    </footer>
  </figure>;
}
