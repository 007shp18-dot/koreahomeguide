import { SingleQuoteCheckWorkspace } from '@/components/single-quote-check/single-quote-check-workspace';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { indexableMetadata } from '@/lib/public-metadata';
import { buildSingleQuoteCheckRouteModel } from '@/lib/single-quote-check/route-model.server';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/check/',
  title: '서울 매매·전세·월세 제시가격 확인 | signedprice',
  description: '서울 매매·전세·월세 제시가격 하나를 조건이 맞는 공식 신고 거래 근거와 비교합니다.',
  locale: 'ko_KR',
  imagePath: '/og/ko/',
  languageAlternates: { en: '/kr/seoul/check/', ko: '/ko/kr/seoul/check/' },
});

export default async function KoreanContractCheckPage({
  searchParams = Promise.resolve({}),
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const model = buildSingleQuoteCheckRouteModel(
    koreaEvidenceRepositoriesFromEnvironment(),
    await searchParams,
  );
  return <SingleQuoteCheckWorkspace locale="ko" model={model} />;
}
