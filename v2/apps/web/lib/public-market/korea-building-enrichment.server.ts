import 'server-only';

import type {
  PublicEntityProjection,
} from '../public-data/entity-location-projection.server';
import type {
  StoredPublicPhotoApproval,
} from '../photos/building-photo-store.server';

type ProjectionReader = Readonly<{
  listBuildings(
    entityIds: readonly string[],
  ): Promise<ReadonlyMap<string, PublicEntityProjection> | null>;
}>;

export type KoreaBuildingEnrichment = Readonly<{
  entityProjection: PublicEntityProjection | null;
  photoApproval: StoredPublicPhotoApproval | null;
  photoApprovalReadFailed: boolean;
}>;

type KoreaBuildingEnrichmentLoaderDependencies = Readonly<{
  phase(): string | undefined;
  listPrerenderedBuildingIds(): readonly string[];
  projectionReader(): ProjectionReader | null;
  listPhotoApprovals(
    keys: readonly string[],
  ): Promise<Readonly<{
    approvals: ReadonlyMap<string, StoredPublicPhotoApproval>;
    databaseReadFailed: boolean;
  }>>;
}>;

const PRODUCTION_BUILD_PHASE = 'phase-production-build';

function uniqueBuildingIds(buildingIds: readonly string[]): readonly string[] {
  return Object.freeze([
    ...new Set(buildingIds.filter((buildingId) => buildingId.trim() !== '')),
  ].slice(0, 2_500));
}

export function createKoreaBuildingEnrichmentLoader(
  dependencies: KoreaBuildingEnrichmentLoaderDependencies,
): (buildingId: string) => Promise<KoreaBuildingEnrichment> {
  let prerenderWave: Promise<Readonly<{
    projections: ReadonlyMap<string, PublicEntityProjection> | null;
    approvals: ReadonlyMap<string, StoredPublicPhotoApproval>;
    photoApprovalReadFailed: boolean;
  }>> | undefined;

  async function load(buildingIds: readonly string[]) {
    const ids = uniqueBuildingIds(buildingIds);
    const projectionReader = dependencies.projectionReader();
    const [projections, photoApprovals] = await Promise.all([
      projectionReader === null
        ? Promise.resolve(null)
        : projectionReader.listBuildings(ids.map((id) => `kr-seoul:estate:${id}`)),
      dependencies.listPhotoApprovals(ids.map((id) => `kr-seoul:${id}`)),
    ]);
    return Object.freeze({
      projections,
      approvals: photoApprovals.approvals,
      photoApprovalReadFailed: photoApprovals.databaseReadFailed,
    });
  }

  return async (buildingId) => {
    const isProductionBuild = dependencies.phase() === PRODUCTION_BUILD_PHASE;
    const wave = isProductionBuild
      ? prerenderWave ??= load(dependencies.listPrerenderedBuildingIds())
      : load([buildingId]);
    const { projections, approvals, photoApprovalReadFailed } = await wave;
    const photoApproval = approvals.get(`kr-seoul:${buildingId}`) ?? null;
    return Object.freeze({
      entityProjection: projections?.get(`kr-seoul:estate:${buildingId}`) ?? null,
      photoApproval,
      photoApprovalReadFailed: photoApproval === null && photoApprovalReadFailed,
    });
  };
}
