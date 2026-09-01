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
  const span = Math.max(1, last.deposit - first.deposit);
  const domainMinimum = Math.max(0, first.deposit - span * 0.1);
  const domainMaximum = last.deposit + span * 0.1;
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
  const firstX = x(first.deposit);
  const lastX = x(last.deposit);

  return (
    <figure className={styles.curve} aria-label={copy.ariaLabel}>
      <figcaption>
        <strong>{copy.heading}</strong>
        <span>{copy.description}</span>
      </figcaption>
      <div className={styles.curvePlot}>
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100">
          <defs>
            <pattern
              height="4"
              id="contract-held-hatch"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
              width="4"
            >
              <line className={styles.curveHatchLine} x1="0" x2="0" y1="0" y2="4" />
            </pattern>
          </defs>
          <rect
            className={styles.curveHeldBand}
            data-range-segment="held"
            height="76"
            width={firstX - 5}
            x="5"
            y="8"
          />
          <rect
            className={styles.curveHeldBand}
            data-range-segment="held"
            height="76"
            width={95 - lastX}
            x={lastX}
            y="8"
          />
          <line className={styles.curveAxis} x1="5" x2="95" y1="84" y2="84" />
          <line className={styles.curveBoundary} x1={firstX} x2={firstX} y1="8" y2="84" />
          <polyline className={styles.curveMeasured} points={points} />
          <line className={styles.curveBoundary} x1={lastX} x2={lastX} y1="8" y2="84" />
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
      <p className={styles.heldNotice}>{copy.heldNotice}</p>
    </figure>
  );
}
