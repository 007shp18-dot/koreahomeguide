import type {
  HdbRentalRecord,
  HdbResaleRecord,
  SingaporeSnapshotRecord,
} from '@signedprice/singapore-property';
import { createPropertyIdentity } from '@signedprice/market-core';

import { freezeProjection, type GlobalPropertyProjection } from './projection';

type HdbResaleProjectionInput = HdbResaleRecord & Readonly<{ blockId: string }>;
type HdbRentalProjectionInput = HdbRentalRecord & Readonly<{ blockId: string }>;

function hdbEntity(input: Readonly<{
  blockId: string;
  town: string;
  block: string;
  street: string;
}>) {
  return createPropertyIdentity({
    id: `sg-singapore:block:${input.blockId}`,
    marketId: 'sg-singapore',
    geographyId: `sg-singapore:town:${input.town.toLocaleLowerCase('en-SG').replace(/[^a-z0-9]+/g, '-')}`,
    parentId: null,
    kind: 'block',
    canonicalName: `${input.block} ${input.street}`,
    identityStatus: 'verified',
    externalIdentifiers: [{ sourceId: 'hdb', type: 'block-id', value: input.blockId }],
    localSchemaVersion: 'sg-hdb@1',
    localAttributes: { housingSector: 'hdb' },
  });
}

function tenureKind(tenure: string): 'freehold' | 'leasehold' | null {
  if (/freehold/iu.test(tenure)) return 'freehold';
  if (/lease/iu.test(tenure)) return 'leasehold';
  return null;
}

export function projectUraPrivateSaleRecord(
  input: SingaporeSnapshotRecord,
): GlobalPropertyProjection {
  const entity = createPropertyIdentity({
    id: `sg-singapore:project:${input.projectId}`,
    marketId: 'sg-singapore',
    geographyId: `sg-singapore:district:${input.district}`,
    parentId: null,
    kind: 'project',
    canonicalName: input.project,
    identityStatus: 'verified',
    externalIdentifiers: [{ sourceId: 'ura-private-sale', type: 'project-id', value: input.projectId }],
    localSchemaVersion: 'sg-private@1',
    localAttributes: { housingSector: 'private_residential', marketSegment: input.marketSegment },
  });
  return freezeProjection({
    entity,
    sourceRecord: {
      datasetId: 'sg-ura-private-sale',
      businessKey: `${input.sourceOrder.batch}:${input.sourceOrder.project}:${input.sourceOrder.transaction}`,
    },
    observation: {
      kind: 'sale',
      stage: input.saleType,
      observedAt: input.contractMonth,
      amountMinor: input.priceSgd * 100,
      currencyCode: 'SGD',
      depositMinor: null,
      recurringAmountMinor: null,
      frequency: 'once',
      propertyAreaSqm: input.areaSqm,
      areaBasis: input.areaBasis,
      floorRange: input.floorRange,
      tenureKind: tenureKind(input.tenure),
      tenureStart: null,
      status: 'active',
      localAttributes: { propertyType: input.propertyType, units: input.units, psf: input.psf },
    },
  });
}

export function projectHdbResaleRecord(input: HdbResaleProjectionInput): GlobalPropertyProjection {
  return freezeProjection({
    entity: hdbEntity(input),
    sourceRecord: { datasetId: 'sg-hdb-resale', businessKey: String(input.sourceRow) },
    observation: {
      kind: 'sale',
      stage: 'resale',
      observedAt: `${input.month}-01`,
      amountMinor: input.resalePriceSgd * 100,
      currencyCode: 'SGD',
      depositMinor: null,
      recurringAmountMinor: null,
      frequency: 'once',
      propertyAreaSqm: input.floorAreaSqm,
      areaBasis: 'floor',
      floorRange: input.storeyRange,
      tenureKind: 'leasehold',
      tenureStart: `${input.leaseCommenceYear}-01-01`,
      status: 'active',
      localAttributes: { flatType: input.flatType, flatModel: input.flatModel, remainingLease: input.remainingLease },
    },
  });
}

export function projectHdbRentalRecord(input: HdbRentalProjectionInput): GlobalPropertyProjection {
  return freezeProjection({
    entity: hdbEntity(input),
    sourceRecord: { datasetId: 'sg-hdb-rent', businessKey: String(input.sourceRow) },
    observation: {
      kind: 'rent',
      stage: null,
      observedAt: `${input.approvalMonth}-01`,
      amountMinor: null,
      currencyCode: 'SGD',
      depositMinor: null,
      recurringAmountMinor: input.monthlyRentSgd * 100,
      frequency: 'monthly',
      propertyAreaSqm: null,
      areaBasis: null,
      floorRange: null,
      tenureKind: 'leasehold',
      tenureStart: null,
      status: 'active',
      localAttributes: { flatType: input.flatType },
    },
  });
}
