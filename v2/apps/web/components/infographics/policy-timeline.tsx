import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

export function PolicyTimelineInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  return <InfographicFrame spec={spec}>
    <ol className={styles.timeline}>
      {spec.series.flatMap(({ id, values }) => values.map((datum) => <li key={`${id}:${datum.label}`}>
        <span>{datum.label}</span>
        <strong>{formatInfographicValue(datum.value, spec.locale)} {spec.unit}</strong>
        {datum.note === undefined ? null : <p>{datum.note}</p>}
      </li>))}
    </ol>
  </InfographicFrame>;
}
