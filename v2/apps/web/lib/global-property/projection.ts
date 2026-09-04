import type { PropertyIdentity } from '@signedprice/market-core';

export type GlobalSourceRecordProjection = Readonly<{
  datasetId: string;
  businessKey: string;
}>;

export type GlobalObservationProjection = Readonly<{
  kind: 'sale' | 'rent';
  stage: string | null;
  observedAt: string;
  amountMinor: number | null;
  currencyCode: 'KRW' | 'SGD';
  depositMinor: number | null;
  recurringAmountMinor: number | null;
  frequency: 'once' | 'monthly' | null;
  propertyAreaSqm: number | null;
  areaBasis: string | null;
  floorRange: string | null;
  tenureKind: 'freehold' | 'leasehold' | null;
  tenureStart: string | null;
  status: 'active' | 'cancelled' | 'corrected' | 'superseded';
  localAttributes: Readonly<Record<string, unknown>>;
}>;

export type GlobalPropertyProjection = Readonly<{
  entity: PropertyIdentity;
  sourceRecord: GlobalSourceRecordProjection;
  observation: GlobalObservationProjection;
}>;

export function freezeProjection(input: GlobalPropertyProjection): GlobalPropertyProjection {
  Object.freeze(input.observation.localAttributes);
  Object.freeze(input.observation);
  Object.freeze(input.sourceRecord);
  return Object.freeze(input);
}
