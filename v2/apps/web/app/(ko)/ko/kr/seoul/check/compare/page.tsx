import { resolveSeoulEntityCheckContext } from '@/lib/contract-check/entity-context.server';
import { ContractCheckWorkspace } from '@/components/contract-check/contract-check-workspace';
import { buildContractCheckMetadata } from '@/lib/contract-check/metadata.server';
import { buildContractCheckRouteModel } from '@/lib/contract-check/route-model.server';

export function generateMetadata() {
  return buildContractCheckMetadata('ko');
}

export default async function KoreanOfferComparisonPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const query = await searchParams;
  const model = buildContractCheckRouteModel(undefined,query);
  const entityContext = model.status === 'ready' ? resolveSeoulEntityCheckContext(query,{locale:'ko',districtSlug:model.selection.districtSlug,buildingId:model.selection.buildingId,buildingName:model.buildingName}) : null;
  return <ContractCheckWorkspace locale="ko" model={model} entityContext={entityContext} />;
}
