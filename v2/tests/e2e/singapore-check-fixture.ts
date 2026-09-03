import { createHash } from 'node:crypto';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
}

function artifact(market: string, sourceIdentifier: string, records: readonly Record<string, unknown>[]) {
  const unsigned = { version: 'signedprice-singapore-check-market-v1', market, sourceIdentifier, generatedAt: '2026-09-02T00:00:00.000Z', period: { from: '2026-08', to: '2026-08' }, recordCount: records.length, records };
  return { ...unsigned, digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex') };
}

const ura = artifact('ura-private-sale', 'URA private residential transactions', [1, 2, 3, 4, 5].map((value) => ({
  market: 'ura-private-sale', month: '2026-08', amountSgd: value * 100_000,
  marketSegment: 'CCR', projectId: 'project-a', project: 'Project A', propertyType: 'Condominium', district: '09',
  floorAreaSqm: 100, floorRange: '06-10', tenure: '99 yrs', saleType: 'Resale', psf: 1_900,
})));
const resale = artifact('hdb-resale', 'HDB resale transactions', [400, 425, 450, 475, 500].map((value) => ({
  market: 'hdb-resale', month: '2026-08', amountSgd: value * 1_000, town: 'BEDOK', blockId: 'block-a', block: '10', street: 'BEDOK ROAD',
  flatType: '3-ROOM', storeyRange: '07 TO 09', floorAreaSqm: 68, remainingLease: '60 years', flatModel: 'New Generation',
})));
const rent = artifact('hdb-rent', 'HDB rental approvals', [2_000, 2_100, 2_200, 2_300, 2_400].map((amountSgd) => ({
  market: 'hdb-rent', month: '2026-08', amountSgd, town: 'BEDOK', blockId: 'block-a', block: '10', street: 'BEDOK ROAD', flatType: '3-ROOM',
})));

export const SINGAPORE_CHECK_URA_TEST_ARTIFACT = JSON.stringify(ura);
export const SINGAPORE_CHECK_URA_TEST_SHA256 = ura.digest;
export const SINGAPORE_CHECK_HDB_RESALE_TEST_ARTIFACT = JSON.stringify(resale);
export const SINGAPORE_CHECK_HDB_RESALE_TEST_SHA256 = resale.digest;
export const SINGAPORE_CHECK_HDB_RENT_TEST_ARTIFACT = JSON.stringify(rent);
export const SINGAPORE_CHECK_HDB_RENT_TEST_SHA256 = rent.digest;
export const SINGAPORE_CHECK_TEST_PERIOD = '2026-08/2026-08';
