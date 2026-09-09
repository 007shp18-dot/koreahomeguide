import type { PublicEntityMedia } from '../public-data/entity-media-projection.server';
import type { StoredPublicPhotoApproval } from './building-photo-store.server';
import type { ProjectedEntityMediaModel } from '../../components/public-market/projected-entity-media';

/** Current approval can replace yesterday's materialized public projection. */
export function selectPublishedBuildingPhoto(
  projected: readonly PublicEntityMedia[],
  approval?: StoredPublicPhotoApproval | null,
  expectedBuildingKey?: string,
): ProjectedEntityMediaModel | null {
  if (approval && expectedBuildingKey && approval.buildingKey !== expectedBuildingKey) approval = null;
  if (approval?.subjectKind === 'map-only') return null;
  const selected = projected.find(media => media.displayUrl !== null || media.providerReference !== null);
  if (approval && (!selected || Date.parse(approval.approvedAt) >= Date.parse(selected.publishedAt))) {
    return {
      displayUrl: approval.assetUrl,
      providerReference: approval.placeId,
      relationship: approval.subjectKind === 'site-aerial' ? 'parent' : 'exact',
      width: null, height: null, focalX: null, focalY: null,
      attributionName: approval.attributionName,
      attributionUrl: approval.attributionUrl,
      sourcePageUrl: approval.sourcePageUrl ?? null,
    };
  }
  return selected ? { ...selected, relationship: selected.exactSubject ? 'exact' : 'parent' } : null;
}
