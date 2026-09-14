import { dubaiProjectEvidenceForContext } from '@/lib/dubai/project-evidence.server';
import { DubaiShell } from '@/components/dubai/dubai-shell';
import { DubaiExplorer } from '@/components/dubai/dubai-explorer';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { indexableMetadata } from '@/lib/public-metadata';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import { parseDubaiExploreState } from '@/lib/dubai/explore-model';
import { buildDubaiExploreModel } from '@/lib/dubai/route-model.server';

type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams;
  return { ...indexableMetadata({ locale: 'ko_KR', imagePath: '/og/ko/', path: '/ko/ae/dubai/explore/', title: '두바이 지역별 실거래가와 임대수익률 | signedprice', description: '두바이 지역별 준공·분양 주택의 매매가와 면적당 가격, 연간 임대료, 추정 총임대수익률을 비교하세요. 거래 건수와 집계 기간도 함께 확인할 수 있습니다.' }), ...(Object.keys(query).length ? { robots: { index: false, follow: true } } : {}) };
}

export default async function DubaiExplorePage({ searchParams }: Props) {
  const query = await searchParams;
  const initial = parseDubaiExploreState(query);
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  return <DubaiShell locale="ko" href="/ko/ae/dubai/explore/"><main><DubaiExplorer locale="ko"
    browserKey={googleMapsBrowserKeyFromEnvironment()}
    model={buildDubaiExploreModel(repository)}
    projects={repository === null ? [] : dubaiProjectEvidenceForContext(repository.getContext())}
    initialQuery={initial.query}
    initialArea={initial.selectedArea ?? ''}
    initialHousing={initial.housing}
    initialStage={initial.stage}
    initialBudgetMaximumAed={initial.budgetMaximumAed}
    initialYieldMinimumPct={initial.yieldMinimumPct}
    initialPage={initial.page}
    initialProjectId={initial.selectedProject ?? null}
  /></main></DubaiShell>;
}
