/** Amounts stay ungrouped in calculations; grouping is presentation only. */
export function rawAmountInput(value: string): string | null {
  const raw = value.normalize('NFKC').replace(/[,\s]/g, '');
  if (!/^\d*(?:\.\d*)?$/.test(raw)) return null;
  return raw.startsWith('.') ? `0${raw}` : raw;
}

export function submittedAmountInput(value: string): string {
  return (rawAmountInput(value) ?? '').replace(/\.$/, '');
}

export function amountStepValid(value: string, step: string | number = 'any', min: string | number = 0): boolean {
  if (value === '' || step === 'any') return true;
  const size = Number(step);
  if (!Number.isFinite(size) || size <= 0) return true;
  const units = (Number(submittedAmountInput(value)) - Number(min)) / size;
  return Number.isFinite(units) && Math.abs(units - Math.round(units)) < 1e-6;
}

export function formatAmountInput(value: string | number): string {
  const raw = rawAmountInput(String(value));
  if (raw === null) return String(value);
  const [whole = '', fraction] = raw.split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : `.${fraction}`);
}

export function amountCaretPosition(display: string, characters: number): number {
  if (characters <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < display.length; index++) {
    if (display[index] !== ',') seen++;
    if (seen === characters) return index + 1;
  }
  return display.length;
}
