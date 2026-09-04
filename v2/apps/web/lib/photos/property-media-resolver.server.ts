import type { PropertyMediaCandidate, PropertyMediaModel } from './property-media-model';

function nonEmpty(value: string | null): value is string {
  return value !== null && value.trim() === value && value.length > 0;
}

function approved(candidate: PropertyMediaCandidate): boolean {
  if (candidate.provider === 'street-view') return false;
  if (candidate.reviewStatus !== 'approved' || candidate.identityStatus !== 'verified') return false;
  if (!nonEmpty(candidate.sourcePageUrl) || !/^https:\/\//.test(candidate.sourcePageUrl)) return false;
  if (!nonEmpty(candidate.attribution) || !nonEmpty(candidate.checkedAt) || !nonEmpty(candidate.visualReviewedAt)) return false;
  if (candidate.provider === 'google-place') {
    return candidate.rightsStatus === 'provider-display-only'
      && candidate.assetUrl === null
      && nonEmpty(candidate.placeId);
  }
  return candidate.placeId === null
    && nonEmpty(candidate.assetUrl)
    && /^https:\/\//.test(candidate.assetUrl)
    && ((candidate.provider === 'owned-object' && candidate.rightsStatus === 'owned')
      || (candidate.provider === 'licensed-url' && candidate.rightsStatus === 'licensed'));
}

function materialize(candidate: PropertyMediaCandidate): PropertyMediaModel {
  const common = {
    mediaId: candidate.id,
    subjectEntityId: candidate.subjectEntityId,
    sourcePageUrl: candidate.sourcePageUrl!,
    attribution: candidate.attribution!,
    checkedAt: candidate.checkedAt!,
  } as const;
  if (candidate.provider === 'google-place') {
    return Object.freeze({
      ...common,
      kind: 'provider_photo',
      placeId: candidate.placeId!,
      subjectLabel: candidate.relationship === 'exact'
        ? 'Approved provider photograph of this property'
        : 'Parent project photograph · not the exact property',
    });
  }
  return Object.freeze({
    ...common,
    kind: candidate.relationship === 'exact' ? 'exact_photo' : 'parent_photo',
    src: candidate.assetUrl!,
    subjectLabel: candidate.relationship === 'exact'
      ? 'Approved photograph of this property'
      : 'Parent project photograph · not the exact property',
  });
}

export function resolvePropertyMedia(input: Readonly<{
  entityId: string;
  parentEntityIds: readonly string[];
  candidates: readonly PropertyMediaCandidate[];
  editorial: Readonly<{ city: string; src: `/assets/markets/${string}` }> | null;
  mapHref: string;
}>): PropertyMediaModel {
  const exact = input.candidates.find((candidate) => (
    candidate.relationship === 'exact'
    && candidate.subjectEntityId === input.entityId
    && approved(candidate)
  ));
  if (exact !== undefined) return materialize(exact);

  const parent = input.candidates.find((candidate) => (
    candidate.relationship === 'parent'
    && input.parentEntityIds.includes(candidate.subjectEntityId)
    && approved(candidate)
  ));
  if (parent !== undefined) return materialize(parent);

  if (input.editorial !== null) return Object.freeze({
    kind: 'editorial_photo',
    src: input.editorial.src,
    subjectLabel: `${input.editorial.city} editorial city photograph · not this exact property`,
  });
  return Object.freeze({
    kind: 'neutral_location',
    title: 'Property photograph unavailable',
    mapHref: input.mapHref,
  });
}
