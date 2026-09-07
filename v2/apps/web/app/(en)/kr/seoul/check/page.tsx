import {Suspense} from 'react';
import {SeoulCheckClient} from '@/components/contract-check/seoul-check-client';
import { resolveSeoulEntityCheckContext } from '@/lib/contract-check/entity-context.server';
import { SingleQuoteCheckWorkspace } from '@/components/contract-check/single-quote-check';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '@/lib/contract-check/evidence-repositories.server';
import { contractCheckCurvesFromEnvironment } from '@/lib/contract-check/route-model.server';
import { buildSingleQuoteCheckRouteModel } from '@/lib/single-quote-check/route-model.server';
import { buildSingleQuoteCheckMetadata } from '@/lib/single-quote-check/metadata.server';

export const dynamic = 'force-static';

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
      <Suspense fallback={<SingleQuoteCheckWorkspace model={model} entityContext={entityContext} />}><SeoulCheckClient initialModel={model} initialContext={entityContext} locale="en" /></Suspense>
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: 'Seoul', path: '/kr/seoul/' },
        { name: 'Check', path: '/kr/seoul/check/' },
      ]} />
    </>
  );
}
