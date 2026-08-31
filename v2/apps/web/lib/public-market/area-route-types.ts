import type {
  PublishedMarketSummary,
  PublicMarketSummary,
  WithheldMarketSummary,
} from '@signedprice/market-core';
import type {
  SeoulDistrictSlug,
  SeoulLawdCd,
  SeoulRentCheckDistrict,
} from '@signedprice/korea-rent/browser';

export type ExploreDistrictModel = Readonly<{
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  nameEn: string;
  nameKo: string;
  href: `/kr/seoul/${string}/`;
  path: string;
  summary: PublicMarketSummary;
  state: 'published' | 'withheld';
  bucket: 0 | 1 | 2 | 3 | 4 | null;
  sampleLabel: string;
  medianLabel: string | null;
  changeLabel: string | null;
}>;

export type PublicAreaLegendBucket = Readonly<{
  bucket: 0 | 1 | 2 | 3 | 4;
  count: number;
  minimumMedian: number;
  maximumMedian: number;
  label: string;
}>;

export type PublicSourceBoundaryModel = Readonly<{
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

export type PublicAreaExploreModel =
  | Readonly<{
      status: 'ready';
      selectedSlug: SeoulDistrictSlug;
      citySummary: PublicMarketSummary;
      districts: readonly ExploreDistrictModel[];
      legend: readonly PublicAreaLegendBucket[];
      source: PublicAreaSourceBoundaryModel;
    }>
  | Readonly<{
      status: 'unavailable';
      selectedSlug: null;
      districts: readonly [];
      source: PublicAreaSourceBoundaryModel;
      message: 'Verified district summary unavailable';
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
    }>
  | Readonly<{
      status: 'unavailable';
      identity: SeoulRentCheckDistrict;
      nearby: readonly SeoulRentCheckDistrict[];
      source: PublicAreaSourceBoundaryModel;
      message: 'Verified district summary unavailable';
    }>;
