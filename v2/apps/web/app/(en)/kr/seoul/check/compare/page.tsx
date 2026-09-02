import { ContractCheckWorkspace } from '@/components/contract-check/contract-check-workspace';
import { buildContractCheckMetadata } from '@/lib/contract-check/metadata.server';
import { buildContractCheckRouteModel } from '@/lib/contract-check/route-model.server';

export function generateMetadata() {
  return buildContractCheckMetadata('en');
}

export default async function SeoulOfferComparisonPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  return <ContractCheckWorkspace model={buildContractCheckRouteModel(undefined, await searchParams)} />;
}
