import { SingleQuoteCheckWorkspace } from '@/components/contract-check/single-quote-check';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '@/lib/contract-check/evidence-repositories.server';
import { contractCheckCurvesFromEnvironment } from '@/lib/contract-check/route-model.server';
import { buildSingleQuoteCheckRouteModel } from '@/lib/single-quote-check/route-model.server';
import { buildSingleQuoteCheckMetadata } from '@/lib/single-quote-check/metadata.server';
import { parseEntityCheckContext } from '@/lib/navigation/explorer-selection';
import { buildPublicBuildingModel } from '@/lib/public-market/building-route-model.server';

export function generateMetadata() {
  return buildSingleQuoteCheckMetadata('en');
}

export default async function SeoulContractCheckPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const query = await searchParams;
  const model = buildSingleQuoteCheckRouteModel(
    contractCheckEvidenceRepositoriesFromEnvironment(),
    query,
    contractCheckCurvesFromEnvironment(),
  );
  const buildingId = model.selection.buildingId;
  // Navigation identity can remain published even when Check has no matching cohort.
  const knownBuilding = buildingId !== null && (
    model.buildingName !== null
    || buildPublicBuildingModel(model.selection.districtSlug, buildingId) !== null
  );
  const entityContext = !knownBuilding || buildingId === null
    ? null
    : parseEntityCheckContext(query, {
        market: 'kr-seoul',
        entityIds: [buildingId],
      });
  return (
    <>
      <SingleQuoteCheckWorkspace model={model} entityContext={entityContext} />
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: 'Seoul', path: '/kr/seoul/' },
        { name: 'Check', path: '/kr/seoul/check/' },
      ]} />
    </>
  );
}
