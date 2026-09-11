/** A padded, readable price domain. Invalid values never become SVG coordinates. */
export function pricePlotScale(values: readonly number[]) {
  const valid = values.filter(value => Number.isFinite(value) && value >= 0);
  const low = valid.length ? Math.min(...valid) : 0;
  const high = valid.length ? Math.max(...valid) : 1;
  const spread = Math.max(high - low, high * 0.1, 1);
  const roughStep = spread * 1.2 / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = [1, 2, 2.5, 5, 10].map(value => value * magnitude).find(value => value >= roughStep)!;
  const min = Math.max(0, Math.floor((low - spread * 0.1) / step) * step);
  const max = Math.max(min + step, Math.ceil((high + spread * 0.1) / step) * step);
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  return { min, max, ticks, position: (value: number) => Math.max(0, Math.min(1, (value - min) / (max - min))) };
}
