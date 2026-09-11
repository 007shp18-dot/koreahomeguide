export type PracticalKind = 'korea' | 'japan' | 'singapore' | 'dubai';
export const PRACTICAL_DEFAULTS: Record<PracticalKind, string[]> = {
  korea: ['10000000', '800000', '100000', '0'], japan: [],
  singapore: ['1800000', '900', '2000000', '1100'],
  dubai: ['1000000', '70000', '1', '12000', '5', '3000', '65000'],
};

// User inputs and illustrative assumptions only; no market or statutory rates.
export function calculatePractical(kind: PracticalKind, inputs: readonly string[]): number[] | null {
  if (kind === 'japan' || inputs.length !== PRACTICAL_DEFAULTS[kind].length) return null;
  const n = inputs.map(value => value.trim() === '' ? NaN : Number(value));
  if (!n.every(value => Number.isFinite(value) && value >= 0 && value <= 1e12)) return null;
  let result: number[];
  if (kind === 'korea') {
    result = [n[1]! + n[2]! + n[3]!, n[0]!];
  } else if (kind === 'singapore') {
    if (n.some(value => value === 0)) return null;
    result = [n[0]! / n[1]!, n[2]! / n[3]!, n[2]! - n[0]!];
  } else {
    const [price, rent, vacancy, service, management, repairs, acquisition] = n as [number, number, number, number, number, number, number];
    if (!price || vacancy > 12 || management > 100) return null;
    const collected = rent * (1 - vacancy / 12);
    const fee = collected * management / 100;
    const income = collected - service - fee - repairs;
    result = [collected, fee, income, income / price * 100, income / (price + acquisition) * 100];
  }
  return result.every(Number.isFinite) ? result : null;
}
