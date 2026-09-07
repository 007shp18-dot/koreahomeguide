import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

function point(value: number, index: number, count: number, minimum: number, maximum: number, width: number): readonly [number, number] {
  const x = count === 1 ? width / 2 : 100 + (index / (count - 1)) * (width - 200);
  const y = 220 - ((value - minimum) / Math.max(maximum - minimum, 1)) * 150;
  return [x, y];
}

export function MarketTrendInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  const values = spec.series.flatMap(({ values: seriesValues }) => seriesValues.map(({ value }) => value));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const width = Math.max(720, ...spec.series.map(series => series.values.length * 180));
  return <InfographicFrame spec={spec}>
    <div className={styles.chartScroll}>
      <svg className={styles.chart} viewBox={`0 0 ${width} 280`} style={{ minWidth: width }} role="img" aria-label="Evidence chart">
        <line x1="100" y1="220" x2={width - 100} y2="220" />
        {spec.series.map((series, seriesIndex) => {
          const points = series.values.map(({ value }, index) => point(value, index, series.values.length, minimum, maximum, width));
          return <g className={styles[`series${seriesIndex + 1}`]} key={series.id}>
            <polyline points={points.map(([x, y]) => `${x},${y}`).join(' ')} />
            {series.values.map((datum, index) => {
              const [x, y] = points[index]!;
              return <g key={`${series.id}:${datum.label}`}>
                <circle cx={x} cy={y} r="5" />
                <text x={x} y={Math.max(20, y - 13)} textAnchor="middle">{formatInfographicValue(datum.value, spec.locale, spec.unit)}</text>
                {seriesIndex === 0 ? <text x={x} y="248" textAnchor="middle">{datum.label}</text> : null}
              </g>;
            })}
          </g>;
        })}
      </svg>
    </div>
  </InfographicFrame>;
}
