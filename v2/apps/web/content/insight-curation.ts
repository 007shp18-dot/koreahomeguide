// These explain data coverage rather than a new market finding. Keep their
// public URLs and sources, and link them from the monthly reports instead of
// presenting them as additional current stories in Insights.
export const INSIGHT_REFERENCE_SLUGS = [
  'seoul-sale-market-monthly-brief',
  'seoul-jeonse-market-monthly-brief',
  'seoul-monthly-rent-market-brief',
  'singapore-private-market-quarterly-brief',
] as const;

export function isInsightReference(slug: string): boolean {
  return INSIGHT_REFERENCE_SLUGS.some(reference => reference === slug);
}

export const MONTHLY_REPORT_REFERENCES: Readonly<Record<string, readonly string[]>> = {
  'seoul-monthly-2026-09': INSIGHT_REFERENCE_SLUGS.slice(0, 3),
  'singapore-monthly-2026-09': [INSIGHT_REFERENCE_SLUGS[3]],
};
