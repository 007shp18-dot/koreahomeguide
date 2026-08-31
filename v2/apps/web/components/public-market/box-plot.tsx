import { useId, type CSSProperties } from 'react';
import type {
  PublicMarketSummary,
  QuotePositionAxis,
} from '@signedprice/market-core';

import styles from './public-market.module.css';

type PlotStyle = CSSProperties & Record<`--${string}`, string>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function point(value: number, axis: QuotePositionAxis): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(axis.min) ||
    !Number.isFinite(axis.max) ||
    axis.max <= axis.min
  ) {
    return 0;
  }
  return clamp(((value - axis.min) / (axis.max - axis.min)) * 100, 0, 100);
}

function pct(value: number): string {
  const stable = Math.round(value * 10_000) / 10_000;
  return `${stable}%`;
}

export function BoxPlot({
  summary,
  axis,
  formatValue,
  markerPct,
  markerLabel,
}: Readonly<{
  summary: PublicMarketSummary;
  axis: QuotePositionAxis;
  formatValue: (value: number) => string;
  markerPct?: number;
  markerLabel?: string;
}>) {
  const descriptionId = useId();
  const count = `${summary.n.toLocaleString('en-US')} reported ${
    summary.n === 1 ? 'contract' : 'contracts'
  }`;

  if (!summary.published) {
    return (
      <figure
        className={`${styles.marketEvidence} ${styles.withheldPlot}`}
        data-evidence-state="withheld"
        aria-describedby={descriptionId}
      >
        <div className={styles.withheldHatch} aria-hidden="true" />
        <figcaption id={descriptionId} className={styles.withheldCopy}>
          <strong>{count}</strong>
          <span>At least 5 are required before any market range is published.</span>
        </figcaption>
      </figure>
    );
  }

  const plotStyle: PlotStyle = {
    '--min-pct': pct(point(summary.min, axis)),
    '--p25-pct': pct(point(summary.p25, axis)),
    '--med-pct': pct(point(summary.med, axis)),
    '--p75-pct': pct(point(summary.p75, axis)),
    '--max-pct': pct(point(summary.max, axis)),
  };
  const showMarker = markerPct !== undefined && Number.isFinite(markerPct) && markerLabel;
  if (showMarker) plotStyle['--marker-pct'] = pct(clamp(markerPct, 0, 100));

  const labels = [
    ['Minimum', summary.min],
    ['25th percentile', summary.p25],
    ['Median', summary.med],
    ['75th percentile', summary.p75],
    ['Maximum', summary.max],
  ] as const;

  return (
    <figure
      className={`${styles.marketEvidence} ${styles.boxPlot}`}
      data-evidence-state="published"
      aria-describedby={descriptionId}
      style={plotStyle}
    >
      <div className={styles.plotCanvas} aria-hidden="true">
        <span className={styles.whisker} />
        <span className={styles.interquartile} />
        <span className={styles.medianLine} />
        {showMarker ? (
          <span className={styles.quoteMarker} data-quote-marker="true" />
        ) : null}
      </div>
      <dl className={styles.plotLabels}>
        {labels.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
      <figcaption id={descriptionId} className={styles.plotCaption}>
        <strong>{count}</strong>
        <span>
          Distribution from {formatValue(summary.min)} to {formatValue(summary.max)}.
          {showMarker ? ` ${markerLabel} is marked on the same axis.` : ''}
        </span>
      </figcaption>
    </figure>
  );
}
