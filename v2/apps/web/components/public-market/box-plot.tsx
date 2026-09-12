import { useId, type CSSProperties } from 'react';
import type {
  PublicMarketSummary,
  QuotePositionAxis,
} from '@signedprice/market-core';

import {
  PUBLIC_MARKET_COPY,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import styles from './public-market.module.css';

type PlotStyle = CSSProperties & Record<`--${string}`, string>;
type PlotLabelKey = 'p25' | 'median' | 'p75';
type PlotLane = 0 | 1 | 2;

export type PlotLanePoint = Readonly<{ key: PlotLabelKey; pct: number }>;

const preferredLanes: Readonly<Record<PlotLabelKey, PlotLane>> = Object.freeze({
  p25: 0,
  median: 1,
  p75: 0,
});

export function assignPlotLanes(
  points: readonly PlotLanePoint[],
): Record<PlotLabelKey, PlotLane> {
  const lanePoints: number[][] = [[], [], []];
  const result = {} as Record<PlotLabelKey, PlotLane>;
  for (const current of [...points].sort((left, right) => left.pct - right.pct)) {
    const preferred = preferredLanes[current.key];
    const candidates = [preferred, 0, 1, 2].filter(
      (lane, index, all): lane is PlotLane => all.indexOf(lane) === index,
    );
    const lane = candidates.find((candidate) =>
      lanePoints[candidate]!.every((placed) => Math.abs(placed - current.pct) >= 8),
    ) ?? 2;
    lanePoints[lane]!.push(current.pct);
    result[current.key] = lane;
  }
  return result;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * A market quote axis is useful for comparing input values, but it can be
 * narrower than an observed sale cohort. Expand it for the plot so published
 * evidence is never clipped at 0% or 100%.
 */
export function axisForSummary(
  summary: PublicMarketSummary,
  fallback: QuotePositionAxis,
): QuotePositionAxis {
  if (!summary.published) return fallback;
  const values = [summary.min, summary.p25, summary.med, summary.p75, summary.max];
  if (values.some((value) => !Number.isFinite(value))) return fallback;

  const min = Math.min(fallback.min, summary.min);
  const max = Math.max(fallback.max, summary.max);
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max <= min
  ) {
    return fallback;
  }
  return { min, max };
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
  variant = 'full',
  locale = 'en',
}: Readonly<{
  summary: PublicMarketSummary;
  axis: QuotePositionAxis;
  formatValue: (value: number) => string;
  markerPct?: number;
  markerLabel?: string;
  variant?: 'full' | 'compact';
  locale?: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].plot;
  const descriptionId = useId();
  const count = locale === 'ko'
    ? `${summary.n.toLocaleString('ko-KR')}${summary.n === 1 ? copy.countOne : copy.countMany}`
    : `${summary.n.toLocaleString('en-US')} ${summary.n === 1 ? copy.countOne : copy.countMany}`;

  if (!summary.published) {
    return (
      <figure
        className={`${styles.marketEvidence} ${styles.withheldPlot} ${
          variant === 'compact' ? styles.compactPlot : ''
        }`}
        data-evidence-state="withheld"
        data-plot-variant={variant}
        aria-describedby={descriptionId}
      >
        <div className={styles.withheldHatch} aria-hidden="true" />
        <figcaption id={descriptionId} className={styles.withheldCopy}>
          <strong>{count}</strong>
          <span>{copy.withheld}</span>
        </figcaption>
      </figure>
    );
  }

  const plotAxis = axisForSummary(summary, axis);
  const showMarker = markerPct !== undefined && Number.isFinite(markerPct) && markerLabel;
  const plotStyle: PlotStyle = {
    '--min-pct': pct(point(summary.min, plotAxis)),
    '--p25-pct': pct(point(summary.p25, plotAxis)),
    '--med-pct': pct(point(summary.med, plotAxis)),
    '--p75-pct': pct(point(summary.p75, plotAxis)),
    '--max-pct': pct(point(summary.max, plotAxis)),
  };
  if (showMarker) {
    const quoteValue = Number.isFinite(axis.min) && Number.isFinite(axis.max) && axis.max > axis.min
      ? axis.min + (clamp(markerPct!, 0, 100) / 100) * (axis.max - axis.min)
      : Number.NaN;
    plotStyle['--marker-pct'] = pct(point(quoteValue, plotAxis));
  }
  const positions = Object.freeze({
    p25: point(summary.p25, plotAxis),
    median: point(summary.med, plotAxis),
    p75: point(summary.p75, plotAxis),
  });
  const lanes = assignPlotLanes([
    { key: 'p25', pct: positions.p25 },
    { key: 'median', pct: positions.median },
    { key: 'p75', pct: positions.p75 },
  ]);
  const middleLabels = [
    { key: 'p25', label: copy.p25, shortLabel: 'P25', value: summary.p25 },
    { key: 'median', label: copy.median, shortLabel: copy.median, value: summary.med },
    { key: 'p75', label: copy.p75, shortLabel: 'P75', value: summary.p75 },
  ] as const;

  return (
    <figure
      className={`${styles.marketEvidence} ${styles.boxPlot} ${
        variant === 'compact' ? styles.compactPlot : ''
      }`}
      data-evidence-state="published"
      data-plot-variant={variant}
      aria-describedby={descriptionId}
      style={plotStyle}
    >
      <div className={styles.plotCanvas}>
        <span className={styles.whisker} aria-hidden="true" />
        <span className={styles.interquartile} aria-hidden="true" />
        <span className={styles.medianLine} aria-hidden="true" />
        {showMarker ? (
          <span className={styles.quoteMarker} data-quote-marker="true" aria-hidden="true" />
        ) : null}
      </div>
      <div className={styles.plotLegend} data-plot-layout="legend">
        <span data-plot-label="min"><small>{copy.minimum}</small><strong>{formatValue(summary.min)}</strong></span>
        {middleLabels.map(({ key, label, value }) => (
          <span
            className={key === 'median' ? styles.medianAnnotation : ''}
            data-plot-label={key}
            data-plot-lane={lanes[key]}
            key={key}
          >
            <small>{label}</small><strong>{formatValue(value)}</strong>
          </span>
        ))}
        <span data-plot-label="max"><small>{copy.maximum}</small><strong>{formatValue(summary.max)}</strong></span>
      </div>
      {showMarker ? <p className={styles.plotQuoteLegend} data-plot-label="quote">
        <span aria-hidden="true" /> <strong>{markerLabel}</strong>
      </p> : null}
      <figcaption id={descriptionId} className={styles.plotCaption}>
        <strong>{count}</strong>
        <span>
          {copy.middleHalf} {formatValue(summary.p25)}–{formatValue(summary.p75)}.
          {showMarker ? ` ${markerLabel} ${copy.marked}` : ''}
        </span>
        <span className={styles.screenReaderDescription}>
          {copy.minimum} {formatValue(summary.min)}. {copy.p25} {formatValue(summary.p25)}.
          {copy.median} {formatValue(summary.med)}. {copy.p75} {formatValue(summary.p75)}.
          {copy.maximum} {formatValue(summary.max)}.
        </span>
      </figcaption>
    </figure>
  );
}
