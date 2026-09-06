import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent';

import { createBuildingFactsGetHandler } from '@/lib/public-market/building-facts-route-handler.server';
import { loadStoredBuildingFacts, storeBuildingFacts } from '@/lib/public-market/building-facts-store.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { buildObservedBuildingIdentityModel } from '@/lib/public-market/observed-building-route-model.server';
import { installedKaptBuildingFactsSnapshot } from '@/lib/public-market/kapt-building-facts-snapshot.server';
import { loadOfficialBuildingFacts } from '@/lib/public-market/official-building-facts.server';

export const dynamic = 'force-dynamic';
// The official identity join is sequential (complex list → complex profile →
// register profile). Keep enough execution time for the verified chain instead
// of letting the client receive an opaque platform timeout.
export const maxDuration = 30;

const repositories = koreaEvidenceRepositoriesFromEnvironment();
const kaptSnapshot = installedKaptBuildingFactsSnapshot();

function normalizedName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[^\p{L}\p{N}]+/gu, '');
}

export const GET = createBuildingFactsGetHandler({
  serviceKey: process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY
    ?? process.env.DATA_GO_KR_SERVICE_KEY,
  load: loadOfficialBuildingFacts,
  loadStored: loadStoredBuildingFacts,
  loadInstalled(identity) {
    const record = kaptSnapshot?.records().find(({ buildingId }) => buildingId === identity.buildingId);
    if (record === undefined || record.districtSlug !== identity.districtSlug
      || normalizedName(record.officialName) !== normalizedName(identity.officialName)
      || !record.facts.match.bjdCode.startsWith(identity.districtLawdCd)) return null;
    return record.facts;
  },
  storeReady: storeBuildingFacts,
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
