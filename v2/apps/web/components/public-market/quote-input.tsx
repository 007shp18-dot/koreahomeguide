'use client';

import { useId, useMemo, useState } from 'react';
import {
  positionQuote,
  type PublicMarketConfig,
  type PublicMarketSummary,
  type QuotePosition,
  type QuotePositionAxis,
} from '@signedprice/market-core';

import { BoxPlot } from './box-plot';
import styles from './public-market.module.css';
import { VerdictLine } from './verdict-line';

export type ParsedPublicQuote =
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'invalid' }>
  | Readonly<{ status: 'valid'; value: number }>;

export type PublicQuoteViewModel = Readonly<{
  draft: string;
  parsed: ParsedPublicQuote;
  position: QuotePosition | null;
  error: string | null;
}>;

const INVALID_QUOTE_COPY =
  'Enter a non-negative amount with up to two decimal places, without commas.';

export function parsePublicQuoteInput(
  raw: string,
  multiplier: number,
): ParsedPublicQuote {
  if (raw === '') return { status: 'empty' };
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(raw)) return { status: 'invalid' };
  const [whole, fraction = ''] = raw.split('.');
  const scale = 10 ** fraction.length;
  const decimalInteger = Number(`${whole}${fraction}`);
  const scaledValue = decimalInteger * multiplier;
  return Number.isSafeInteger(scaledValue) && scaledValue % scale === 0
    ? { status: 'valid', value: scaledValue / scale }
    : { status: 'invalid' };
}

export function buildPublicQuoteViewModel(
  summary: PublicMarketSummary,
  draft: string,
  axis: QuotePositionAxis,
  multiplier: number,
): PublicQuoteViewModel {
  const parsed = parsePublicQuoteInput(draft, multiplier);
  return {
    draft,
    parsed,
    position: summary.published && parsed.status === 'valid'
      ? positionQuote(summary, parsed.value, axis)
      : null,
    error: parsed.status === 'invalid' ? INVALID_QUOTE_COPY : null,
  };
}

function valueFormatter(config: PublicMarketConfig): (value: number) => string {
  const formatter = new Intl.NumberFormat(config.formatLocale, {
    style: 'currency',
    currency: config.currencyCode,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  });
  return (value) => formatter.format(value);
}

function medianComparison(position: QuotePosition, areaLabel: string): string {
  const differencePct = position.differencePct;
  if (differencePct === null) {
    return `The difference from the reported median for ${areaLabel} is unavailable.`;
  }
  const relation = differencePct === 0 || Object.is(differencePct, -0)
    ? 'equal to'
    : differencePct < 0 ? 'below' : 'above';
  return `This typed deposit is ${relation} the reported median for ${areaLabel}.`;
}

export function QuoteInput({
  config,
  summary,
  initialQuote,
  areaLabel = config.marketLabel,
  showMedianFaq = false,
}: Readonly<{
  config: PublicMarketConfig;
  summary: PublicMarketSummary;
  initialQuote?: string;
  areaLabel?: string;
  showMedianFaq?: boolean;
}>) {
  const [area, setArea] = useState(summary.area);
  const [quoteDraft, setQuoteDraft] = useState(
    initialQuote ?? (
      summary.published ? String(summary.med / config.quoteInputMultiplier) : ''
    ),
  );
  const errorId = useId();
  const view = buildPublicQuoteViewModel(
    summary,
    quoteDraft,
    config.axis,
    config.quoteInputMultiplier,
  );
  const formatValue = useMemo(
    () => valueFormatter(config),
    [config],
  );

  return (
    <section className={`${styles.marketEvidence} ${styles.quoteIsland}`} aria-label="Quote position">
      <div className={styles.quoteFields}>
        <label className={styles.quoteField}>
          <span>Area</span>
          <select
            className={styles.quoteControl}
            name="area"
            value={area}
            onChange={(event) => setArea(event.currentTarget.value)}
          >
            <option value={summary.area}>{areaLabel}</option>
          </select>
        </label>
        <label className={styles.quoteField}>
          <span>
            {config.quoteLabel}
            <small>{config.quoteUnit}</small>
          </span>
          <input
            className={styles.quoteControl}
            name="quote"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck="false"
            value={quoteDraft}
            aria-invalid={view.error === null ? undefined : true}
            aria-describedby={view.error === null ? undefined : errorId}
            onChange={(event) => setQuoteDraft(event.currentTarget.value)}
          />
        </label>
      </div>
      {view.error === null ? null : (
        <p className={styles.quoteError} id={errorId} role="alert">{view.error}</p>
      )}
      <div className={styles.quoteResult} aria-live="polite">
        <BoxPlot
          summary={summary}
          axis={config.axis}
          formatValue={formatValue}
          markerPct={view.position?.markerPct}
          markerLabel={view.position === null ? undefined : 'Your quote'}
        />
        {summary.published ? (
          view.position === null ? null : (
            <VerdictLine
              position={view.position}
              formattedQuote={formatValue(view.position.quote)}
            />
          )
        ) : (
          <VerdictLine position={null} />
        )}
        {showMedianFaq && view.position !== null ? (
          <p className={styles.medianComparison} data-median-comparison="true">
            {medianComparison(view.position, areaLabel)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
