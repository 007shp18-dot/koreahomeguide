import { SingleQuoteCheckWorkspace } from '@/components/single-quote-check/single-quote-check-workspace';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { buildKoreaPublicPageMetadata } from '@/lib/public-market/route-model.server';
import { buildSingleQuoteCheckRouteModel } from '@/lib/single-quote-check/route-model.server';

export function generateMetadata() {
  return buildKoreaPublicPageMetadata('/kr/seoul/check/');
}

export default async function SeoulContractCheckPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const model = buildSingleQuoteCheckRouteModel(
    koreaEvidenceRepositoriesFromEnvironment(),
    await searchParams,
  );
  return (
    <>
      <SingleQuoteCheckWorkspace model={model} />
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: 'Seoul', path: '/kr/seoul/' },
        { name: 'Check', path: '/kr/seoul/check/' },
      ]} />
    </>
  );
}
