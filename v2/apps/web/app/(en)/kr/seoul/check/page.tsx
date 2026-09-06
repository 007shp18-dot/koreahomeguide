import { resolveSeoulEntityCheckContext } from '@/lib/contract-check/entity-context.server';
import { SingleQuoteCheckWorkspace } from '@/components/contract-check/single-quote-check';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '@/lib/contract-check/evidence-repositories.server';
import { contractCheckCurvesFromEnvironment } from '@/lib/contract-check/route-model.server';
import { buildSingleQuoteCheckRouteModel } from '@/lib/single-quote-check/route-model.server';
import { buildSingleQuoteCheckMetadata } from '@/lib/single-quote-check/metadata.server';

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
  const entityContext = resolveSeoulEntityCheckContext(query, {locale:'en',districtSlug:model.selection.districtSlug,buildingId:model.selection.buildingId,buildingName:model.buildingName});
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
