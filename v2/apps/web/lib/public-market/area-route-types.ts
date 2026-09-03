import type {
  EvidenceDescriptor,
  EvidenceEmptyState,
  PublishedMarketSummary,
  PublicMarketSummary,
  QuotePositionAxis,
  WithheldMarketSummary,
} from '@signedprice/market-core';
import type {
  SeoulDistrictSlug,
  SeoulLawdCd,
  SeoulRentCheckDistrict,
} from '@signedprice/korea-rent/browser';
import type { KoreaEvidenceAreaBand } from '@signedprice/korea-rent';
import type { CommunitySignalModel } from '../community/community-signal-model';
import type { NewsCardModel } from '../news/news-card-model';
import type {
  ChangeReliability,
  EvidencePeriodModel,
  SpreadVerdict,
} from './evidence-interpretation';

export type ExploreDistrictModel = Readonly<{
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  nameEn: string;
  nameKo: string;
  href: `/kr/seoul/explore/${string}/` | `/kr/seoul/explore/${string}/?${string}`;
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
      medianValue: number;
      medianLabel: string;
      middleHalfLabel: string;
      rangeLabel: string;
      changeLabel: string;
      spread: SpreadVerdict;
      change: ChangeReliability;
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
  allLowerThanNew: boolean;
  groups: Readonly<Record<PublicContractGroup, PublicDistrictEvidenceSummaryModel>>;
}>;

export type PublicAreaCoverageModel = Readonly<{
  districts: Readonly<{ published: number; retained: number }>;
  buildings:
    | Readonly<{
        status: 'ready';
        observed: number;
        transactionCovered: number;
        priceReady: number;
      }>
    | Readonly<{
        status: 'inventory_unavailable';
        transactionCovered: number | null;
        priceReady: number | null;
        reason: 'Verified observed building inventory is not loaded.';
      }>;
  eligibleContracts: number;
  unpublished: Readonly<{
    districtsBelowMinimum: number;
    retainedBuildingsBelowMinimum: number | null;
    sourceBuildingCandidates: Readonly<{
      status: 'unavailable';
      reason: 'Source candidate building counts are not retained in this verified artifact.';
    }>;
  }>;
}>;

export type PublicMonthlyUpdateSchedule = Readonly<{
  cadence: 'monthly';
  dayOfMonth: number;
  hourUtc: number;
  minuteUtc: number;
}>;

export type PublicNextUpdateModel = Readonly<{
  cadence: 'monthly';
  instant: string;
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
  band: string;
  publicationMinimum: 5;
  includesNewAndRenewal: true;
  includesUnknownContractType: true;
  includesUnknownRecordStatus: true;
  nextUpdate: PublicNextUpdateModel | null;
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
  href: `/kr/seoul/explore/${string}/` | `/kr/seoul/explore/${string}/?${string}`;
  metric: number;
  valueLabel: string;
  bar: SignedRankingBar | null;
  distribution: PublishedMarketSummary | null;
  plotAxis: QuotePositionAxis | null;
}>;

export type UnavailableRankingDistrict = Readonly<{
  slug: SeoulDistrictSlug;
  nameEn: string;
  nameKo: string;
  href: `/kr/seoul/explore/${string}/` | `/kr/seoul/explore/${string}/?${string}`;
}>;

export type PublicAreaRankingsModel =
  | Readonly<{
      status: 'ready';
      evidenceSelection: Readonly<{
        transaction: 'jeonse' | 'monthly' | 'sale';
        areaBand: KoreaEvidenceAreaBand | 'legacy-45-55';
        housingType: 'all' | 'apartment' | 'officetel' | 'villa_multifamily' | 'detached';
        contractGroup: 'all' | 'new' | 'renewal' | 'unknown' | 'not-applicable';
      }>;
      transactionAvailability: Readonly<{
        jeonse: boolean;
        monthly: boolean;
        sale: boolean;
      }>;
      citySummary: PublicMarketSummary;
      cheapest: readonly PublicDistrictRankingRow[];
      change: readonly PublicDistrictRankingRow[];
      spread: readonly PublicDistrictRankingRow[];
      sample: readonly PublicDistrictRankingRow[];
      unavailableDistricts: readonly UnavailableRankingDistrict[];
      withheldDistrictCount: number;
      changeExcludedDistrictCount: number;
      hasNegativeChange: boolean;
      changeAxisLabel: Readonly<{ minimum: string; maximum: string }>;
      changeInterpretation: Readonly<{
        status: 'not_assessable';
        title: 'Three-month change not assessable';
        definition: 'Prior/latest sample counts were not retained in this snapshot.';
        note: 'Stored change values are excluded from rankings until both comparison counts are retained.';
      }>;
      period: EvidencePeriodModel;
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
      evidenceSelection: Readonly<{
        transaction: 'jeonse' | 'monthly' | 'sale';
        areaBand: KoreaEvidenceAreaBand | 'legacy-45-55';
        housingType: 'all' | 'apartment' | 'officetel' | 'villa_multifamily' | 'detached';
        contractGroup: 'all' | 'new' | 'renewal' | 'unknown' | 'not-applicable';
      }>;
      transactionAvailability: Readonly<{
        jeonse: boolean;
        monthly: boolean;
        sale: boolean;
      }>;
      selectedSlug: SeoulDistrictSlug;
      citySummary: PublicMarketSummary;
      districts: readonly ExploreDistrictModel[];
      legend: readonly PublicAreaLegendBucket[];
      coverage: PublicAreaCoverageModel;
      buildingAvailability: ExploreBuildingAvailability;
      proximity: KoreaExploreProximityModel;
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
  evidenceStatus: 'published' | 'withheld' | 'unavailable';
  transaction?: 'jeonse' | 'monthly' | 'sale';
  primaryMetric?: 'deposit' | 'monthly-rent' | 'sale-price';
  observationCount: number;
  jeonseObservationCount: number;
  monthlyObservationCount: number;
  firstObservedMonth: string;
  lastObservedMonth: string;
  sampleLabel: string;
  medianLabel: string | null;
  filedDepositMedianLabel?: string | null;
  newSampleLabel: string;
  newMedianLabel: string | null;
  renewalSampleLabel: string;
  renewalMedianLabel: string | null;
  unknownContractCount: number;
  proximity: ExploreBuildingProximityModel | null;
  href: `/kr/seoul/explore/${string}/${string}/`;
}>;

export type KoreaExploreProximityPair = Readonly<{
  sourceId: string;
  distanceMeters: 250 | 500 | 750 | 1000;
}>;

export type KoreaExploreProximitySelection = Readonly<{
  station: KoreaExploreProximityPair | null;
  school: KoreaExploreProximityPair | null;
}>;

export type KoreaExploreProximityModel =
  | Readonly<{
      status: 'ready';
      selection: KoreaExploreProximitySelection;
      stations: readonly Readonly<{ sourceId: string; name: string; lines: readonly string[] }>[];
      schools: readonly Readonly<{ sourceId: string; name: string }>[];
      provenance: Readonly<{
        stationSource: Readonly<{ landingPage: string; sourceVersion: string; asOf: string }>;
        schoolSource: Readonly<{ landingPage: string; sourceVersion: string; asOf: string }>;
        coordinateSource: Readonly<{ landingPage: string; sourceVersion: string; asOf: string }>;
        methodology: 'WGS84 Haversine straight-line metres';
      }>;
    }>
  | Readonly<{
      status: 'missing' | 'invalid';
      selection: KoreaExploreProximitySelection;
    }>;

export type ExploreBuildingProximityModel = Readonly<{
  coordinateStatus: 'ready' | 'pending_coordinate' | 'unavailable';
  nearestStation: Readonly<{
    sourceId: string;
    name: string;
    lines: readonly string[];
    distanceMeters: number;
  }> | null;
  nearestSchool: Readonly<{
    sourceId: string;
    name: string;
    distanceMeters: number;
  }> | null;
}>;

export type ExploreBuildingAvailability =
  | Readonly<{
      status: 'ready';
      buildings: readonly ExploreBuildingModel[];
      total: number;
      page: number;
      pageSize: number;
    }>
  | Readonly<{
      status: 'not_loaded';
      fallbackBuildings: readonly ExploreBuildingModel[];
    }>;

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
  spread: SpreadVerdict | null;
  change: ChangeReliability | null;
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
      period: EvidencePeriodModel;
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
      period: EvidencePeriodModel;
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
