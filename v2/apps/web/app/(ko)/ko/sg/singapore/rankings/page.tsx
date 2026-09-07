import { singaporeMetadata } from '@/lib/locale/singapore-copy';
import { singaporeProjectDisplayName } from '@/lib/singapore/project-display-name';
import type { Metadata } from 'next';

import { SingaporeRankings, type SingaporeRankingRow } from '@/components/singapore/singapore-rankings';
import { SingaporePage } from '@/components/singapore/singapore-shell';
import { indexableMetadata } from '@/lib/public-metadata';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

export const metadata: Metadata = singaporeMetadata(indexableMetadata({
  path: '/ko/sg/singapore/rankings/',
  title: 'Singapore private residential project rankings | signedprice',
  description: 'Compare published URA project sale medians, unit prices and reported transaction volumes.',
}));

export default async function SingaporeRankingsPage() {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const context = repository?.getContext();
  const rows: readonly SingaporeRankingRow[] = repository === null ? Object.freeze([]) : Object.freeze(
    repository.listSegments().flatMap(({ segment }) => repository.listProjects(segment))
      .filter((project) => project.published && project.medianPriceSgd !== null && project.medianPsf !== null)
      .map((project) => Object.freeze({
        id: project.id,
        name: singaporeProjectDisplayName(project),
        segment: project.marketSegment,
        district: project.district,
        street: project.street,
        sample: project.n,
        medianPriceSgd: project.medianPriceSgd!,
        medianPsf: project.medianPsf!,
        href: `/ko/sg/singapore/explore/${project.marketSegment.toLowerCase()}/${project.id}/`,
      })),
  );
  const periodLabel = context === undefined ? 'Verified evidence unavailable' : context.period.replace('..', '–');
  return <SingaporePage locale="ko" currentHref="/ko/sg/singapore/rankings/" unframed>
    <SingaporeRankings locale="ko" rows={rows} periodLabel={periodLabel} />
  </SingaporePage>;
}
