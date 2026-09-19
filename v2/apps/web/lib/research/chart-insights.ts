/** Comparisons never turn missing observations or a zero baseline into growth. */
export function compareChartValues(latest: number | null | undefined, previous: number | null | undefined) {
  if (latest == null || previous == null || !Number.isFinite(latest) || !Number.isFinite(previous)) return null;
  return { absolute: latest - previous, percent: previous > 0 ? (latest - previous) / previous * 100 : null };
}

/** Only connect periods whose calendar adjacency is known. Unknown labels remain individual observations. */
export function consecutiveChartPeriods(previous: string, latest: string): boolean {
  if (/^\d{4}$/.test(previous) && /^\d{4}$/.test(latest)) return Number(latest) - Number(previous) === 1;
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(previous) && /^\d{4}-(0[1-9]|1[0-2])$/.test(latest)) {
    const ordinal = (value: string) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7));
    return ordinal(latest) - ordinal(previous) === 1;
  }
  if (/^\d{4}-Q[1-4]$/.test(previous) && /^\d{4}-Q[1-4]$/.test(latest)) {
    const ordinal = (value: string) => Number(value.slice(0, 4)) * 4 + Number(value.at(-1));
    return ordinal(latest) - ordinal(previous) === 1;
  }
  return false;
}
