import type { ProductLocale } from '../../lib/locale/product-copy';
import { widgetText } from '../../lib/locale/public-widget-copy';
import type { QuotePosition } from '@signedprice/market-core';

import styles from './public-market.module.css';
import { StrokeState, type StrokeStateName } from './stroke-state';

const STATE_BY_VERDICT = {
  'below-typical': 'hairline',
  'within-typical': 'filled',
  'above-typical': 'outlined',
} as const satisfies Readonly<Record<QuotePosition['verdict'], StrokeStateName>>;

function difference(value: number | null, locale: ProductLocale): string {
  const t = (text: string) => widgetText(locale, text);
  if (value !== null && value !== 0 && locale !== 'en') return locale === 'ko' ? `중앙값보다 ${Math.abs(value).toLocaleString(locale)}% ${value < 0 ? '낮음' : '높음'}` : `${value < 0 ? '低于' : '高于'}中位数${Math.abs(value).toLocaleString(locale)}%`;
  if (value === null) return t('Difference from the median is unavailable');
  if (value === 0 || Object.is(value, -0)) return t('Equal to the median');
  return `${Math.abs(value).toLocaleString('en-US')}% ${
    value < 0 ? 'below' : 'above'
  } the median`;
}

export function VerdictLine({ locale = 'en', position, formattedQuote }: Readonly<{
  locale?: ProductLocale;
  position: QuotePosition | null;
  formattedQuote?: string;
}>) {
  const t = (text: string) => widgetText(locale, text);
  if (position === null) {
    return (
      <div className={`${styles.marketEvidence} ${styles.verdictWithheld}`}>
        <StrokeState state="hatched" label={t("Market position withheld")} />
        <p>{t("More reported evidence is required before comparing a quote.")}</p>
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
        label={t(position.verdictLabel)}
      />
      <p>
        {formattedQuote ? <strong>{formattedQuote}</strong> : null}
        <span>{difference(position.differencePct, locale)}</span>
      </p>
    </div>
  );
}
