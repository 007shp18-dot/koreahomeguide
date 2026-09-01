import type { KoreaConversionCurveProjection } from '@signedprice/korea-rent';
import type { RentContractComparison } from '@signedprice/market-core';

import {
  CONTRACT_CHECK_COPY,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import styles from './contract-check.module.css';

const compactWon = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function percent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export function ConversionCurve({
  curve,
  comparison,
  locale = 'en',
}: Readonly<{
  curve: KoreaConversionCurveProjection;
  comparison: RentContractComparison;
  locale?: ProductLocale;
}>) {
  const copy = CONTRACT_CHECK_COPY[locale].curve;
  const first = curve.anchors[0]!;
  const last = curve.anchors.at(-1)!;
  const deposits = comparison.offers.map(({ offer }) => offer.deposit);
  const rawMinimum = Math.min(first.deposit, ...deposits);
  const rawMaximum = Math.max(last.deposit, ...deposits);
  const span = Math.max(1, rawMaximum - rawMinimum);
  const domainMinimum = Math.max(0, rawMinimum - span * 0.06);
  const domainMaximum = rawMaximum + span * 0.06;
  const domainSpan = domainMaximum - domainMinimum;
  const rates = curve.anchors.map(({ annualRate }) => annualRate);
  const rateMinimum = Math.min(...rates);
  const rateMaximum = Math.max(...rates);
  const rateSpan = Math.max(0.0001, rateMaximum - rateMinimum);
  const x = (deposit: number) => 5 + ((deposit - domainMinimum) / domainSpan) * 90;
  const y = (rate: number) => 84 - ((rate - rateMinimum) / rateSpan) * 68;
  const points = curve.anchors
    .map((anchor) => `${x(anchor.deposit).toFixed(2)},${y(anchor.annualRate).toFixed(2)}`)
    .join(' ');
  const heldBelow = rawMinimum < first.deposit;
  const heldAbove = rawMaximum > last.deposit;

  return (
    <figure className={styles.curve} aria-label={copy.ariaLabel}>
      <figcaption>
        <strong>{copy.heading}</strong>
        <span>{copy.description}</span>
      </figcaption>
      <div className={styles.curvePlot}>
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100">
          <line className={styles.curveAxis} x1="5" x2="95" y1="84" y2="84" />
          {heldBelow ? (
            <line
              className={styles.curveHeld}
              data-range-segment="held"
              x1={x(rawMinimum)}
              x2={x(first.deposit)}
              y1={y(first.annualRate)}
              y2={y(first.annualRate)}
            />
          ) : null}
          <polyline className={styles.curveMeasured} points={points} />
          {heldAbove ? (
            <line
              className={styles.curveHeld}
              data-range-segment="held"
              x1={x(last.deposit)}
              x2={x(rawMaximum)}
              y1={y(last.annualRate)}
              y2={y(last.annualRate)}
            />
          ) : null}
          {comparison.offers.map((offer) => (
            <g key={offer.offer.id}>
              <line
                className={styles.curveMarkerLine}
                x1={x(offer.offer.deposit)}
                x2={x(offer.offer.deposit)}
                y1={y(offer.appliedRate.annualRate)}
                y2="84"
              />
              <circle
                className={styles.curveMarker}
                cx={x(offer.offer.deposit)}
                cy={y(offer.appliedRate.annualRate)}
                r="2.4"
              />
            </g>
          ))}
        </svg>
        {curve.anchors.map((anchor) => (
          <span
            className={styles.curveLabel}
            data-curve-label="true"
            key={anchor.deposit}
            style={{ left: `${x(anchor.deposit)}%`, top: `${y(anchor.annualRate)}%` }}
          >
            <strong>{percent(anchor.annualRate)}</strong>
            <small>{compactWon.format(anchor.deposit)}</small>
          </span>
        ))}
        {comparison.offers.map((offer) => (
          <span
            className={styles.curveCallout}
            data-marker-deposit={offer.offer.deposit}
            data-offer-marker={offer.offer.id}
            key={offer.offer.id}
            style={{ left: `${x(offer.offer.deposit)}%` }}
          >
            {offer.offer.id.toUpperCase()} · {compactWon.format(offer.offer.deposit)}
          </span>
        ))}
      </div>
      {comparison.offers.some(({ appliedRate }) => appliedRate.rangeState !== 'observed') ? (
        <p className={styles.heldNotice}>{copy.heldNotice}</p>
      ) : null}
    </figure>
  );
}
