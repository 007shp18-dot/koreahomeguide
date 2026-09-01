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

  const plotStyle: PlotStyle = {
    '--min-pct': pct(point(summary.min, axis)),
    '--p25-pct': pct(point(summary.p25, axis)),
    '--med-pct': pct(point(summary.med, axis)),
    '--p75-pct': pct(point(summary.p75, axis)),
    '--max-pct': pct(point(summary.max, axis)),
  };
  const showMarker = markerPct !== undefined && Number.isFinite(markerPct) && markerLabel;
  if (showMarker) plotStyle['--marker-pct'] = pct(clamp(markerPct, 0, 100));
  const positions = Object.freeze({
    p25: point(summary.p25, axis),
    median: point(summary.med, axis),
    p75: point(summary.p75, axis),
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
        <span
          className={`${styles.plotAnnotation} ${styles.endpointAnnotation} ${styles.minimumAnnotation}`}
          data-plot-label="min"
          style={{ '--label-pct': plotStyle['--min-pct'] } as PlotStyle}
        >
          <small><span className={styles.endpointLong}>{copy.minimum}</span><span className={styles.endpointShort}>{copy.minimumShort}</span></small>
          <strong>{formatValue(summary.min)}</strong>
        </span>
        {middleLabels.map(({ key, label, shortLabel, value }) => (
          <span
            className={`${styles.plotAnnotation} ${styles.middleAnnotation} ${
              key === 'median' ? styles.medianAnnotation : ''
            }`}
            data-plot-label={key}
            data-plot-lane={lanes[key]}
            key={key}
            style={{
              '--label-pct': pct(positions[key]),
              '--label-lane': String(lanes[key]),
            } as PlotStyle}
          >
            <small><span className={styles.quartileLong}>{label}</span><span className={styles.quartileShort}>{shortLabel}</span></small>
            <strong>{formatValue(value)}</strong>
          </span>
        ))}
        <span
          className={`${styles.plotAnnotation} ${styles.endpointAnnotation} ${styles.maximumAnnotation}`}
          data-plot-label="max"
          style={{ '--label-pct': plotStyle['--max-pct'] } as PlotStyle}
        >
          <small><span className={styles.endpointLong}>{copy.maximum}</span><span className={styles.endpointShort}>{copy.maximumShort}</span></small>
          <strong>{formatValue(summary.max)}</strong>
        </span>
        {showMarker ? (
          <span
            className={`${styles.plotAnnotation} ${styles.quoteAnnotation}`}
            data-plot-label="quote"
            style={{ '--label-pct': plotStyle['--marker-pct'] } as PlotStyle}
          >
            <small>{markerLabel}</small>
          </span>
        ) : null}
      </div>
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
