export type LicensedBuildingPhoto = Readonly<{
  src: `/assets/buildings/${string}`;
  sourceLabel: string;
  rightsPolicyId: string;
}>;

export type BuildingVisualModel =
  | Readonly<{
      kind: 'licensed_photo';
      src: LicensedBuildingPhoto['src'];
      alt: string;
      sourceLabel: string;
      rightsPolicyId: string;
    }>
  | Readonly<{
      kind: 'unavailable';
      title: string;
      reason: string;
      nextAction: Readonly<{ label: string; href: string }>;
    }>;

function trimmed(value: string): boolean {
  return value.length > 0 && value === value.trim();
}

export function buildBuildingVisualModel(input: Readonly<{
  buildingName: string;
  mapHref: string;
  photo: LicensedBuildingPhoto | null;
}>): BuildingVisualModel {
  const photo = input.photo;
  if (
    photo !== null
    && /^\/assets\/buildings\/[a-z0-9][a-z0-9._/-]*$/i.test(photo.src)
    && trimmed(photo.sourceLabel)
    && trimmed(photo.rightsPolicyId)
  ) {
    return Object.freeze({
      kind: 'licensed_photo',
      src: photo.src,
      alt: `${input.buildingName} exterior`,
      sourceLabel: photo.sourceLabel,
      rightsPolicyId: photo.rightsPolicyId,
    });
  }
  return Object.freeze({
    kind: 'unavailable',
    title: 'Verified building image is not available',
    reason: 'A rights-cleared building photo or provider render is not connected.',
    nextAction: Object.freeze({
      label: 'View this building area on the map',
      href: input.mapHref,
    }),
  });
}
