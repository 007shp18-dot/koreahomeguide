import { SingleQuoteCheckWorkspace } from '@/components/single-quote-check/single-quote-check-workspace';
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
  );
  return <SingleQuoteCheckWorkspace locale="ko" model={model} />;
}
