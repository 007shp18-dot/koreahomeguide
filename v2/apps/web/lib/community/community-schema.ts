import {
  COMMUNITY_DIRECTIONS,
  COMMUNITY_REASONS,
  COMMUNITY_RESPONSE_SCHEMA_VERSION,
  type CommunityDirection,
  type CommunityReason,
  type EvidenceResponseInput,
} from './community-types';

const ROOT_KEYS = [
  'schemaVersion',
  'marketId',
  'scopeType',
  'scopeId',
  'evidenceId',
  'direction',
  'reason',
] as const;
const SAFE_SCOPE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_EVIDENCE_ID = /^kr-seoul:[a-z0-9./:-]+$/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

function invalidResponse(): never {
  throw new TypeError('Invalid Community evidence response.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length === ROOT_KEYS.length && keys.every((key) => (
    ROOT_KEYS.includes(key as (typeof ROOT_KEYS)[number])
  ));
}

function isSafeString(
  value: unknown,
  maximum: number,
  pattern: RegExp,
): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maximum &&
    value.trim() === value &&
    !CONTROL_CHARACTER.test(value) &&
    pattern.test(value)
  );
}

function parseResponse(value: unknown): EvidenceResponseInput {
  if (
    !isRecord(value) ||
    !hasExactKeys(value) ||
    value.schemaVersion !== COMMUNITY_RESPONSE_SCHEMA_VERSION ||
    value.marketId !== 'kr-seoul' ||
    (value.scopeType !== 'district' && value.scopeType !== 'building') ||
    !isSafeString(value.scopeId, 120, SAFE_SCOPE_ID) ||
    !isSafeString(value.evidenceId, 200, SAFE_EVIDENCE_ID) ||
    !COMMUNITY_DIRECTIONS.includes(value.direction as CommunityDirection) ||
    !(
      value.reason === null ||
      COMMUNITY_REASONS.includes(value.reason as CommunityReason)
    )
  ) {
    invalidResponse();
  }
  return Object.freeze({
    schemaVersion: COMMUNITY_RESPONSE_SCHEMA_VERSION,
    marketId: 'kr-seoul',
    scopeType: value.scopeType,
    scopeId: value.scopeId,
    evidenceId: value.evidenceId,
    direction: value.direction as CommunityDirection,
    reason: value.reason as CommunityReason | null,
  });
}

export function parseEvidenceResponseInput(value: unknown): EvidenceResponseInput {
  try {
    return parseResponse(value);
  } catch {
    invalidResponse();
  }
}
