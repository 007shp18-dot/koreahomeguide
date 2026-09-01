import type { PublishedMarketSummary } from '@signedprice/market-core';
import type {
  PublicBuildingHousingType,
} from './building-summary-schema';
import type { SeoulRentCheckDistrict } from '@signedprice/korea-rent/browser';

export const PUBLIC_PROPERTY_TYPES = ['apartment', 'officetel', 'villa'] as const;
export type PublicPropertyTypeSlug = (typeof PUBLIC_PROPERTY_TYPES)[number];

export type PublicPropertyTypeIdentity = Readonly<{
  slug: PublicPropertyTypeSlug;
  sourceValue: PublicBuildingHousingType;
  label: string;
}>;

export type PublicPropertyTypeBuildingLink = Readonly<{
  id: string;
  name: string;
  neighborhoodName: string;
  sampleCount: number;
  href: `/kr/seoul/explore/${string}/${string}/`;
}>;

export type PublicPropertyTypeModel = Readonly<{
  status: 'ready';
  district: SeoulRentCheckDistrict;
  propertyType: PublicPropertyTypeIdentity;
  distribution: PublishedMarketSummary;
  coverage: Readonly<{
    retainedBuildings: number;
    contributingBuildings: number;
    retainedContracts: number;
    publicationMinimum: number;
  }>;
  buildings: readonly PublicPropertyTypeBuildingLink[];
  evidence: Readonly<{
    provider: 'MOLIT';
    dataset: 'reported rent contracts';
    period: string;
    generatedAt: string;
    rightsPolicyId: 'kr-molit-rent-v1';
    exclusions: readonly string[];
    coverageNote: string;
  }>;
}>;
