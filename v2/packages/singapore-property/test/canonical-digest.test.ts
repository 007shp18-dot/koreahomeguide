import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalDigest } from '../src/canonical-digest.ts';

describe('bounded canonical digest', () => {
  it.each([
    [{ z: null, a: [true, 0, -0, '中文\n서울'] }, '{"a":[true,0,0,"中文\\n서울"],"z":null}'],
    [{ b: { y: 2, x: 1 }, a: [] }, '{"a":[],"b":{"x":1,"y":2}}'],
    [null, 'null'],
  ])('preserves the existing canonical artifact bytes', (value, canonical) => {
    expect(canonicalDigest(value)).toBe(createHash('sha256').update(canonical as string).digest('hex'));
  });

  it('preserves Unicode across buffer flushes and repeated object references', () => {
    const row = { label: '서울中文🏠'.repeat(12000) };
    const value = [row, row];
    expect(canonicalDigest(value)).toBe(createHash('sha256').update(JSON.stringify(value)).digest('hex'));
  });

  it('rejects cycles and non-JSON values', () => {
    const cycle: unknown[] = [];
    cycle.push(cycle);
    expect(() => canonicalDigest(cycle)).toThrow();
    expect(() => canonicalDigest({ value: undefined })).toThrow();
  });
});
