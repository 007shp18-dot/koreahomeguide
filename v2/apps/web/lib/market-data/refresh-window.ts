function validReference(reference: Date): void {
  if (!Number.isFinite(reference.getTime())) {
    throw new TypeError('Market refresh reference instant is invalid.');
  }
}

function shiftUtcMonth(reference: Date, offset: number): Date {
  return new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + offset, 1));
}

export function refreshMonthKeys(reference: Date): readonly [string, string] {
  validReference(reference);
  const format = (date: Date) => (
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  );
  return Object.freeze([format(shiftUtcMonth(reference, 0)), format(shiftUtcMonth(reference, -1))]);
}

function quarterKey(date: Date): string {
  const year = String(date.getUTCFullYear() % 100).padStart(2, '0');
  return `${year}q${Math.floor(date.getUTCMonth() / 3) + 1}`;
}

export function refreshQuarterKeys(reference: Date): readonly [string, string] {
  validReference(reference);
  return Object.freeze([quarterKey(reference), quarterKey(shiftUtcMonth(reference, -3))]);
}
