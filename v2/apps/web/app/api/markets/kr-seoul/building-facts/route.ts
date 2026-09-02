import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent';

import { createBuildingFactsGetHandler } from '@/lib/public-market/building-facts-route-handler.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { buildObservedBuildingIdentityModel } from '@/lib/public-market/observed-building-route-model.server';
import { loadOfficialBuildingFacts } from '@/lib/public-market/official-building-facts.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const repositories = koreaEvidenceRepositoriesFromEnvironment();

export const GET = createBuildingFactsGetHandler({
  serviceKey: process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY
    ?? process.env.DATA_GO_KR_SERVICE_KEY,
  load: loadOfficialBuildingFacts,
  resolveIdentity(districtSlug, buildingId) {
    const district = SEOUL_RENT_CHECK_DISTRICTS.find(({ slug }) => slug === districtSlug);
    if (district === undefined) return null;
    let building;
    try { building = repositories.rent?.getBuilding(district.slug, buildingId); } catch { building = undefined; }
    if (building === undefined) {
      try { building = repositories.sale?.getBuilding(district.slug, buildingId); } catch { building = undefined; }
    }
    if (building === undefined) {
      const observed = buildObservedBuildingIdentityModel(district.slug, buildingId);
      if (observed === null) return null;
      building = observed.building;
    }
    return Object.freeze({
      districtLawdCd: district.lawdCd,
      neighborhoodName: building.neighborhoodName,
      officialName: building.officialName,
      housingType: building.housingType,
    });
  },
});
