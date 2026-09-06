import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

export function DistrictComparisonInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  const points = spec.series.flatMap((series) => series.values.map((datum) => ({ series, datum })));
  const maximum = Math.max(...points.map(({ datum }) => Math.max(0, datum.value)), 1);
  const minimum = Math.min(0, ...points.map(({ datum }) => datum.value));
  const scale = 280 / (maximum - minimum);
  const zero = 190 - minimum * scale;
  const height = Math.max(180, points.length * 54 + 28);
  return <InfographicFrame spec={spec}>
    <div className={styles.chartScroll}>
      <svg className={styles.chart} viewBox={`0 0 720 ${height}`} role="img" aria-label="Evidence chart">
        {minimum < 0 ? <line x1={zero} y1="4" x2={zero} y2={height - 8} /> : null}
        {points.map(({ series, datum }, index) => {
          const y = index * 54 + 16;
          const width = Math.abs(datum.value) * scale;
          const x = datum.value < 0 ? zero - width : zero;
          return <g key={`${series.id}:${datum.label}`}>
            <text x="0" y={y + 18}>{datum.label}</text>
            <rect x={x} y={y} width={width} height="28" rx="2" />
            <text x={Math.min(690, zero + Math.max(0, datum.value) * scale + 12)} y={y + 19}>{formatInfographicValue(datum.value, spec.locale)} {spec.unit}</text>
          </g>;
        })}
      </svg>
    </div>
  </InfographicFrame>;
}
