import type { Metadata } from 'next';

import { DubaiCheckWorkspace } from '@/components/dubai/dubai-check-workspace';
import { DubaiShell } from '@/components/dubai/dubai-shell';
import {
  resolveDubaiCheckRouteState,
} from '@/lib/dubai/check-model';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import { buildDubaiCheckModel } from '@/lib/dubai/route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

type SearchParams = Readonly<Record<string, string | string[] | undefined>>;
type Props = Readonly<{ searchParams?: Promise<SearchParams> }>;

export async function generateMetadata({
  searchParams = Promise.resolve({}),
}: Props = {}): Promise<Metadata> {
  const query = await searchParams;
  const model = buildDubaiCheckModel(dubaiEvidenceRepositoryFromEnvironment());
  if (model.status === 'unavailable') return {
    title: '두바이 매물 가격 비교 | signedprice',
    description: '현재 가격 비교에 필요한 두바이 지역별 거래 자료를 이용할 수 없습니다.',
    robots: { index: false, follow: true },
  };
  const metadata = indexableMetadata({
    locale: 'ko_KR', imagePath: '/og/ko/', path: '/ko/ae/dubai/check/',
    title: '두바이 매물 가격 비교 | signedprice',
    description: '완공·분양 주택을 구분해 지역 실거래가 중앙값과 ㎡당 가격을 비교하세요. 직접 입력한 예상 연 임대료로 비용 차감 전 수익률도 계산합니다.',
  });
  return Object.keys(query).length === 0
    ? metadata
    : { ...metadata, robots: { index: false, follow: true } };
}

export default async function DubaiCheckPage({
  searchParams = Promise.resolve({}),
}: Props = {}) {
  const query: SearchParams = await searchParams;
  const state = resolveDubaiCheckRouteState(query);
  const model = buildDubaiCheckModel(dubaiEvidenceRepositoryFromEnvironment());
  return <DubaiShell locale="ko" href="/ko/ae/dubai/check/"><main><DubaiCheckWorkspace locale="ko" model={model} state={state} /></main></DubaiShell>;
}
