export const COMMUNITY_RESPONSE_SCHEMA_VERSION = 1 as const;
export const COMMUNITY_PUBLICATION_MINIMUM = 5 as const;

export const COMMUNITY_DIRECTIONS = ['HIGHER', 'SIMILAR', 'LOWER'] as const;
export type CommunityDirection = (typeof COMMUNITY_DIRECTIONS)[number];

export const COMMUNITY_REASONS = [
  'LINE',
  'ASPECT',
  'FLOOR',
  'REMODEL',
  'VIEW',
  'NOISE',
  'OTHER',
] as const;
export type CommunityReason = (typeof COMMUNITY_REASONS)[number];

export type CommunityScopeType = 'district' | 'building';

export type CommunityEvidenceScope = Readonly<{
  marketId: 'kr-seoul';
  scopeType: CommunityScopeType;
  scopeId: string;
  evidenceId: string;
}>;

export type CommunitySelection = Readonly<{
  direction: CommunityDirection;
  reason: CommunityReason | null;
}>;

export type EvidenceResponseInput = CommunityEvidenceScope & Readonly<{
  schemaVersion: typeof COMMUNITY_RESPONSE_SCHEMA_VERSION;
  direction: CommunityDirection;
  reason: CommunityReason | null;
}>;

export type CommunityAggregateModel =
  | Readonly<{ status: 'collecting' }>
  | Readonly<{
      status: 'published';
      total: number;
      directions: readonly Readonly<{
        direction: CommunityDirection;
        count: number;
        percent: number;
      }>[];
      reasons: readonly Readonly<{
        reason: CommunityReason;
        count: number;
      }>[];
      otherResponses: number;
    }>;
