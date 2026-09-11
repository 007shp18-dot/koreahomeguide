import { dubaiProjectEvidenceForContext } from '@/lib/dubai/project-evidence.server';
import { DubaiShell } from '@/components/dubai/dubai-shell';
import { DubaiExplorer } from '@/components/dubai/dubai-explorer';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import { parseDubaiExploreState } from '@/lib/dubai/explore-model';
import { buildDubaiExploreModel } from '@/lib/dubai/route-model.server';

type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams;
  return { ...indexableMetadata({ path: '/zh-cn/ae/dubai/explore/', title: '迪拜房价与租赁收益率：现房和期房比较 | signedprice', description: '比较迪拜各区域的现房和期房成交价、每平方米价格、年租金及估算毛租赁收益率，查看样本数量与统计期间。' }), ...(Object.keys(query).length ? { robots: { index: false, follow: true } } : {}) };
}

export default async function DubaiExplorePage({ searchParams }: Props) {
  const query = await searchParams;
  const initial = parseDubaiExploreState(query);
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  return <DubaiShell locale="zh-CN" href="/zh-cn/ae/dubai/explore/"><main><DubaiExplorer locale="zh-CN"
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
