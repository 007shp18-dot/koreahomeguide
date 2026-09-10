import type { QuotePosition } from '@signedprice/market-core';

import styles from './public-market.module.css';
import { StrokeState, type StrokeStateName } from './stroke-state';

const STATE_BY_VERDICT = {
  'below-typical': 'hairline',
  'within-typical': 'filled',
  'above-typical': 'outlined',
} as const satisfies Readonly<Record<QuotePosition['verdict'], StrokeStateName>>;

function difference(value: number | null): string {
  if (value === null) return 'Difference from the median is unavailable';
  if (value === 0 || Object.is(value, -0)) return 'Equal to the median';
  return `${Math.abs(value).toLocaleString('en-US')}% ${
    value < 0 ? 'below' : 'above'
  } the median`;
}

export function VerdictLine({ position, formattedQuote }: Readonly<{
  position: QuotePosition | null;
  formattedQuote?: string;
}>) {
  if (position === null) {
    return (
      <div className={`${styles.marketEvidence} ${styles.verdictWithheld}`}>
        <StrokeState state="hatched" label="Market position withheld" />
        <p>More reported evidence is required before comparing a quote.</p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.marketEvidence} ${styles.verdictLine}`}
      data-verdict={position.verdict}
    >
      <StrokeState
        state={STATE_BY_VERDICT[position.verdict]}
        label={position.verdictLabel}
      />
      <p>
        {formattedQuote ? <strong>{formattedQuote}</strong> : null}
        <span>{difference(position.differencePct)}</span>
      </p>
    </div>
  );
}
