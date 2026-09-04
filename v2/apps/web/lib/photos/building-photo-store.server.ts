import 'server-only';

import { contentDatabase } from '../db/postgres.server';
import { getPublicPhotoApproval } from './verified-building-photo-registry.server';

export type StoredPublicPhotoApproval = Readonly<{
  provider: 'google-place' | 'licensed-url' | 'owned-object';
  placeId: string | null;
  assetUrl: string | null;
  attributionName: string | null;
  attributionUrl: string | null;
  buildingName: string;
  address: string;
  approvedAt: string;
}>;

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function getStoredPublicPhotoApproval(key: string): Promise<StoredPublicPhotoApproval | null> {
  const sql = contentDatabase();
  if (sql !== null) {
    try {
      const [row] = await sql`
        SELECT
          photo.provider,
          photo.provider_place_id,
          photo.asset_url,
          photo.attribution_name,
          photo.attribution_url,
          building.official_name,
          coalesce(building.road_address, building.legal_address) AS address,
          photo.approved_at
        FROM building_photos photo
        JOIN buildings building ON building.key = photo.building_key
        WHERE photo.registry_key = ${key}
          AND photo.status = 'approved'
        ORDER BY photo.position, photo.id
        LIMIT 1
      `;
      const provider = row?.provider;
      const buildingName = row?.official_name;
      const address = row?.address;
      const approvedAt = row?.approved_at instanceof Date
        ? row.approved_at.toISOString()
        : typeof row?.approved_at === 'string' ? row.approved_at : null;
      if (['google-place', 'licensed-url', 'owned-object'].includes(String(provider))
        && typeof buildingName === 'string' && typeof address === 'string' && approvedAt !== null) {
        const assetUrl = safeHttpUrl(row?.asset_url);
        const placeId = typeof row?.provider_place_id === 'string' ? row.provider_place_id : null;
        if ((provider === 'google-place' && placeId !== null)
          || (provider !== 'google-place' && assetUrl !== null)) {
          return Object.freeze({
            provider: provider as StoredPublicPhotoApproval['provider'],
            placeId,
            assetUrl,
            attributionName: typeof row?.attribution_name === 'string' ? row.attribution_name : null,
            attributionUrl: safeHttpUrl(row?.attribution_url),
            buildingName,
            address,
            approvedAt,
          });
        }
      }
    } catch (error) {
      console.error('SignedPrice approved-photo database read failed.', error);
    }
  }
  const fallback = getPublicPhotoApproval(key);
  return fallback === null ? null : Object.freeze({
    provider: 'google-place',
    placeId: fallback.placeId,
    assetUrl: null,
    attributionName: null,
    attributionUrl: null,
    buildingName: fallback.buildingName,
    address: fallback.address,
    approvedAt: fallback.approvedAt,
  });
}

export type PhotoApprovalInput = Readonly<{
  registryKey: string;
  marketKey: 'seoul' | 'singapore' | 'dubai';
  buildingKey: string;
  externalId: string;
  buildingName: string;
  address: string;
  provider: StoredPublicPhotoApproval['provider'];
  placeId: string | null;
  assetUrl: string | null;
  attributionName: string | null;
  attributionUrl: string | null;
}>;

export async function approveBuildingPhoto(input: PhotoApprovalInput): Promise<void> {
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  const market = input.marketKey === 'seoul'
    ? { name: 'Seoul', countryCode: 'KR' }
    : input.marketKey === 'singapore'
      ? { name: 'Singapore', countryCode: 'SG' }
      : { name: 'Dubai', countryCode: 'AE' };
  const normalizedName = input.buildingName.normalize('NFKC').toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, '');
  await sql`
    WITH market_upsert AS (
      INSERT INTO markets (key, name, country_code)
      VALUES (${input.marketKey}, ${market.name}, ${market.countryCode})
      ON CONFLICT (key) DO UPDATE SET name = excluded.name, updated_at = now()
      RETURNING key
    ), building_upsert AS (
      INSERT INTO buildings (
        key, market_key, external_id, official_name, normalized_name,
        legal_address, identity_status
      )
      SELECT
        ${input.buildingKey}, market_upsert.key, ${input.externalId}, ${input.buildingName},
        ${normalizedName}, ${input.address}, 'verified'
      FROM market_upsert
      ON CONFLICT (key) DO UPDATE SET
        official_name = excluded.official_name,
        normalized_name = excluded.normalized_name,
        legal_address = excluded.legal_address,
        identity_status = 'verified',
        updated_at = now()
      RETURNING key
    )
    INSERT INTO building_photos (
      building_key, registry_key, provider, provider_place_id, asset_url,
      attribution_name, attribution_url, status, approved_at, approved_by
    )
    SELECT
      building_upsert.key, ${input.registryKey}, ${input.provider}, ${input.placeId}, ${input.assetUrl},
      ${input.attributionName}, ${input.attributionUrl}, 'approved', now(), 'content-admin-api'
    FROM building_upsert
    ON CONFLICT (registry_key) DO UPDATE SET
      building_key = excluded.building_key,
      provider = excluded.provider,
      provider_place_id = excluded.provider_place_id,
      asset_url = excluded.asset_url,
      attribution_name = excluded.attribution_name,
      attribution_url = excluded.attribution_url,
      status = 'approved',
      approved_at = now(),
      approved_by = 'content-admin-api',
      checked_at = now(),
      updated_at = now()
  `;
}

