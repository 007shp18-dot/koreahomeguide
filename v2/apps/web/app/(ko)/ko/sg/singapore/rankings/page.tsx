import { singaporeMetadata } from '@/lib/locale/singapore-copy';
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

export const metadata: Metadata = singaporeMetadata(indexableMetadata({
  path: '/ko/sg/singapore/rankings/',
  title: '싱가포르 민간주택 단지 가격 순위 | signedprice',
  description: '게시 기준을 통과한 URA 단지의 매매 중앙값, 면적당 가격과 신고 건수를 비교합니다.',
}));

type Props = Readonly<{ searchParams?: Promise<Readonly<{ metric?: string | string[]; page?: string | string[] }>> }>;

export default async function SingaporeRankingsPage({ searchParams = Promise.resolve({}) }: Props = {}) {
  const query = await searchParams;
  const metric = typeof query.metric === 'string' && ['price', 'psf', 'sample'].includes(query.metric)
    ? query.metric as SingaporeRankingMetric
    : 'price';
  const pageValue = typeof query.page === 'string' ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
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
  const model = buildSingaporeRankingsModel(rows, metric, page);
  const periodLabel = context === undefined ? 'Verified evidence unavailable' : context.period.replace('..', '–');
  return <SingaporePage locale="ko" currentHref="/ko/sg/singapore/rankings/" unframed><SingaporeRankings locale="ko" model={model} periodLabel={periodLabel} /></SingaporePage>;
}

export const revalidate = 60;
