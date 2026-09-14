'use client';
import { useChartWidth } from '../market-ui/use-chart-width';
import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

function point(value: number, index: number, count: number, minimum: number, maximum: number, width: number): readonly [number, number] {
  const x = count === 1 ? width / 2 : 44 + (index / (count - 1)) * (width - 88);
  const y = 220 - ((value - minimum) / Math.max(maximum - minimum, 1)) * 150;
  return [x, y];
}

export function MarketTrendInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  const { ref, width } = useChartWidth();
  const values = spec.series.flatMap(({ values: seriesValues }) => seriesValues.map(({ value }) => value));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return <InfographicFrame spec={spec}>
    <div ref={ref} className={styles.chartScroll}>
      <svg className={styles.chart} viewBox={`0 0 ${width} 280`} style={{ minWidth: 0 }} role="img" aria-label={spec.accessibleSummary}>
        <line x1="44" y1="220" x2={width - 44} y2="220" />
        {spec.series.map((series, seriesIndex) => {
          const points = series.values.map(({ value }, index) => point(value, index, series.values.length, minimum, maximum, width));
          return <g className={styles[`series${seriesIndex + 1}`]} key={series.id}>
            <polyline points={points.map(([x, y]) => `${x},${y}`).join(' ')} />
            {series.values.map((datum, index) => {
              const [x, y] = points[index]!;
              return <g key={`${series.id}:${datum.label}`}>
                <circle cx={x} cy={y} r="5" />
                {(index === 0 || index === series.values.length - 1) && <text x={x} y={Math.max(20, y - 13)} textAnchor={index === 0 ? "start" : "end"}>{formatInfographicValue(datum.value, spec.locale, spec.unit)}</text>}
                {seriesIndex === 0 && (width >= 600 || index === 0 || index === series.values.length - 1) ? <text x={x} y="248" textAnchor={index === 0 ? "start" : index === series.values.length - 1 ? "end" : "middle"}>{datum.label}</text> : null}
              </g>;
            })}
          </g>;
        })}
      </svg>
    </div>
  </InfographicFrame>;
}
