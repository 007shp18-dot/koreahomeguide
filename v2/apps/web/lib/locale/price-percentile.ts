export function formatPricePercentile(value: number, locale: 'en' | 'ko'): string {
  if (locale === 'ko') return `${value}백분위`;
  if (!Number.isInteger(value)) return `Percentile ${value}`;
  const lastTwo = value % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[value % 10] ?? 'th';
  return `${value}${suffix}`;
}
