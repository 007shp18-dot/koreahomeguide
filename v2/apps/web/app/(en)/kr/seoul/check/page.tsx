import { ContractCheckWorkspace } from '@/components/contract-check/contract-check-workspace';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { buildContractCheckRouteModel } from '@/lib/contract-check/route-model.server';
import { buildKoreaPublicPageMetadata } from '@/lib/public-market/route-model.server';

export function generateMetadata() {
  return buildKoreaPublicPageMetadata('/kr/seoul/check/');
}

export default function SeoulContractCheckPage() {
  const model = buildContractCheckRouteModel();
  return (
    <>
      <ContractCheckWorkspace model={model} />
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: 'Seoul', path: '/kr/seoul/' },
        { name: 'Check', path: '/kr/seoul/check/' },
      ]} />
    </>
  );
}
