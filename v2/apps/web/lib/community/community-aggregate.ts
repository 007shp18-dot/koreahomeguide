import {
  COMMUNITY_DIRECTIONS,
  COMMUNITY_PUBLICATION_MINIMUM,
  COMMUNITY_REASONS,
  type CommunityAggregateModel,
  type CommunityDirection,
  type CommunityReason,
} from './community-types';

type CountRow = Readonly<{ count: number }>;
type DirectionCountRow = CountRow & Readonly<{ direction: CommunityDirection }>;
type ReasonCountRow = CountRow & Readonly<{ reason: CommunityReason }>;
export type RawCommunityAggregate = Readonly<{
  total: number;
  directions: readonly DirectionCountRow[];
  reasons: readonly ReasonCountRow[];
}>;

const ROOT_KEYS = ['total', 'directions', 'reasons'] as const;
const DIRECTION_KEYS = ['direction', 'count'] as const;
const REASON_KEYS = ['reason', 'count'] as const;

function invalidCounts(): never {
  throw new TypeError('Invalid Community aggregate counts.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function parseRaw(value: unknown): RawCommunityAggregate {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ROOT_KEYS) ||
    !isCount(value.total) ||
    !Array.isArray(value.directions) ||
    value.directions.length !== COMMUNITY_DIRECTIONS.length ||
    !Array.isArray(value.reasons) ||
    value.reasons.length > COMMUNITY_REASONS.length
  ) {
    invalidCounts();
  }

  const directionCounts = new Map<CommunityDirection, number>();
  for (const row of value.directions) {
    if (
      !isRecord(row) ||
      !hasExactKeys(row, DIRECTION_KEYS) ||
      !COMMUNITY_DIRECTIONS.includes(row.direction as CommunityDirection) ||
      !isCount(row.count) ||
      directionCounts.has(row.direction as CommunityDirection)
    ) {
      invalidCounts();
    }
    directionCounts.set(row.direction as CommunityDirection, row.count);
  }
  if (
    COMMUNITY_DIRECTIONS.some((direction) => !directionCounts.has(direction)) ||
    [...directionCounts.values()].reduce((sum, count) => sum + count, 0) !== value.total
  ) {
    invalidCounts();
  }

  const reasonCounts = new Map<CommunityReason, number>();
  for (const row of value.reasons) {
    if (
      !isRecord(row) ||
      !hasExactKeys(row, REASON_KEYS) ||
      !COMMUNITY_REASONS.includes(row.reason as CommunityReason) ||
      !isCount(row.count) ||
      reasonCounts.has(row.reason as CommunityReason)
    ) {
      invalidCounts();
    }
    reasonCounts.set(row.reason as CommunityReason, row.count);
  }
  if ([...reasonCounts.values()].reduce((sum, count) => sum + count, 0) > value.total) {
    invalidCounts();
  }

  return Object.freeze({
    total: value.total,
    directions: Object.freeze(COMMUNITY_DIRECTIONS.map((direction) => Object.freeze({
      direction,
      count: directionCounts.get(direction)!,
    }))),
    reasons: Object.freeze(COMMUNITY_REASONS.flatMap((reason) => {
      const count = reasonCounts.get(reason);
      return count === undefined ? [] : [Object.freeze({ reason, count })];
    })),
  });
}

function percentages(rows: readonly DirectionCountRow[], total: number): readonly number[] {
  const allocated = rows.map(({ count }, index) => ({
    index,
    percent: Math.floor(count * 100 / total),
    remainder: count * 100 % total,
  }));
  let points = 100 - allocated.reduce((sum, item) => sum + item.percent, 0);
  const priority = [...allocated].sort((left, right) => (
    right.remainder - left.remainder || left.index - right.index
  ));
  for (const item of priority) {
    if (points === 0) break;
    allocated[item.index]!.percent += 1;
    points -= 1;
  }
  return Object.freeze(allocated.map(({ percent }) => percent));
}

export function buildPublicCommunityAggregate(value: unknown): CommunityAggregateModel {
  try {
    const raw = parseRaw(value);
    if (raw.total < COMMUNITY_PUBLICATION_MINIMUM) {
      return Object.freeze({ status: 'collecting' });
    }
    const rounded = percentages(raw.directions, raw.total);
    const directions = Object.freeze(raw.directions.map((row, index) => Object.freeze({
      ...row,
      percent: rounded[index]!,
    })));
    const reasons = Object.freeze(raw.reasons
      .filter(({ count }) => count >= COMMUNITY_PUBLICATION_MINIMUM)
      .map((row) => Object.freeze({ ...row })));
    const publicReasonCount = reasons.reduce((sum, reason) => sum + reason.count, 0);
    return Object.freeze({
      status: 'published',
      total: raw.total,
      directions,
      reasons,
      otherResponses: raw.total - publicReasonCount,
    });
  } catch {
    invalidCounts();
  }
}
