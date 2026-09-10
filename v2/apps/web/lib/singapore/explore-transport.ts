import type { SingaporeExploreModel, SingaporeProjectListItem, SingaporeSegmentListItem } from './route-types';

type ReadyModel = Extract<SingaporeExploreModel, { status: 'ready' }>;
type PackedProject = readonly [
  id: string, name: string, street: string, district: string, count: number,
  published: boolean, price: string | null, psf: string | null,
  location: readonly [number, number] | null | 0,
];
export type PackedSingaporeExploreModel = Exclude<SingaporeExploreModel, ReadyModel> | (
  Omit<ReadyModel, 'segments'> & Readonly<{
    encoding: 'projects-v1';
    segments: readonly (Omit<SingaporeSegmentListItem, 'projects'> & { projects?: readonly PackedProject[] })[];
  }>
);

// A lossless wire representation: do not send thousands of repeated property
// names, provider strings and URLs containing the same 64-character IDs.
export function packSingaporeExploreModel(model: SingaporeExploreModel): PackedSingaporeExploreModel {
  if (model.status !== 'ready') return model;
  return { ...model, encoding: 'projects-v1', segments: model.segments.map(({ projects, ...segment }) => ({
    ...segment,
    ...(projects === undefined ? {} : { projects: projects.map((p): PackedProject => [
      p.id, p.name, p.street, p.district, p.n, p.state === 'published', p.medianPriceLabel, p.medianPsfLabel,
      p.location === undefined ? 0 : p.location === null ? null : [p.location.latitude, p.location.longitude],
    ]) }),
  })) };
}

export function unpackSingaporeExploreModel(model: PackedSingaporeExploreModel | SingaporeExploreModel): SingaporeExploreModel {
  if (!('encoding' in model)) return model;
  return { status: model.status, transactionLabel: model.transactionLabel, periodLabel: model.periodLabel,
    correctionHref: model.correctionHref, evidence: model.evidence,
    segments: model.segments.map(({ projects, ...segment }) => ({
    ...segment,
    ...(projects === undefined ? {} : { projects: projects.map((p): SingaporeProjectListItem => ({
      id: p[0], name: p[1], street: p[2], district: p[3], n: p[4],
      state: p[5] ? 'published' : 'insufficient', medianPriceLabel: p[6], medianPsfLabel: p[7],
      href: `/sg/singapore/explore/${segment.code.toLowerCase() as Lowercase<typeof segment.code>}/${p[0]}/`,
      ...(p[8] === 0 ? {} : { location: p[8] === null ? null : { latitude: p[8][0], longitude: p[8][1], provider: 'URA' } }),
    })) }),
  })) };
}
