/** Published price context, distinct from an asking price or a valuation. */
export type DecisionPriceContext = Readonly<{
  scope: 'property' | 'area' | 'unavailable';
  label: string;
  currency: 'KRW' | 'SGD' | 'AED' | 'JPY';
  amount: number | null;
  count: number | null;
  period: string | null;
  areaSqm?: number | null;
  unit: 'total' | 'per-sqm';
  basis: string;
  note?: string;
  /** Interquartile transaction range for this exact cohort, never a fair-value band. */
  range?: Readonly<{ low: number; high: number }> | null;
  sourceUrl?: string;
}>;
