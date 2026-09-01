import 'server-only';

import {
  createPublicMarketSummary,
  median,
  percentile,
  roundWon,
} from '@signedprice/market-core';
import {
  getSeoulDistrictBySlug,
  SEOUL_RENT_CHECK_DISTRICTS,
  type SeoulDistrictSlug,
} from '@signedprice/korea-rent/browser';

import {
  createPublicBuildingRepository,
  publicBuildingRepositoryFromEnvironment,
  type PublicBuildingRepository,
} from './building-summary-repository.server';
import {
  PUBLIC_PROPERTY_TYPES,
  type PublicPropertyTypeIdentity,
  type PublicPropertyTypeModel,
  type PublicPropertyTypeSlug,
} from './property-type-route-types';

export type PublicPropertyTypeRouteDependencies = Readonly<{
  source: unknown;
  period: string;
}>;

export type PublicPropertyTypeRouteParam = Readonly<{
  district: SeoulDistrictSlug;
  propertyType: PublicPropertyTypeSlug;
}>;

const propertyTypeBySlug = Object.freeze({
  apartment: Object.freeze({
    slug: 'apartment', sourceValue: 'apartment', label: 'Apartments',
  }),
  officetel: Object.freeze({
    slug: 'officetel', sourceValue: 'officetel', label: 'Officetels',
  }),
  villa: Object.freeze({
    slug: 'villa',
    sourceValue: 'villa_multifamily',
    label: 'Villas and multifamily homes',
  }),
} as const satisfies Record<PublicPropertyTypeSlug, PublicPropertyTypeIdentity>);

function propertyTypeIdentity(value: string): PublicPropertyTypeIdentity | null {
  return PUBLIC_PROPERTY_TYPES.includes(value as PublicPropertyTypeSlug)
    ? propertyTypeBySlug[value as PublicPropertyTypeSlug]
    : null;
}

function repositoryFor(
  dependencies: PublicPropertyTypeRouteDependencies | undefined,
): PublicBuildingRepository | null {
  if (dependencies === undefined) return publicBuildingRepositoryFromEnvironment();
  try {
    return createPublicBuildingRepository({
      source: dependencies.source,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
  } catch {
    return null;
  }
}

function buildFromRepository(
  districtSlug: string,
  requestedPropertyType: string,
  repository: PublicBuildingRepository | null,
): PublicPropertyTypeModel | null {
  const district = getSeoulDistrictBySlug(districtSlug);
  const propertyType = propertyTypeIdentity(requestedPropertyType);
  if (district === null || propertyType === null || repository === null) return null;
  const retainedBuildings = repository.listByDistrict(district.slug)
    .filter(({ housingType }) => housingType === propertyType.sourceValue);
  if (retainedBuildings.length === 0) return null;
  const publicationMinimum = Math.max(
    ...retainedBuildings.map((building) => building.publicationMinimum),
  );
  const contributingBuildings = retainedBuildings.filter(
    ({ recentContracts }) => recentContracts.length > 0,
  );
  const contracts = contributingBuildings.flatMap(({ recentContracts }) => recentContracts);
  if (contracts.length < publicationMinimum) return null;
  const deposits = contracts.map(({ depositWon }) => depositWon);
  const context = repository.getContext();
  const distribution = createPublicMarketSummary({
    marketId: 'kr-seoul',
    area: `${district.slug}-${propertyType.slug}`,
    parent: district.slug,
    deal: 'jeonse',
    band: `retained-recent-${propertyType.slug}`,
    period: context.period,
    n: deposits.length,
    min: Math.min(...deposits),
    p25: roundWon(percentile(deposits, 0.25)),
    med: roundWon(median(deposits)),
    p75: roundWon(percentile(deposits, 0.75)),
    max: Math.max(...deposits),
    chg3m: null,
  });
  if (!distribution.published) return null;
  const buildingCount = contributingBuildings.length;
  const coverageNote = `Distribution uses ${contracts.length} retained recent contracts from ${buildingCount} published building${buildingCount === 1 ? '' : 's'}; it is not the complete district/type contract history.`;
  return Object.freeze({
    status: 'ready',
    district,
    propertyType,
    distribution,
    coverage: Object.freeze({
      retainedBuildings: retainedBuildings.length,
      contributingBuildings: buildingCount,
      retainedContracts: contracts.length,
      publicationMinimum,
    }),
    buildings: Object.freeze(contributingBuildings.map((building) => Object.freeze({
      id: building.buildingId,
      name: building.name,
      neighborhoodName: building.neighborhoodName,
      sampleCount: building.recentContracts.length,
      href: `/kr/seoul/explore/${district.slug}/${building.buildingId}/` as const,
    }))),
    evidence: Object.freeze({
      provider: context.provider,
      dataset: context.dataset,
      period: context.period,
      generatedAt: context.generatedAt,
      rightsPolicyId: context.rightsPolicyId,
      exclusions: context.exclusions,
      coverageNote,
    }),
  });
}

export function buildPublicPropertyTypeModel(
  districtSlug: string,
  requestedPropertyType: string,
  dependencies?: PublicPropertyTypeRouteDependencies,
): PublicPropertyTypeModel | null {
  return buildFromRepository(
    districtSlug,
    requestedPropertyType,
    repositoryFor(dependencies),
  );
}

export function listPublicPropertyTypeRouteParams(
  dependencies?: PublicPropertyTypeRouteDependencies,
): readonly PublicPropertyTypeRouteParam[] {
  const repository = repositoryFor(dependencies);
  if (repository === null) return Object.freeze([]);
  return Object.freeze(SEOUL_RENT_CHECK_DISTRICTS.flatMap(({ slug: district }) => (
    PUBLIC_PROPERTY_TYPES.flatMap((propertyType) => (
      buildFromRepository(district, propertyType, repository) === null
        ? []
        : [Object.freeze({ district, propertyType })]
    ))
  )));
}
