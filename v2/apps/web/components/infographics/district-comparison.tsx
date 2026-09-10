import type { CSSProperties } from 'react';
import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

export function DistrictComparisonInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  const points = spec.series.flatMap((series) => series.values.map((datum) => ({ series, datum })));
  const maximum = Math.max(...points.map(({ datum }) => Math.max(0, datum.value)), 0);
  const minimum = Math.min(0, ...points.map(({ datum }) => datum.value));
  const span = maximum - minimum || 1;
  const zero = -minimum / span * 100;
  return <InfographicFrame spec={spec}>
    <div className={styles.comparisonRows} role="img" aria-label={spec.accessibleSummary}>
      {points.map(({ series, datum }) => <div className={styles.comparisonRow} key={`${series.id}:${datum.label}`}>
        <div><span>{spec.series.length > 1 ? `${series.label} · ` : ''}{datum.label}</span><strong>{formatInfographicValue(datum.value, spec.locale, spec.unit)}</strong></div>
        <div className={styles.comparisonTrack} aria-hidden="true" style={{ '--chart-zero': `${zero}%` } as CSSProperties}>
          <i style={{ left: `${(Math.min(0, datum.value) - minimum) / span * 100}%`, width: `${Math.abs(datum.value) / span * 100}%` }} />
        </div>
        {datum.note ? <p>{datum.note}</p> : null}
      </div>)}
    </div>
  </InfographicFrame>;
}
