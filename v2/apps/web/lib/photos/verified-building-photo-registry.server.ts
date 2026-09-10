import 'server-only';

type RegistryEntry = Readonly<{
  placeId: string;
  buildingName: string;
  address: string;
  approvedAt: string;
  approvedBy: string;
}>;

type GooglePlacePhotoApproval = Readonly<{
  placeId: string;
  buildingName: string;
  address: string;
  approvedAt: string;
}>;

type LicensedPhotoApproval = Readonly<{
  provider: 'licensed-url';
  placeId: null;
  assetUrl: string;
  attributionName: string;
  attributionUrl: string;
  buildingName: string;
  address: string;
  approvedAt: string;
}>;

export type PublicPhotoApproval = GooglePlacePhotoApproval | LicensedPhotoApproval;

const REVIEWED_LICENSED_PHOTOS = Object.freeze({
  'sg-project:RCR:THE INTERLACE': Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/The_Interlace_Singapore.jpg',
    attributionName: 'kallerna · CC BY-SA 4.0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:The_Interlace_Singapore.jpg',
    buildingName: 'THE INTERLACE', address: 'DEPOT ROAD, Singapore', approvedAt: '2026-09-06',
  }),
  'sg-project:RCR:REFLECTIONS AT KEPPEL BAY': Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Reflections_at_Keppel_Bay.JPG',
    attributionName: 'Grayswoodsurrey · CC BY-SA 4.0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:Reflections_at_Keppel_Bay.JPG',
    buildingName: 'REFLECTIONS AT KEPPEL BAY', address: 'KEPPEL BAY VIEW, Singapore', approvedAt: '2026-09-06',
  }),
  'sg-project:CCR:THE SAIL @ MARINA BAY': Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/The_Sail_%40_Marina_Bay%2C_Singapore.jpg',
    attributionName: 'William Cho · CC BY-SA 2.0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:The_Sail_%40_Marina_Bay,_Singapore.jpg',
    buildingName: 'THE SAIL @ MARINA BAY', address: 'MARINA BOULEVARD, Singapore', approvedAt: '2026-09-06',
  }),
  'sg-project:RCR:SKY HABITAT': Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Sky_Habitat_at_Dawn.jpg',
    attributionName: 'MTCKSG · CC BY-SA 4.0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:Sky_Habitat_at_Dawn.jpg',
    buildingName: 'SKY HABITAT', address: 'BISHAN STREET 15, Singapore', approvedAt: '2026-09-06',
  }),
  'sg-project:CCR:ONE SHENTON': Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/One_Shenton_Way_20250904.jpg',
    attributionName: 'DvTor8303 · CC0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:One_Shenton_Way_20250904.jpg',
    buildingName: 'ONE SHENTON', address: 'SHENTON WAY, Singapore', approvedAt: '2026-09-06',
  }),
  'sg-project:CCR:SOUTH BEACH RESIDENCES': Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Recreation_club_and_SB_Residences_from_Padang.jpg',
    attributionName: 'Orderinchaos · CC BY-SA 4.0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:Recreation_club_and_SB_Residences_from_Padang.jpg',
    buildingName: 'SOUTH BEACH RESIDENCES', address: 'BEACH ROAD, Singapore', approvedAt: '2026-09-06',
  }),
  "sg-project:RCR:PEOPLE'S PARK COMPLEX": Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Saying_goodbye_to_People%E2%80%99s_Park_Complex_soon.jpg',
    attributionName: 'Rikoshots · CC BY-SA 4.0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:Saying_goodbye_to_People%E2%80%99s_Park_Complex_soon.jpg',
    buildingName: "PEOPLE'S PARK COMPLEX", address: 'PARK ROAD, Singapore', approvedAt: '2026-09-06',
  }),
  'sg-project:CCR:V ON SHENTON': Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/V_on_Shenton_20250904.jpg',
    attributionName: 'DvTor8303 · CC0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:V_on_Shenton_20250904.jpg',
    buildingName: 'V ON SHENTON', address: 'SHENTON WAY, Singapore', approvedAt: '2026-09-06',
  }),
  'sg-project:CCR:MARINA BAY SUITES': Object.freeze({
    provider: 'licensed-url', placeId: null,
    assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Marina_Bay_Suites.jpg',
    attributionName: 'Nicolas Lannuzel · CC BY 2.0',
    attributionUrl: 'https://commons.wikimedia.org/wiki/File:Marina_Bay_Suites.jpg',
    buildingName: 'MARINA BAY SUITES', address: 'CENTRAL BOULEVARD, Singapore', approvedAt: '2026-09-06',
  }),
} satisfies Readonly<Record<string, LicensedPhotoApproval>>);

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
  if (entry === undefined) return REVIEWED_LICENSED_PHOTOS[key as keyof typeof REVIEWED_LICENSED_PHOTOS] ?? null;
  return Object.freeze({
    placeId: entry.placeId,
    buildingName: entry.buildingName,
    address: entry.address,
    approvedAt: entry.approvedAt,
  });
}
