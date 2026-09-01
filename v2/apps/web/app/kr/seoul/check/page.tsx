import { ContractCheckWorkspace } from '../../../../components/contract-check/contract-check-workspace';
import { buildContractCheckRouteModel } from '../../../../lib/contract-check/route-model.server';
import { buildKoreaPublicPageMetadata } from '../../../../lib/public-market/route-model.server';

export function generateMetadata() {
  return buildKoreaPublicPageMetadata('/kr/seoul/check/');
}

export default function SeoulContractCheckPage() {
  return <ContractCheckWorkspace model={buildContractCheckRouteModel()} />;
}
