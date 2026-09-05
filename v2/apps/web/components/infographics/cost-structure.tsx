import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

export function CostStructureInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  const maximum = Math.max(...spec.series.flatMap(({ values }) => values.map(({ value }) => Math.max(0, value))), 1);
  return <InfographicFrame spec={spec}>
    <div className={styles.costStructure}>
      {spec.series.map((series) => <section key={series.id}>
        <h3>{series.label}</h3>
        {series.values.map((datum) => <div key={`${series.id}:${datum.label}`}>
          <p><span>{datum.label}</span><strong>{formatInfographicValue(datum.value, spec.locale)} {spec.unit}</strong></p>
          <i aria-hidden="true" style={{ '--infographic-share': `${Math.max(0, datum.value) / maximum * 100}%` } as React.CSSProperties} />
        </div>)}
      </section>)}
    </div>
  </InfographicFrame>;
}
