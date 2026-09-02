import { SingleQuoteCheckWorkspace } from '@/components/contract-check/single-quote-check';
import { contractCheckCurvesFromEnvironment } from '@/lib/contract-check/route-model.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { buildSingleQuoteCheckMetadata } from '@/lib/single-quote-check/metadata.server';
import { buildSingleQuoteCheckRouteModel } from '@/lib/single-quote-check/route-model.server';

export function generateMetadata() {
  return buildSingleQuoteCheckMetadata('ko');
}

export default async function KoreanContractCheckPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const model = buildSingleQuoteCheckRouteModel(
    koreaEvidenceRepositoriesFromEnvironment(),
    await searchParams,
    contractCheckCurvesFromEnvironment(),
  );
  return <SingleQuoteCheckWorkspace locale="ko" model={model} />;
}
