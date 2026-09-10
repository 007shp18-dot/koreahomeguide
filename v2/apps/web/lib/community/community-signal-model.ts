import type {
  CommunityAggregateModel,
  CommunityEvidenceScope,
  CommunitySelection,
} from './community-types';

export type CommunitySignalUnavailableCode =
  | 'storage_not_configured'
  | 'identity_not_configured'
  | 'rate_limit_not_configured'
  | 'evidence_unavailable';

export type CommunitySignalModel =
  | Readonly<{
      state: 'unavailable';
      scope: CommunityEvidenceScope | null;
      code: CommunitySignalUnavailableCode;
    }>
  | Readonly<{
      state: 'available';
      scope: CommunityEvidenceScope;
    }>
  | Readonly<{
      state: 'collecting';
      scope: CommunityEvidenceScope;
      selection: CommunitySelection | null;
      aggregate: Extract<CommunityAggregateModel, { status: 'collecting' }>;
    }>
  | Readonly<{
      state: 'published';
      scope: CommunityEvidenceScope;
      selection: CommunitySelection | null;
      aggregate: Extract<CommunityAggregateModel, { status: 'published' }>;
    }>;
