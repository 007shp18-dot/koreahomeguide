import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

function point(value: number, index: number, count: number, minimum: number, maximum: number): readonly [number, number] {
  const x = count === 1 ? 360 : 60 + (index / (count - 1)) * 600;
  const y = 220 - ((value - minimum) / Math.max(maximum - minimum, 1)) * 150;
  return [x, y];
}

export function MarketTrendInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  const values = spec.series.flatMap(({ values: seriesValues }) => seriesValues.map(({ value }) => value));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return <InfographicFrame spec={spec}>
    <div className={styles.chartScroll}>
      <svg className={styles.chart} viewBox="0 0 720 280" role="img" aria-label="Evidence chart">
        <line x1="60" y1="220" x2="660" y2="220" />
        {spec.series.map((series, seriesIndex) => {
          const points = series.values.map(({ value }, index) => point(value, index, series.values.length, minimum, maximum));
          return <g className={styles[`series${seriesIndex + 1}`]} key={series.id}>
            <polyline points={points.map(([x, y]) => `${x},${y}`).join(' ')} />
            {series.values.map((datum, index) => {
              const [x, y] = points[index]!;
              return <g className={index > 2 ? styles.chartOptional : undefined} key={`${series.id}:${datum.label}`}>
                <circle cx={x} cy={y} r="5" />
                <text x={x} y={Math.max(20, y - 13)} textAnchor="middle">{formatInfographicValue(datum.value, spec.locale)}</text>
                <text x={x} y="248" textAnchor="middle">{datum.label}</text>
              </g>;
            })}
          </g>;
        })}
      </svg>
    </div>
  </InfographicFrame>;
}
