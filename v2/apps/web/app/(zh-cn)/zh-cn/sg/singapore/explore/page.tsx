import type { Metadata } from 'next';

import { SingaporeExplorer } from '@/components/singapore/singapore-explorer';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
import { buildSingaporeExploreModel } from '@/lib/singapore/route-model.server';
import { singaporeExploreOverview } from '@/lib/singapore/explore-progressive.server';
import { buildHdbExploreModel } from '@/lib/singapore/hdb-route-model.server';
import { hdbSnapshotRepositoryFromEnvironment } from '@/lib/singapore/hdb-snapshot-repository.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';

export const metadata: Metadata = indexableMetadata({
  path: '/zh-cn/sg/singapore/explore/',
  title: '探索新加坡私人住宅与组屋 | signedprice',
  description: '比较经核验的 URA 私人住宅交易，并分别查看组屋转售、租赁和楼宇资料。',
});

// The installed URA snapshot is deployment-bound and expensive to expand. Build
// this route once so query-string filters never trigger that work per request.
export const dynamic = 'force-static';

export default async function SingaporeExplorePage() {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const hdbRepository = hdbSnapshotRepositoryFromEnvironment();
  const googleMapsBrowserKey = googleMapsBrowserKeyFromEnvironment();
  const overview = singaporeExploreOverview(buildSingaporeExploreModel(repository));
  return <SingaporeExplorer locale="zh-CN"
    model={overview.model}
    progressive
    regionPoints={overview.regionPoints}
    districtSummary={overview.districtSummary}
    hdbModel={buildHdbExploreModel(hdbRepository)}
    googleMapsBrowserKey={googleMapsBrowserKey}
    restoreStateFromUrl
  />;
}

export const revalidate = 3_600;
