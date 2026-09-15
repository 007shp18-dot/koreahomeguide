export const PANEL_BANDS = ['under-40', '40-60', '60-85', '85-plus'] as const;
export type PanelBand = typeof PANEL_BANDS[number];

/** Counts must come from the complete published cohort, never the recent-row preview. */
export function defaultPanelBand(cohorts: readonly { band: string; count: number }[], requested?: unknown): PanelBand | 'all' {
  if (requested === 'all' || PANEL_BANDS.some(band => band === requested)) return requested as PanelBand | 'all';
  const eligible = cohorts.filter(c => PANEL_BANDS.some(band => band === c.band) && Number.isSafeInteger(c.count) && c.count >= 5);
  eligible.sort((a, b) => b.count - a.count || Number(b.band === '60-85') - Number(a.band === '60-85') || PANEL_BANDS.indexOf(a.band as PanelBand) - PANEL_BANDS.indexOf(b.band as PanelBand));
  return eligible[0]?.band as PanelBand ?? 'all';
}
export type PanelSummary = { count: number; median: number; q1: number; q3: number };
export function publishPanelSummary(value: PanelSummary | null): PanelSummary | null {
  return value && Number.isSafeInteger(value.count) && value.count >= 5
    && [value.median, value.q1, value.q3].every(n => Number.isFinite(n) && n > 0)
    && value.q1 <= value.median && value.median <= value.q3 ? value : null;
}
export function panelJeonseRatio(sale: PanelSummary | null, jeonse: PanelSummary | null, salePeriod: string, jeonsePeriod: string): number | null {
  const a = publishPanelSummary(sale), b = publishPanelSummary(jeonse);
  return a && b && salePeriod !== '' && salePeriod === jeonsePeriod ? b.median / a.median : null;
}
/** Describes dispersion, without attributing price differences to floors. */
export function panelSpread(summary: PanelSummary | null): { variant: 'wide' | 'narrow'; percent: number } | null {
  const value = publishPanelSummary(summary);
  if (!value) return null;
  const percent = (value.q3 - value.q1) / value.median * 100;
  return { variant: percent >= 10 ? 'wide' : 'narrow', percent };
}
