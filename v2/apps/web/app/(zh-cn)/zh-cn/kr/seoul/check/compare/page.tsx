import { resolveSeoulEntityCheckContext } from '@/lib/contract-check/entity-context.server';
import { ContractCheckWorkspace } from '@/components/contract-check/contract-check-workspace';
import { buildContractCheckMetadata } from '@/lib/contract-check/metadata.server';
import { buildContractCheckRouteModel } from '@/lib/contract-check/route-model.server';

export function generateMetadata() {
  return buildContractCheckMetadata('zh-CN');
}

export default async function ChineseOfferComparisonPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const query = await searchParams;
  const model = buildContractCheckRouteModel(undefined,query);
  const entityContext = model.status === 'ready' ? resolveSeoulEntityCheckContext(query,{locale:'zh-CN',districtSlug:model.selection.districtSlug,buildingId:model.selection.buildingId,buildingName:model.buildingName}) : null;
  return <ContractCheckWorkspace locale="zh-CN" model={model} entityContext={entityContext} />;
}
