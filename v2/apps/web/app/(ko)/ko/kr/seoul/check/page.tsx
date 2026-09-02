import { SingleQuoteCheckWorkspace } from '@/components/contract-check/single-quote-check';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '@/lib/contract-check/evidence-repositories.server';
import { contractCheckCurvesFromEnvironment } from '@/lib/contract-check/route-model.server';
import { buildSingleQuoteCheckMetadata } from '@/lib/single-quote-check/metadata.server';
import { buildSingleQuoteCheckRouteModel } from '@/lib/single-quote-check/route-model.server';

export function generateMetadata() {
  return buildSingleQuoteCheckMetadata('ko');
}

export default async function KoreanContractCheckPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const model = buildSingleQuoteCheckRouteModel(
    contractCheckEvidenceRepositoriesFromEnvironment(),
    await searchParams,
    contractCheckCurvesFromEnvironment(),
  );
  return <SingleQuoteCheckWorkspace locale="ko" model={model} />;
}
