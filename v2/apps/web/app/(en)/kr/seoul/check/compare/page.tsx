import { ContractCheckWorkspace } from '@/components/contract-check/contract-check-workspace';
import { buildContractCheckRouteModel } from '@/lib/contract-check/route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({
  path: '/kr/seoul/check/compare/',
  title: 'Compare Seoul rental offers | signedprice',
  description: 'Compare two Seoul rental offers on the same deposit-adjusted monthly-cost basis.',
});

export default function SeoulOfferComparisonPage() {
  return <ContractCheckWorkspace model={buildContractCheckRouteModel()} />;
}
