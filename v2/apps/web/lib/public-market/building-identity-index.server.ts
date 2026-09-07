import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent';
import { parseObservedBuildingArtifact } from './observed-building-schema';

type Identity = Readonly<{ districtLawdCd: string; neighborhoodName: string; officialName: string; housingType: string }>;
let index: Map<string, Identity> | undefined;

export function resolveIndexedBuildingIdentity(districtSlug: string, buildingId: string): Identity | null {
  const override = process.env.SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT;
  if (override) {
    const record = parseObservedBuildingArtifact(JSON.parse(override), { marketId: 'kr-seoul', period: process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '' }).records.find(row => row.districtSlug === districtSlug && row.buildingId === buildingId);
    const districtLawdCd = SEOUL_RENT_CHECK_DISTRICTS.find(row => row.slug === districtSlug)?.lawdCd;
    return record && districtLawdCd ? { districtLawdCd, neighborhoodName: record.neighborhoodName, officialName: record.officialName, housingType: record.housingType } : null;
  }
  if (!index) {
    const path = ['data/building-identity-index.json.gz', 'apps/web/data/building-identity-index.json.gz'].map(name => resolve(process.cwd(), name)).find(existsSync);
    if (!path) throw new Error('Building identity index missing; run prebuild');
    const artifact = JSON.parse(gunzipSync(readFileSync(path)).toString('utf8'));
    if (artifact.version !== 1 || !Array.isArray(artifact.rows)) throw new Error('Invalid building identity index');
    const next = new Map<string, Identity>();
    for (const row of artifact.rows) {
      if (!Array.isArray(row) || row.length !== 5 || row.some(value => typeof value !== 'string' || !value)) throw new Error('Invalid building identity');
      const [id, district, neighborhoodName, officialName, housingType] = row as string[];
      const districtLawdCd = SEOUL_RENT_CHECK_DISTRICTS.find(value => value.slug === district)?.lawdCd;
      const key = `${district}:${id}`;
      if (!districtLawdCd || next.has(key)) throw new Error('Invalid building identity district or duplicate');
      next.set(key, Object.freeze({ districtLawdCd, neighborhoodName: neighborhoodName!, officialName: officialName!, housingType: housingType! }));
    }
    index = next;
  }
  return index.get(`${districtSlug}:${buildingId}`) ?? null;
}
