import 'server-only';

import { createDubaiCheckHref } from './check-model';
import type { DubaiEvidenceRepository } from './evidence-repository.server';
import type {
  DubaiAreaModel,
  DubaiAreaSegmentModel,
  DubaiCheckModel,
  DubaiExploreArea,
  DubaiExploreModel,
} from './route-types';

const unavailable = Object.freeze({
  status: 'unavailable' as const,
  message: 'Verified Dubai area evidence unavailable' as const,
});

export function buildDubaiExploreModel(
  repository: DubaiEvidenceRepository | null,
): DubaiExploreModel {
  if (repository === null) return unavailable;
  const indexable = new Set(repository.listAreaRouteParams().map(({ area }) => area));
  return Object.freeze({
    status: 'ready',
    context: repository.getContext(),
    areas: Object.freeze(repository.listAreas().map((area): DubaiExploreArea => Object.freeze({
      ...area,
      href: indexable.has(area.slug) ? `/ae/dubai/explore/${area.slug}/` : null,
    }))),
  });
}
export function buildDubaiAreaModel(
  repository: DubaiEvidenceRepository | null,
  slug: string,
): DubaiAreaModel | null {
  if (repository === null) return null;
  if (!repository.listAreaRouteParams().some(({ area }) => area === slug)) return null;
  const area = repository.getArea(slug);
  if (area === null) return null;
  const byId = new Map(repository.listAreas().map((candidate) => [candidate.id, candidate] as const));
  const resolveComparables = (ids: readonly string[]) => Object.freeze(ids.flatMap((id) => {
    const comparable = byId.get(id);
    return comparable === undefined ? [] : [Object.freeze({
      id: comparable.id,
      slug: comparable.slug,
      name: comparable.name,
      href: `/ae/dubai/explore/${comparable.slug}/` as const,
    })];
  }));
  const segments = area.segments.map((segment): DubaiAreaSegmentModel => Object.freeze({
    ...segment,
    comparableAreas: Object.freeze({
      ready: resolveComparables(segment.comparableAreaIds.ready),
      offPlan: resolveComparables(segment.comparableAreaIds.offPlan),
    }),
  }));
  const primary = segments[0];
  if (primary === undefined) return null;
  const completion = primary.sales.ready === null ? 'off-plan' : 'ready';
  return Object.freeze({
    status: 'ready',
    identity: Object.freeze({
      id: area.id,
      slug: area.slug,
      name: area.name,
      searchAliases: area.searchAliases,
    }),
    segments: Object.freeze(segments),
    context: repository.getContext(),
    checkHref: createDubaiCheckHref({
      area: area.slug,
      housing: primary.housing,
      completion,
      askingPriceAed: null,
      areaSqm: null,
      annualRentAed: null,
      returnTo: `/ae/dubai/explore/${area.slug}/`,
    }),
  });
}

export function buildDubaiAreaSeo(model: DubaiAreaModel): Readonly<{
  title: string;
  description: string;
}> {
  const year = model.context.asOfDate.slice(0, 4);
  const housing = model.segments.length === 1
    ? model.segments[0]!.housing
    : 'property';
  const hasReady = model.segments.some(({ sales }) => sales.ready !== null);
  const hasOffPlan = model.segments.some(({ sales }) => sales.offPlan !== null);
  const hasYield = model.segments.some(({ readyGrossYieldPct }) => readyGrossYieldPct !== null);
  const stageLabel = hasReady && hasOffPlan ? 'Ready and Off-Plan'
    : hasReady ? 'Ready'
      : 'Off-Plan';
  const title = !hasReady
    ? `${model.identity.name} off-plan ${housing} prices ${year} | signedprice`
    : `${model.identity.name} ${housing} sale prices${hasYield ? ' and rent evidence' : ''} ${year} | signedprice`;
  return Object.freeze({
    title,
    description: `${stageLabel} ${housing} price evidence for ${model.identity.name}, with AED per square metre, registered sample sizes, and data through ${model.context.asOfDate}.`,
  });
}

export function buildDubaiCheckModel(
  repository: DubaiEvidenceRepository | null,
): DubaiCheckModel {
  if (repository === null || repository.listAreaRouteParams().length === 0) return unavailable;
  return Object.freeze({
    status: 'ready',
    context: repository.getContext(),
    areas: Object.freeze(repository.listAreas().map((area) => Object.freeze({
      slug: area.slug,
      name: area.name,
      housing: Object.freeze(area.segments.map(({ housing }) => housing)),
      evidence: area,
    }))),
  });
}
