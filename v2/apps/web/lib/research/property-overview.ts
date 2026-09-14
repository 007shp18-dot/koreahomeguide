import overviews from '../../content/property-reviews/property-overviews.json';
import type { MarketLocale } from '../locale/market-localization';

type Overview = {
  checkedOn: string;
  impression: Record<MarketLocale, string>;
  highlights: Record<'transport' | 'schools' | 'daily', Record<MarketLocale, string>>;
};
const entries: Record<string, Overview> = overviews;

/** Authored descriptions, not scores or inferred school/transport rankings. */
export function propertyOverview(id: string, locale: MarketLocale, checkedOn?: string) {
  const entry = entries[id];
  if (!entry || (checkedOn && entry.checkedOn !== checkedOn)) return undefined;
  return {
    impression: entry.impression[locale],
    highlights: Object.entries(entry.highlights).map(([topic, copy]) => ({ topic, text: copy[locale] })),
  };
}
