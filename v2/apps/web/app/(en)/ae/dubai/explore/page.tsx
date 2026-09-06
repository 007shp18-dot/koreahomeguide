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
  return { ...indexableMetadata({ path: '/ae/dubai/explore/', title: 'Explore Dubai areas | signedprice', description: 'Locate Downtown Dubai, Business Bay, Dubai Marina and Palm Jumeirah. Read area context and verify projects through official DLD services.' }), ...(Object.keys(query).length ? { robots: { index: false, follow: true } } : {}) };
}

export default async function DubaiExplorePage({ searchParams }: Props) {
  const query = await searchParams;
  const initial = parseDubaiExploreState(query);
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  return <DubaiShell href="/ae/dubai/explore/"><main><DubaiExplorer
    browserKey={googleMapsBrowserKeyFromEnvironment()}
    model={buildDubaiExploreModel(repository)}
    initialQuery={initial.query}
    initialArea={initial.selectedArea ?? ''}
    initialHousing={initial.housing}
    initialStage={initial.stage}
    initialBudgetMaximumAed={initial.budgetMaximumAed}
    initialYieldMinimumPct={initial.yieldMinimumPct}
    initialPage={initial.page}
  /></main></DubaiShell>;
}
