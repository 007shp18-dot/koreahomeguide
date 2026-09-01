import { describe, expect, it } from 'vitest';

import { parseEvidenceResponseInput } from '../lib/community/community-schema';

function validInput() {
  return {
    schemaVersion: 1,
    marketId: 'kr-seoul',
    scopeType: 'district',
    scopeId: 'jung-gu',
    evidenceId: 'kr-seoul:2026-01/2026-07:all',
    direction: 'SIMILAR',
    reason: null as string | null,
  };
}

describe('structured Community response schema', () => {
  it('parses and freezes the exact bounded response', () => {
    const parsed = parseEvidenceResponseInput(validInput());

    expect(parsed).toEqual(validInput());
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it.each([
    ['an array', () => []],
    ['an extra free-text field', () => ({ ...validInput(), comment: 'call me' })],
    ['a missing field', () => {
      const input: Partial<ReturnType<typeof validInput>> = validInput();
      delete input.reason;
      return input;
    }],
    ['an unknown market', () => ({ ...validInput(), marketId: 'sg-singapore' })],
    ['an unknown scope', () => ({ ...validInput(), scopeType: 'listing' })],
    ['an unsafe scope id', () => ({ ...validInput(), scopeId: '../jung-gu' })],
    ['a control character', () => ({ ...validInput(), evidenceId: 'kr-seoul:\u0000:all' })],
    ['an oversized evidence id', () => ({ ...validInput(), evidenceId: `kr-seoul:${'a'.repeat(220)}` })],
    ['an unknown direction', () => ({ ...validInput(), direction: 'UP' })],
    ['an unknown reason', () => ({ ...validInput(), reason: 'PRICE' })],
    ['a non-integer schema version', () => ({ ...validInput(), schemaVersion: 1.1 })],
  ])('rejects %s', (_name, build) => {
    expect(() => parseEvidenceResponseInput(build())).toThrow(
      'Invalid Community evidence response.',
    );
  });

  it.each(['HIGHER', 'SIMILAR', 'LOWER'] as const)(
    'accepts the %s direction',
    (direction) => {
      expect(parseEvidenceResponseInput({ ...validInput(), direction }).direction).toBe(direction);
    },
  );

  it.each(['LINE', 'ASPECT', 'FLOOR', 'REMODEL', 'VIEW', 'NOISE', 'OTHER', null] as const)(
    'accepts the bounded %s reason',
    (reason) => {
      expect(parseEvidenceResponseInput({ ...validInput(), reason }).reason).toBe(reason);
    },
  );
});
