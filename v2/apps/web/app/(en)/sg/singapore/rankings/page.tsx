import { singaporeProjectDisplayName } from '@/lib/singapore/project-display-name';
import type { Metadata } from 'next';

import { SingaporeRankings } from '@/components/singapore/singapore-rankings';
import { SingaporePage } from '@/components/singapore/singapore-shell';
import { indexableMetadata } from '@/lib/public-metadata';
import {
  buildSingaporeRankingsModel,
  type SingaporeRankingMetric,
  type SingaporeRankingSourceRow,
} from '@/lib/public-market/rankings-route-model.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

export const metadata: Metadata = indexableMetadata({
  path: '/sg/singapore/rankings/',
  title: 'Singapore private residential project rankings | signedprice',
  description: 'Compare published URA project sale medians, unit prices and reported transaction volumes.',
  languageAlternates: { en: '/sg/singapore/rankings/', ko: '/ko/sg/singapore/rankings/', 'zh-Hans': '/zh-cn/sg/singapore/rankings/' },
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
        href: `/sg/singapore/explore/${project.marketSegment.toLowerCase()}/${project.id}/`,
      })),
  );
  const { metric, page } = selection(await searchParams);
  const model = buildSingaporeRankingsModel(rows, metric, page);
  const periodLabel = context === undefined ? 'Verified evidence unavailable' : context.period.replace('..', '–');
  return <SingaporePage currentHref="/sg/singapore/rankings/" unframed><SingaporeRankings model={model} periodLabel={periodLabel} /></SingaporePage>;
}

export const revalidate = 3_600;
