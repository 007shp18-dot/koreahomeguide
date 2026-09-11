import { singaporeProjectDisplayName } from '@/lib/singapore/project-display-name';
import type { Metadata } from 'next';

import { SingaporeRankings } from '@/components/singapore/singapore-rankings';
import { SingaporePage } from '@/components/singapore/singapore-shell';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
import {
  buildSingaporeRankingsModel,
  type SingaporeRankingMetric,
  type SingaporeRankingSourceRow,
} from '@/lib/public-market/rankings-route-model.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

export const metadata: Metadata = indexableMetadata({
  path: '/zh-cn/sg/singapore/rankings/',
  title: '新加坡私人住宅项目排名 | signedprice',
  description: '比较已公开的 URA 项目成交中位价、单位面积价格及申报成交量。',
  languageAlternates: { en: '/zh-cn/sg/singapore/rankings/', ko: '/ko/sg/singapore/rankings/' },
});

type Props = Readonly<{ searchParams?: Promise<Readonly<{ metric?: string | string[]; page?: string | string[] }>> }>;

function selection(query: Awaited<NonNullable<Props['searchParams']>>) {
  const metric = typeof query.metric === 'string' && ['price', 'psf', 'sample'].includes(query.metric)
    ? query.metric as SingaporeRankingMetric
    : 'price';
  const pageValue = typeof query.page === 'string' ? Number.parseInt(query.page, 10) : 1;
  return { metric, page: Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1 } as const;
}

export default async function SingaporeRankingsPage({ searchParams = Promise.resolve({}) }: Props = {}) {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const context = repository?.getContext();
  const rows: readonly SingaporeRankingSourceRow[] = repository === null ? Object.freeze([]) : Object.freeze(
    repository.listSegments().flatMap(({ segment }) => repository.listProjects(segment))
      .filter((project) => project.published)
      .map((project) => Object.freeze({
        id: project.id,
        name: singaporeProjectDisplayName(project),
        segment: project.marketSegment,
        district: project.district,
        street: project.street,
        sample: project.n,
        medianPriceSgd: project.medianPriceSgd,
        medianPsf: project.medianPsf,
        href: `/zh-cn/sg/singapore/explore/${project.marketSegment.toLowerCase()}/${project.id}/`,
      })),
  );
  const { metric, page } = selection(await searchParams);
  const model = buildSingaporeRankingsModel(rows, metric, page);
  const periodLabel = context === undefined ? 'Verified evidence unavailable' : context.period.replace('..', '–');
  return <SingaporePage locale="zh-CN" currentHref="/zh-cn/sg/singapore/rankings/" unframed><SingaporeRankings locale="zh-CN" model={model} periodLabel={periodLabel} /></SingaporePage>;
}

export const revalidate = 3_600;
