import {Suspense} from 'react';
import {SeoulCheckClient} from '@/components/contract-check/seoul-check-client';
import { resolveSeoulEntityCheckContext } from '@/lib/contract-check/entity-context.server';
import { SingleQuoteCheckWorkspace } from '@/components/contract-check/single-quote-check';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '@/lib/contract-check/evidence-repositories.server';
import { contractCheckCurvesFromEnvironment } from '@/lib/contract-check/route-model.server';
import { buildSingleQuoteCheckMetadata } from '@/lib/single-quote-check/metadata.server';
import { buildSingleQuoteCheckRouteModel } from '@/lib/single-quote-check/route-model.server';

export const dynamic = 'force-static';

export function generateMetadata() {
  return buildSingleQuoteCheckMetadata('ko');
}

export default async function KoreanContractCheckPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const query = await searchParams;
  const model = buildSingleQuoteCheckRouteModel(
    contractCheckEvidenceRepositoriesFromEnvironment(),
    query,
    contractCheckCurvesFromEnvironment(),
  );
  const entityContext = resolveSeoulEntityCheckContext(query, {locale:'ko',districtSlug:model.selection.districtSlug,buildingId:model.selection.buildingId,buildingName:model.buildingName});
  return <Suspense fallback={<SingleQuoteCheckWorkspace locale="ko" model={model} entityContext={entityContext} />}><SeoulCheckClient initialModel={model} initialContext={entityContext} locale="ko" /></Suspense>;
}
