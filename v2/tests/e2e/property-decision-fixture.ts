import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const DECISION_BUILDING_ID = 'songpa-gu-1j88w6f';
export const DECISION_BUILDING_ENTITY = `kr-seoul:estate:${DECISION_BUILDING_ID}`;
export const DECISION_BUILDING_PATH = `/kr/seoul/explore/songpa-gu/${DECISION_BUILDING_ID}/`;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
}

/** Exact checked-in Helio cohort, used only by the isolated panel browser run. */
export function decisionBuildingArtifact(): string {
  const source = JSON.parse(readFileSync(
    new URL('../../apps/web/data/public-building-summary.json', import.meta.url), 'utf8',
  )) as Record<string, unknown> & {
    records: { buildingId: string; districtSlug: string; name: string }[];
  };
  const building = source.records.find(record => record.buildingId === DECISION_BUILDING_ID);
  if (building?.districtSlug !== 'songpa-gu' || building.name !== '헬리오시티') {
    throw new Error('The isolated decision-panel fixture requires the checked-in Helio City identity.');
  }
  // Keep the original period, distributions, publication rules and coordinates.
  // No observations or prices are synthesized or assigned to another building.
  const unsigned: Record<string, unknown> = { ...source, totalRecordCount: 1, records: [building] };
  delete unsigned.sha256;
  return JSON.stringify({
    ...unsigned,
    sha256: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  });
}
