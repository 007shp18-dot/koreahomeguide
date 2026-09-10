import type { KoreaRentRecord } from '@signedprice/korea-rent';
import { createPropertyIdentity } from '@signedprice/market-core';

import { freezeProjection, type GlobalPropertyProjection } from './projection';

type SeoulRentProjectionInput = Readonly<{
  districtSlug: string;
  neighborhoodId: string;
  neighborhoodName: string;
  buildingId: string;
  buildingName: string;
  housingType: 'apartment' | 'officetel' | 'villa_multifamily';
  record: KoreaRentRecord;
}>;

function required(value: string | undefined, field: string): string {
  if (value === undefined || value.trim() === '') throw new Error(`${field} is required`);
  return value.trim();
}

export function projectSeoulRentRecord(input: SeoulRentProjectionInput): GlobalPropertyProjection {
  const sourceRecordId = required(input.record.sourceRecordId, 'sourceRecordId');
  const entity = createPropertyIdentity({
    id: `kr-seoul:estate:${required(input.buildingId, 'buildingId')}`,
    marketId: 'kr-seoul',
    geographyId: `kr-seoul:neighborhood:${required(input.neighborhoodId, 'neighborhoodId')}`,
    parentId: null,
    kind: 'estate',
    canonicalName: required(input.buildingName, 'buildingName'),
    identityStatus: 'verified',
    externalIdentifiers: [{
      sourceId: 'signedprice-korea-building',
      type: 'building-id',
      value: input.buildingId,
    }],
    localSchemaVersion: 'kr-property@1',
    localAttributes: {
      housingType: input.housingType,
      neighborhoodName: required(input.neighborhoodName, 'neighborhoodName'),
    },
  });
  const status = input.record.recordStatus === 'cancelled' ? 'cancelled' : 'active';
  return freezeProjection({
    entity,
    sourceRecord: { datasetId: 'kr-molit-rent', businessKey: sourceRecordId },
    observation: {
      kind: 'rent',
      stage: input.record.contractType,
      observedAt: input.record.contractDate,
      amountMinor: null,
      currencyCode: 'KRW',
      depositMinor: input.record.depositWon,
      recurringAmountMinor: input.record.monthlyRentWon,
      frequency: 'monthly',
      propertyAreaSqm: input.record.areaSqm,
      areaBasis: 'exclusive',
      floorRange: null,
      tenureKind: null,
      tenureStart: null,
      status,
      localAttributes: { sourceHousingType: input.record.sourceHousingType },
    },
  });
}
