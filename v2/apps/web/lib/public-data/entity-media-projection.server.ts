import 'server-only';

export type PublicEntityMedia = Readonly<{
  entityId: string;
  mediaAssetId: string;
  role: 'hero' | 'exterior' | 'entrance' | 'context';
  position: number;
  displayUrl: string | null;
  providerReference: string | null;
  width: number | null;
  height: number | null;
  focalX: number | null;
  focalY: number | null;
  attributionName: string | null;
  attributionUrl: string | null;
  exactSubject: boolean;
  publishedAt: string;
  lastCheckedAt: string;
}>;

export type PublicEntityMediaCandidate = PublicEntityMedia & Readonly<{
  reviewState: 'candidate' | 'review_required' | 'approved' | 'rejected' | 'broken';
  canDisplay: boolean;
}>;

const MEDIA_ROLES = ['hero', 'exterior', 'entrance', 'context'] as const;

function validDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function validOptionalUnit(value: number | null): boolean {
  return value === null || (Number.isFinite(value) && value >= 0 && value <= 1);
}

function validCandidate(candidate: PublicEntityMediaCandidate): boolean {
  return candidate.reviewState === 'approved'
    && candidate.canDisplay
    && candidate.entityId.trim() !== ''
    && candidate.mediaAssetId.trim() !== ''
    && MEDIA_ROLES.includes(candidate.role)
    && Number.isSafeInteger(candidate.position)
    && candidate.position >= 0
    && ((candidate.displayUrl === null) !== (candidate.providerReference === null))
    && (candidate.width === null || (Number.isSafeInteger(candidate.width) && candidate.width > 0))
    && (candidate.height === null || (Number.isSafeInteger(candidate.height) && candidate.height > 0))
    && validOptionalUnit(candidate.focalX)
    && validOptionalUnit(candidate.focalY)
    && validDate(candidate.publishedAt)
    && validDate(candidate.lastCheckedAt);
}

export function selectPublicEntityMedia(
  candidates: readonly PublicEntityMediaCandidate[],
): readonly PublicEntityMedia[] {
  return Object.freeze(candidates
    .filter(validCandidate)
    .sort((left, right) => left.position - right.position
      || left.mediaAssetId.localeCompare(right.mediaAssetId))
    .map((candidate) => Object.freeze({
      entityId: candidate.entityId,
      mediaAssetId: candidate.mediaAssetId,
      role: candidate.role,
      position: candidate.position,
      displayUrl: candidate.displayUrl,
      providerReference: candidate.providerReference,
      width: candidate.width,
      height: candidate.height,
      focalX: candidate.focalX,
      focalY: candidate.focalY,
      attributionName: candidate.attributionName,
      attributionUrl: candidate.attributionUrl,
      exactSubject: candidate.exactSubject,
      publishedAt: candidate.publishedAt,
      lastCheckedAt: candidate.lastCheckedAt,
    })));
}
