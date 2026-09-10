export type PropertyMediaProvider =
  | 'owned-object'
  | 'licensed-url'
  | 'google-place'
  | 'street-view';

export type PropertyMediaCandidate = Readonly<{
  id: string;
  subjectEntityId: string;
  relationship: 'exact' | 'parent';
  provider: PropertyMediaProvider;
  rightsStatus: 'owned' | 'licensed' | 'provider-display-only';
  reviewStatus: 'approved' | 'review_required' | 'broken';
  identityStatus: 'verified' | 'ambiguous' | 'unverified';
  assetUrl: string | null;
  placeId: string | null;
  sourcePageUrl: string | null;
  attribution: string | null;
  checkedAt: string | null;
  visualReviewedAt: string | null;
}>;

type ApprovedPhotoFields = Readonly<{
  mediaId: string;
  subjectEntityId: string;
  sourcePageUrl: string;
  attribution: string;
  checkedAt: string;
}>;

export type PropertyMediaModel =
  | (ApprovedPhotoFields & Readonly<{
      kind: 'exact_photo' | 'parent_photo';
      src: string;
      subjectLabel: string;
    }>)
  | (ApprovedPhotoFields & Readonly<{
      kind: 'provider_photo';
      placeId: string;
      subjectLabel: string;
    }>)
  | Readonly<{
      kind: 'editorial_photo';
      src: `/assets/markets/${string}`;
      subjectLabel: string;
    }>
  | Readonly<{
      kind: 'neutral_location';
      title: 'Property photograph unavailable';
      mapHref: string;
    }>;
