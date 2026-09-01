import { ContractCheckWorkspace } from '../../components/contract-check/contract-check-workspace';
import { buildContractCheckRouteModel } from '../../lib/contract-check/route-model.server';
import { buildKoreaPublicPageMetadata } from '../../lib/public-market/route-model.server';
import { SeoulLive } from '../../components/public-market/seoul-live';
import { buildSeoulLiveModel } from '../../lib/public-market/seoul-live-model.server';

export function generateMetadata() {
  return buildKoreaPublicPageMetadata('/kr/');
}

export default function KoreaHomePage() {
  return (
    <ContractCheckWorkspace
      model={buildContractCheckRouteModel()}
      entry={<SeoulLive model={buildSeoulLiveModel()} mode="korea" />}
    />
  );
}
