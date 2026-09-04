import 'server-only';

type RegistryEntry = Readonly<{
  placeId: string;
  buildingName: string;
  address: string;
  approvedAt: string;
  approvedBy: string;
}>;

export type PublicPhotoApproval = Readonly<{
  placeId: string;
  buildingName: string;
  address: string;
  approvedAt: string;
}>;

function isRegistryEntry(value: unknown): value is RegistryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return ['placeId', 'buildingName', 'address', 'approvedAt', 'approvedBy']
    .every((key) => typeof item[key] === 'string' && item[key] !== '');
}

export function verifiedBuildingPhotoRegistryFromEnvironment(): Readonly<Record<string, RegistryEntry>> {
  const source = process.env.VERIFIED_BUILDING_PHOTO_REGISTRY?.trim();
  if (!source) return Object.freeze({});
  try {
    const parsed = JSON.parse(source) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return Object.freeze({});
    return Object.freeze(Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, RegistryEntry] => (
      entry[0].length > 0 && isRegistryEntry(entry[1])
    ))));
  } catch {
    return Object.freeze({});
  }
}

export function getPublicPhotoApproval(key: string): PublicPhotoApproval | null {
  const entry = verifiedBuildingPhotoRegistryFromEnvironment()[key];
  if (entry === undefined) return null;
  return Object.freeze({
    placeId: entry.placeId,
    buildingName: entry.buildingName,
    address: entry.address,
    approvedAt: entry.approvedAt,
  });
}
