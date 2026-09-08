export type PassportFxSnapshot = Readonly<{
  asOf: string;
  checkedAt: string | null;
  eurKrw: number;
  eurSgd: number;
  eurUsd: number;
  usdAed: number;
  source: string;
  availability: 'reference' | 'stale' | 'fallback';
}>;

// Last bundled reference: a cold-cache outage must not invent today's rates.
export const PASSPORT_FX: PassportFxSnapshot = Object.freeze({
  asOf: '2026-09-04',
  checkedAt: null,
  eurKrw: 1569.38,
  eurSgd: 1.4724,
  eurUsd: 1.1622,
  usdAed: 3.6725,
  source: 'ECB; AED uses the CBUAE USD peg (1 USD = 3.6725 AED)',
  availability: 'fallback',
});
