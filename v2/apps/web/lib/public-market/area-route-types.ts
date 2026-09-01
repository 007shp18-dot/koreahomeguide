import type {
  EvidenceDescriptor,
  EvidenceEmptyState,
  PublishedMarketSummary,
  PublicMarketSummary,
  WithheldMarketSummary,
} from '@signedprice/market-core';
import type {
  SeoulDistrictSlug,
  SeoulLawdCd,
  SeoulRentCheckDistrict,
} from '@signedprice/korea-rent/browser';
import type { CommunitySignalModel } from '../community/community-signal-model';
import type { NewsCardModel } from '../news/news-card-model';

export type ExploreDistrictModel = Readonly<{
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  nameEn: string;
  nameKo: string;
  href: `/kr/seoul/explore/${string}/`;
  path: string;
  latitude: number;
  longitude: number;
  summary: PublicMarketSummary;
  state: 'published' | 'withheld';
  bucket: 0 | 1 | 2 | 3 | 4 | null;
  sampleLabel: string;
  medianLabel: string | null;
  changeLabel: string | null;
  evidenceSummary: PublicDistrictEvidenceSummaryModel;
  contractEvidence: ContractGroupEvidenceModel;
}>;

export type PublicContractGroup = 'all' | 'new' | 'renewal';

type PublicDistrictEvidenceIdentity = Readonly<{
  nameEn: string;
  nameKo: string;
  href: `/kr/seoul/explore/${string}/`;
  period: string;
  publicationMinimum: 5;
  contractGroup: PublicContractGroup;
  groupLabel: 'All contracts' | 'New contracts' | 'Renewal contracts';
}>;

export type PublicDistrictEvidenceSummaryModel =
  | (PublicDistrictEvidenceIdentity & Readonly<{
      status: 'published';
      sampleLabel: string;
      medianLabel: string;
      middleHalfLabel: string;
      rangeLabel: string;
      changeLabel: string;
    }>)
  | (PublicDistrictEvidenceIdentity & Readonly<{
      status: 'withheld';
      sampleLabel: string;
    }>)
  | (PublicDistrictEvidenceIdentity & Readonly<{
      status: 'unavailable';
      message: 'Verified district summary unavailable';
    }>)
  | (PublicDistrictEvidenceIdentity & Readonly<{
      status: 'snapshot_unavailable';
      message: 'New/renewal split not available in this snapshot';
    }>);

export type ContractGroupEvidenceModel = Readonly<{
  scopeId: SeoulDistrictSlug;
  selected: PublicContractGroup;
  splitStatus: 'ready' | 'snapshot_v1' | 'unavailable';
  unknownContractCount: number | null;
  groups: Readonly<Record<PublicContractGroup, PublicDistrictEvidenceSummaryModel>>;
}>;

export type PublicAreaLegendBucket = Readonly<{
  bucket: 0 | 1 | 2 | 3 | 4;
  count: number;
  minimumMedian: number;
  maximumMedian: number;
  label: string;
}>;

export type PublicSourceBoundaryModel = Readonly<{
  evidence: EvidenceDescriptor | null;
  provider: 'MOLIT';
  period: string;
  attribution: readonly string[];
  band: '45–55㎡';
  publicationMinimum: 5;
  includesNewAndRenewal: true;
  includesUnknownContractType: true;
  includesUnknownRecordStatus: true;
  geometryAttribution?: 'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)';
}>;

export type PublicAreaSourceBoundaryModel = PublicSourceBoundaryModel & Readonly<{
  geometryAttribution: 'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)';
}>;

export type RankingKind = 'cheapest' | 'change' | 'spread' | 'sample';

export type SignedRankingBar = Readonly<{
  direction: 'negative' | 'zero' | 'positive';
  startPct: number;
  endPct: number;
  extentPct: number;
}>;

export type PublicDistrictRankingRow = Readonly<{
  kind: RankingKind;
  rank: number;
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  nameEn: string;
  nameKo: string;
  href: `/kr/seoul/explore/${string}/`;
  metric: number;
  valueLabel: string;
  bar: SignedRankingBar | null;
}>;

export type PublicAreaRankingsModel =
  | Readonly<{
      status: 'ready';
      cheapest: readonly PublicDistrictRankingRow[];
      change: readonly PublicDistrictRankingRow[];
      spread: readonly PublicDistrictRankingRow[];
      sample: readonly PublicDistrictRankingRow[];
      withheldDistrictCount: number;
      changeExcludedDistrictCount: number;
      hasNegativeChange: boolean;
      changeAxisLabel: Readonly<{ minimum: string; maximum: string }>;
      source: PublicSourceBoundaryModel;
    }>
  | Readonly<{
      status: 'unavailable';
      message: 'Verified district summary unavailable';
      source: PublicSourceBoundaryModel;
    }>;

export type PublicAreaExploreModel =
  | Readonly<{
      status: 'ready';
      selectedSlug: SeoulDistrictSlug;
      citySummary: PublicMarketSummary;
      districts: readonly ExploreDistrictModel[];
      legend: readonly PublicAreaLegendBucket[];
      buildingAvailability: ExploreBuildingAvailability;
      source: PublicAreaSourceBoundaryModel;
    }>
  | Readonly<{
      status: 'unavailable';
      selectedSlug: null;
      districts: readonly [];
      source: PublicAreaSourceBoundaryModel;
      message: 'Verified district summary unavailable';
    }>;

export type ExploreBuildingModel = Readonly<{
  id: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  name: string;
  housingType: string;
  latitude: number | null;
  longitude: number | null;
  sampleLabel: string;
  medianLabel: string;
  newSampleLabel: string;
  newMedianLabel: string | null;
  renewalSampleLabel: string;
  renewalMedianLabel: string | null;
  unknownContractCount: number;
  href: `/kr/seoul/explore/${string}/${string}/`;
}>;

export type ExploreBuildingAvailability =
  | Readonly<{ status: 'ready'; buildings: readonly ExploreBuildingModel[] }>
  | Readonly<{ status: 'not_loaded' }>;

export type PublicDistrictFaq = Readonly<{
  question: string;
  answer: string;
}>;

export type PublicDistrictDisplayModel = Readonly<{
  heading: string;
  sampleLabel: string;
  medianLabel: string | null;
  rangeLabel: string | null;
  middleHalfLabel: string | null;
  changeLabel: string | null;
}>;

export type DistrictBuildingLink = Readonly<{
  id: string;
  name: string;
  housingType: string;
  sampleLabel: string;
  href: `/kr/seoul/explore/${string}/${string}/`;
}>;

export type DistrictBuildingAvailability =
  | Readonly<{
      status: 'ready';
      buildings: readonly DistrictBuildingLink[];
    }>
  | Readonly<{
      status: 'not_loaded';
      empty: EvidenceEmptyState;
    }>;

export type PublicDistrictModel =
  | Readonly<{
      status: 'published';
      identity: SeoulRentCheckDistrict;
      summary: PublishedMarketSummary;
      display: PublicDistrictDisplayModel;
      nearby: readonly SeoulRentCheckDistrict[];
      faq: readonly PublicDistrictFaq[];
      datasetJsonLd: Readonly<Record<string, unknown>>;
      faqJsonLd: Readonly<Record<string, unknown>>;
      source: PublicAreaSourceBoundaryModel;
      buildingAvailability: DistrictBuildingAvailability;
      evidenceSummary: PublicDistrictEvidenceSummaryModel;
      contractEvidence: ContractGroupEvidenceModel;
      communitySignal: CommunitySignalModel;
      news: readonly NewsCardModel[];
    }>
  | Readonly<{
      status: 'withheld';
      identity: SeoulRentCheckDistrict;
      summary: WithheldMarketSummary;
      display: PublicDistrictDisplayModel;
      nearby: readonly SeoulRentCheckDistrict[];
      faq: readonly PublicDistrictFaq[];
      datasetJsonLd: Readonly<Record<string, unknown>>;
      faqJsonLd: Readonly<Record<string, unknown>>;
      source: PublicAreaSourceBoundaryModel;
      buildingAvailability: DistrictBuildingAvailability;
      evidenceSummary: PublicDistrictEvidenceSummaryModel;
      contractEvidence: ContractGroupEvidenceModel;
      communitySignal: CommunitySignalModel;
      news: readonly NewsCardModel[];
    }>
  | Readonly<{
      status: 'unavailable';
      identity: SeoulRentCheckDistrict;
      nearby: readonly SeoulRentCheckDistrict[];
      source: PublicAreaSourceBoundaryModel;
      buildingAvailability: DistrictBuildingAvailability;
      message: 'Verified district summary unavailable';
      evidenceSummary: PublicDistrictEvidenceSummaryModel;
      contractEvidence: ContractGroupEvidenceModel;
      communitySignal: CommunitySignalModel;
      news: readonly NewsCardModel[];
    }>;
