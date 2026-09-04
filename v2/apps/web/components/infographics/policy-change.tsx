import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

export function PolicyChangeInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  const values = spec.series.flatMap(({ values: seriesValues }) => seriesValues).slice(0, 2);
  return <InfographicFrame spec={spec}>
    <div className={styles.beforeAfter}>
      {values.map((datum, index) => <article key={`${datum.label}:${datum.value}`}>
        <span>{index === 0 ? 'Before' : 'After'}</span>
        <strong>{datum.label}</strong>
        <p>{formatInfographicValue(datum.value, spec.locale)} {spec.unit}</p>
        {datum.note === undefined ? null : <small>{datum.note}</small>}
      </article>)}
    </div>
  </InfographicFrame>;
}
