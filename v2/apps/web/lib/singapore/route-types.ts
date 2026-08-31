import type {
  EvidenceDescriptor,
} from '@signedprice/market-core';
import type {
  SingaporeMarketSegment,
  SingaporeProjectSummary,
  SingaporeSegmentSummary,
  SingaporeSnapshotRecord,
} from '@signedprice/singapore-property';

export const SINGAPORE_CORRECTION_HREF = '/sg/singapore/corrections/' as const;
export const SINGAPORE_UNAVAILABLE_MESSAGE = 'Verified Singapore evidence unavailable' as const;

export type SingaporeUnavailableModel = Readonly<{
  status: 'unavailable';
  message: typeof SINGAPORE_UNAVAILABLE_MESSAGE;
  correctionHref: typeof SINGAPORE_CORRECTION_HREF;
}>;

export type SingaporeEvidenceModel = Readonly<{
  provider: 'URA';
  dataset: 'private residential sale transactions';
  period: string;
  generatedAt: string;
  publicationMinimum: 5;
  rightsPolicyId: 'sg-ura-private-sale-v1';
  limitations: readonly string[];
  correctionHref: typeof SINGAPORE_CORRECTION_HREF;
  descriptor: EvidenceDescriptor;
}>;

export type SingaporeEntryModel = SingaporeUnavailableModel | Readonly<{
  status: 'ready';
  city: 'Singapore';
  currency: 'SGD';
  transactionLabel: string;
  projectLabel: string;
  periodLabel: string;
  exploreHref: '/sg/singapore/explore/';
  correctionHref: typeof SINGAPORE_CORRECTION_HREF;
  evidence: SingaporeEvidenceModel;
}>;

export type SingaporeSegmentListItem = Readonly<{
  code: SingaporeMarketSegment;
  href: `/sg/singapore/explore/${Lowercase<SingaporeMarketSegment>}/`;
  n: number;
  projectCount: number;
  state: 'published' | 'insufficient';
  medianPriceLabel: string | null;
  medianPsfLabel: string | null;
}>;

export type SingaporeExploreModel = SingaporeUnavailableModel | Readonly<{
  status: 'ready';
  segments: readonly SingaporeSegmentListItem[];
  transactionLabel: string;
  periodLabel: string;
  correctionHref: typeof SINGAPORE_CORRECTION_HREF;
  evidence: SingaporeEvidenceModel;
}>;

export type SingaporeInsufficientModel<Identity extends SingaporeSegmentSummary | SingaporeProjectSummary> = Readonly<{
  status: 'insufficient';
  identity: Identity;
  count: number;
  threshold: 5;
  reason: 'minimum_sample_not_met';
  correctionHref: typeof SINGAPORE_CORRECTION_HREF;
  evidence: SingaporeEvidenceModel;
}>;

export type SingaporeSegmentModel = SingaporeInsufficientModel<SingaporeSegmentSummary> | Readonly<{
  status: 'ready';
  identity: SingaporeSegmentSummary & Readonly<{ published: true }>;
  display: Readonly<{
    sampleLabel: string;
    medianPriceLabel: string;
    middlePriceLabel: string;
    medianPsfLabel: string;
    middlePsfLabel: string;
  }>;
  projects: readonly SingaporeProjectListItem[];
  correctionHref: typeof SINGAPORE_CORRECTION_HREF;
  evidence: SingaporeEvidenceModel;
}>;

export type SingaporeProjectListItem = Readonly<{
  id: string;
  name: string;
  street: string;
  district: string;
  n: number;
  state: 'published' | 'insufficient';
  href: `/sg/singapore/explore/${Lowercase<SingaporeMarketSegment>}/${string}/`;
  medianPriceLabel: string | null;
  medianPsfLabel: string | null;
}>;

export type SingaporeTransactionDisplay = Readonly<{
  contractMonthLabel: string;
  priceLabel: string;
  areaLabel: string;
  psfLabel: string;
  psmLabel: string;
  saleTypeLabel: string;
  propertyTypeLabel: string;
  areaBasisLabel: string;
  tenureLabel: string;
  floorRangeLabel: string;
  source: SingaporeSnapshotRecord;
}>;

export type SingaporeProjectModel = SingaporeInsufficientModel<SingaporeProjectSummary> | Readonly<{
  status: 'ready';
  identity: SingaporeProjectSummary & Readonly<{ published: true }>;
  display: Readonly<{
    sampleLabel: string;
    medianPriceLabel: string;
    middlePriceLabel: string;
    medianPsfLabel: string;
    middlePsfLabel: string;
  }>;
  transactions: readonly SingaporeTransactionDisplay[];
  correctionHref: typeof SINGAPORE_CORRECTION_HREF;
  evidence: SingaporeEvidenceModel;
}>;
